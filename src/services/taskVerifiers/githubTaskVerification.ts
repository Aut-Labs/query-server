import { Octokit } from "@octokit/rest";

interface VerifyCommitProps {
  accessToken: string;
  owner: string;
  repo: string;
  branch: string;
}

export const verifyCommit = async ({
  accessToken,
  owner,
  repo,
  branch,
}: VerifyCommitProps) => {
  try {
    const octokit = new Octokit({ auth: accessToken });

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

    return {
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
    };
  } catch (error) {
    return null;
  }
};

interface VerifyPRProps {
  accessToken: string;
  owner: string;
  repo: string;
  branch: string;
}

export const verifyPullRequest = async ({
  accessToken,
  owner,
  repo,
  branch,
}: VerifyPRProps) => {
  try {
    const octokit = new Octokit({ auth: accessToken });

    // Get the authenticated user's info
    const { data: user } = await octokit.users.getAuthenticated();

    // Get all pull requests for the repository
    const { data: pullRequests } = await octokit.pulls.list({
      owner,
      repo,
    //   state: "closed", // We only want closed PRs since we're looking for merged ones
      sort: "updated",
      direction: "desc",
      per_page: 100,
    });

    // Filter PRs to find merged ones by the authenticated user that target the specified branch
    // const mergedPRs = pullRequests.filter(
    //   (pr) =>
    //     pr.user.login === user.login &&
    //     pr.base.ref === branch && // Check if PR was targeting the specified branch
    //     pr.merged_at !== null // Check if the PR was merged using merged_at property
    // );

    const hasPR = pullRequests.length > 0;

    return {
      hasPR,
      authenticatedUser: user.login,
      repository: `${owner}/${repo}`,
      branch,
      pullRequest: hasPR
        ? {
            number: pullRequests[0].number,
            title: pullRequests[0].title,
            mergedAt: pullRequests[0].merged_at,
            url: pullRequests[0].html_url,
          }
        : null,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
