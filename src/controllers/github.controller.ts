import { injectable } from "inversify";
import { Request, Response } from "express";
import { Octokit } from "@octokit/rest";

@injectable()
export class GithubController {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_ACCESS_TOKEN,
    });
  }

  public listOrgRepositories = async (req: Request, res: Response) => {
    try {
      const { organisationName } = req.body;

      if (!organisationName) {
        return res.status(400).json({ error: "Missing organisationName" });
      }

      try {
        // First, get the organization's login name using the ID
        // const { data: org } = await this.octokit.orgs.get({
        //   org_id: parseInt(organisationId, 10),
        //   org: "",
        // });

        // List all public repositories for the organization
        const { data: repositories } = await this.octokit.repos.listForOrg({
          org: organisationName,
          type: "public",
          per_page: 100,
          sort: "full_name",
          direction: "asc",
        });

        // Map the repositories to a cleaner response format
        const formattedRepos = repositories.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          defaultBranch: repo.default_branch,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          isArchived: repo.archived,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
        }));

        return res.json({
          organization: {
            // id: org.id,
            // login: org.login,
            // name: org.name,
            // description: org.description,
            // avatarUrl: org.avatar_url,
          },
          repositories: formattedRepos,
          totalCount: formattedRepos.length,
        });
      } catch (error) {
        console.error("Error listing organization repositories:", error);
        if (error.status === 404) {
          return res.status(404).json({ error: "Organization not found" });
        }
        return res
          .status(500)
          .json({ error: "Error listing organization repositories" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public listBranches = async (req: Request, res: Response) => {
    try {
      const { repositoryName, organisationName } = req.body;

      if (!repositoryName) {
        return res
          .status(400)
          .json({ error: "Missing required parameter: repositoryName" });
      }

      try {
        // Split repository name to get owner and repo (assuming format: owner/repo)
        // const [owner, repo] = repositoryName.split("/");

        // if (!owner || !repo) {
        //   return res
        //     .status(400)
        //     .json({
        //       error:
        //         "Invalid repository name format. Expected format: owner/repo",
        //     });
        // }

        // List all branches for the repository
        const { data: branches } = await this.octokit.repos.listBranches({
          owner: organisationName,
          repo: repositoryName,
          per_page: 100,
          protected: false, // Include both protected and unprotected branches
        });

        // Map the branches to a cleaner response format
        const formattedBranches = branches.map((branch) => ({
          name: branch.name,
          sha: branch.commit.sha,
          url: branch.commit.url,
          protected: branch.protected,
        }));

        return res.json({
          repository: repositoryName,
          branches: formattedBranches,
          totalCount: formattedBranches.length,
        });
      } catch (error) {
        console.error("Error listing repository branches:", error);
        if (error.status === 404) {
          return res.status(404).json({ error: "Repository not found" });
        }
        return res
          .status(500)
          .json({ error: "Error listing repository branches" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getUserOrganisations = async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Missing access token" });
      }

      const octokit = new Octokit({ auth: accessToken });

      try {
        // Get the authenticated user's info
        const { data: user } = await octokit.users.getAuthenticated();

        // Get the user's organizations (both public and private)
        const { data: organizations } =
          await octokit.orgs.listForAuthenticatedUser({
            per_page: 100,
            visibility: "all", // Changed to 'all' to check all organizations
          });

        // Filter organizations where user is an owner
        const ownedOrgs = await Promise.all(
          organizations.map(async (org) => {
            try {
              // Get user's membership status in the organization
              const { data: membership } =
                await octokit.orgs.getMembershipForAuthenticatedUser({
                  org: org.login,
                });

              // Only include if user is an owner and org is public
              if (membership.role === "admin") {
                return {
                  id: org.id,
                  name: org.login,
                  login: org.login,
                  description: org.description,
                  avatarUrl: org.avatar_url,
                  url: org.url,
                  role: membership.role,
                };
              }
              return null;
            } catch (error) {
              console.error(
                `Error checking membership for org ${org.login}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null values and only return public organizations
        const filteredOrgs = ownedOrgs.filter(
          (org): org is NonNullable<typeof org> => org !== null
        );

        return res.json({
          authenticatedUser: user.login,
          organizations: filteredOrgs,
          totalCount: filteredOrgs.length,
        });
      } catch (error) {
        console.error("Error fetching organizations:", error);
        return res.status(500).json({ error: "Error fetching organizations" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public verifyCommit = async (req: Request, res: Response) => {
    try {
      const { accessToken, owner, repo, branch } = req.body;

      if (!accessToken || !owner || !repo || !branch) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const octokit = new Octokit({ auth: accessToken });

      try {
        // Get the authenticated user's info
        const { data: user } = await octokit.users.getAuthenticated();

        // Get the commits for the repository on the specific branch
        const { data: commits } = await octokit.repos.listCommits({
          owner,
          repo,
          sha: branch, // Specify the branch
          author: user.login,
          per_page: 1,
        });

        const hasCommit = commits.length > 0;

        return res.json({
          hasCommit,
          authenticatedUser: user.login,
          repository: `${owner}/${repo}`,
          branch,
          commit: hasCommit
            ? {
                sha: commits[0].sha,
                message: commits[0].commit.message,
                date: commits[0].commit.author?.date,
              }
            : null,
        });
      } catch (error) {
        // Check if the error is due to branch not found
        if (error.status === 404) {
          return res.status(404).json({
            error: "Branch not found or repository is empty",
          });
        }

        console.error("Error verifying commit:", error);
        return res.status(500).json({ error: "Error verifying commit" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public verifyPullRequest = async (req: Request, res: Response) => {
    try {
      const { accessToken, owner, repo, branch } = req.body;

      if (!accessToken || !owner || !repo || !branch) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const octokit = new Octokit({ auth: accessToken });

      try {
        // Get the authenticated user's info
        const { data: user } = await octokit.users.getAuthenticated();

        // Get all pull requests for the repository
        const { data: pullRequests } = await octokit.pulls.list({
          owner,
          repo,
          state: "closed", // We only want closed PRs since we're looking for merged ones
          sort: "updated",
          direction: "desc", 
          per_page: 100,
        });

        // Filter PRs to find merged ones by the authenticated user that target the specified branch
        const mergedPRs = pullRequests.filter(
          (pr) =>
            pr.user.login === user.login &&
            pr.base.ref === branch && // Check if PR was targeting the specified branch
            pr.merged_at !== null // Check if the PR was merged using merged_at property
        );

        const hasMergedPR = mergedPRs.length > 0;

        return res.json({
          hasMergedPR,
          authenticatedUser: user.login,
          repository: `${owner}/${repo}`,
          branch,
          pullRequest: hasMergedPR
            ? {
                number: mergedPRs[0].number,
                title: mergedPRs[0].title,
                mergedAt: mergedPRs[0].merged_at,
                url: mergedPRs[0].html_url,
              }
            : null,
        });
      } catch (error) {
        // Check if the error is due to branch not found
        if (error.status === 404) {
          return res.status(404).json({
            error: "Branch not found or repository doesn't exist",
          });
        }

        console.error("Error verifying pull request:", error);
        return res.status(500).json({ error: "Error verifying pull request" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };
}
