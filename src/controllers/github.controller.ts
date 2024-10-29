import { injectable } from "inversify";
import { Request, Response } from "express";
import axios from "axios";
import { Octokit } from "octokit";

@injectable()
export class GithubController {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });
  }

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
          per_page: 1, // We only need to check if there's at least one commit
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
      console.log(error);
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
          per_page: 100, // Adjust as needed
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
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };
}
