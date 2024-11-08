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
      const { accessToken, owner, repo } = req.body;

      if (!accessToken || !owner || !repo) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const octokit = new Octokit({ auth: accessToken });

      try {
        // Get the authenticated user's info
        const { data: user } = await octokit.users.getAuthenticated();

        // Get the commits for the repository
        const { data: commits } = await octokit.repos.listCommits({
          owner,
          repo,
          author: user.login,
          per_page: 1,
        });

        const hasCommit = commits.length > 0;

        return res.json({
          hasCommit,
          authenticatedUser: user.login,
          repository: `${owner}/${repo}`,
        });
      } catch (error) {
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
      const { accessToken, owner, repo, startDate, endDate } = req.body;

      if (!accessToken || !owner || !repo || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const octokit = new Octokit({ auth: accessToken });

      try {
        // Get the authenticated user's info
        const { data: user } = await octokit.users.getAuthenticated();

        // Get the pull requests for the repository
        const { data: pullRequests } = await octokit.pulls.list({
          owner,
          repo,
          state: "all",
          sort: "created",
          direction: "desc",
          per_page: 100,
        });

        const start = new Date(startDate);
        const end = new Date(endDate);

        const hasOpenedPR = pullRequests.some((pr) => {
          const createdAt = new Date(pr.created_at);
          return (
            pr.user.login === user.login &&
            createdAt >= start &&
            createdAt <= end
          );
        });

        return res.json({
          hasOpenedPR,
          authenticatedUser: user.login,
          repository: `${owner}/${repo}`,
          timeWindow: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
        });
      } catch (error) {
        console.error("Error verifying pull request:", error);
        return res.status(500).json({ error: "Error verifying pull request" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };
}
