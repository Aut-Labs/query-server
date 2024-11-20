import axios from "axios";

interface VerifyTwitterRetweetProps {
  accessToken: string;
  contributionId: string;
  tweetUrl: string;
}

interface TwitterUser {
  id: string;
  userName: string;
}

interface RetweetResponse {
    data: TwitterUser[];
    meta?: {
      result_count: number;
      next_token?: string;
    };
  }

export const verifyTwitterRetweet = async ({
  accessToken,
  tweetUrl,
}: VerifyTwitterRetweetProps) => {
  try {
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      return null;
    }
    const tweetId = tweetIdMatch[1];

    const userMeResponse = await axios.get(
      "https://api.twitter.com/2/users/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userId = userMeResponse.data.data.id;

    // Paginate through retweets until finding a match or exhausting results
    let hasRetweeted = false;
    let nextToken: string | undefined = undefined;

    do {
      const params = new URLSearchParams();
      if (nextToken) {
        params.append("pagination_token", nextToken);
      }

      const retweetsResponse = await axios.get(
        `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by${
          params.toString() ? "?" + params.toString() : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
          },
        }
      );

      const responseData: RetweetResponse = retweetsResponse.data;
      const retweets = responseData.data;

      // Check if the user is in the current page of results
      hasRetweeted = retweets.some((retweet) => retweet.id === userId);

      // If we found a match, break the loop
      if (hasRetweeted) {
        break;
      }

      // Get the next token for pagination
      nextToken = responseData.meta?.next_token;

      // If there's no next token, we've reached the end
    } while (nextToken && !hasRetweeted);

    return {
      hasRetweeted,
      targetUser: userMeResponse.data.data.username,
    };
  } catch (error) {
    return null;
  }
};
