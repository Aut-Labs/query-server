const axios = require("axios");

async function getCommits(owner, repo, username) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const response = await axios.get(url, {
      params: {
        author: username,
        per_page: 100,
      },
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    const commits = response.data;
    console.log(`Commits by ${username} in ${owner}/${repo}:`);
    commits.forEach((commit) => {
      console.log(`- ${commit.sha.substring(0, 7)}: ${commit.commit.message}`);
    });
  } catch (error) {
    console.error("Error fetching commits:", error.message);
  }
}

// const owner = "Aut-Labs";
// const repo = "contracts";
// const username = "pegahcarter";

// getCommits(owner, repo, username);
