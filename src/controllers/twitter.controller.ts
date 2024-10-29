import { injectable } from "inversify";
import { Request, Response } from "express";
import axios from "axios";
import { gql, GraphQLClient } from "graphql-request";
import { AuthSig } from "../models/auth-sig";
import { SdkContainerService } from "../tools/sdk.container";

interface ClaimRoleRequest {
  authSig: AuthSig;
  message: string;
  hubAddress: string;
  discordAccessToken: string;
}

interface Hub {
  id: string;
  address: string;
  domain: string;
  deployer: string;
  minCommitment: string;
  metadataUri: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    properties: {
      market: number;
      deployer: string;
      minCommitment: string;
      rolesSets: Array<{
        roleSetName: string;
        roles: Array<{
          id: number;
          roleName: string;
        }>;
      }>;
      timestamp: number;
      socials: Array<{
        type: string;
        link: string;
        metadata: {
          guildId?: string;
          guildName?: string;
        };
      }>;
    };
  };
}

const cache: any = {};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

const getMetadataFromCache = (metadataUri: string) => {
  return cache[metadataUri];
};

const addMetadataToCache = (metadataUri: string, metadata: any) => {
  cache[metadataUri] = metadata;
  console.log(cache);
};

function ipfsCIDToHttpUrl(url: string, nftStorageUrl: string) {
  if (!url) {
    return url;
  }
  if (!url.includes("https://"))
    return `${nftStorageUrl}/${replaceAll(url, "ipfs://", "")}`;
  return url;
}

const fetchMetadatas = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const { metadataUri } = item;
      if (!metadataUri) return;
      let result = getMetadataFromCache(metadataUri);
      console.log("cache used!", result);
      if (!result) {
        try {
          const response = await fetch(
            ipfsCIDToHttpUrl(metadataUri, process.env.IPFS_GATEWAY),
            {
              method: "GET",
              // headers: {
              //   "Content-Type": "application/json"
              // }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          result = await response.json();
          addMetadataToCache(metadataUri, result);
        } catch (error) {
          console.warn(error);
        }
      }
      return {
        ...item,
        metadata: result,
      };
    })
  );
};

interface TwitterUser {
  id: string;
  userName: string;
}

@injectable()
export class TwitterController {
  private graphqlClient: GraphQLClient;
  private _sdkService: SdkContainerService;

  private _getAutIdsByHub = async (hubAddress: string): Promise<any[]> => {
    const filters = {
      where: {
        joinedHubs_: {
          hubAddress: hubAddress,
        },
      },
    };
    const GET_AUTIDS = gql`
      query GeAutIDs($where: AutID_filter) {
        autIDs(skip: 0, first: 100, where: $where) {
          id
          owner
          tokenID
          username
          metadataUri
          joinedHubs {
            id
            role
            commitment
            hubAddress
          }
        }
      }
    `;
    return this.graphqlClient
      .request<any>(GET_AUTIDS, filters)
      .then((data) => data.autIDs)
      .then((autIDs) => fetchMetadatas(autIDs))
      .catch((e) => {
        console.error("Error fetching hubs:", e);
        return [];
      });
  };

  private _getHubs = async (): Promise<any[]> => {
    const query = gql`
      query GetHubs {
        hubs(first: 1000) {
          id
          address
          domain
          deployer
          minCommitment
          metadataUri
        }
      }
    `;

    return this.graphqlClient
      .request<any>(query)
      .then((data) => data.hubs)
      .then((hubs) => fetchMetadatas(hubs))
      .catch((e) => {
        console.error("Error fetching hubs:", e);
        return [];
      });
  };

  public verifyTwitterFollow = async (req: Request, res: Response) => {
    try {
      const { oauth2Token, targetScreenName } = req.body;

      if (!oauth2Token || !targetScreenName) {
        return res
          .status(400)
          .json({ error: "Missing oauth2Token or targetScreenName" });
      }

      try {
        // Get the target user's info by screen name
        const targetUserResponse = await axios.get(
          `https://api.twitter.com/2/users/by/username/Antonio69459346`,
          {
            headers: {
              Authorization: `Bearer ${process.env.X_CONSUMER_API_KEY}`,
            },
          }
        );

        const targetUser: TwitterUser = targetUserResponse.data.data;

        // console.log(userResponse);

        // const authenticatedUser: TwitterUser = userResponse.data;

        // Now, check if the authenticated user is following the target account
        const followersResponse = await axios.get(
          "https://api.twitter.com/1.1/followers/list.json",
          {
            params: {
              screen_name: targetScreenName,
              count: 200, // Adjust as needed, max is 200
              skip_status: true,
              include_user_entities: false,
            },
            headers: {
              Authorization: `Bearer ${process.env.X_CONSUMER_API_KEY}`,
            },
          }
        );

        const followers: TwitterUser[] = followersResponse.data.users;

        const isFollowing = followers.some(
          (follower) => follower.id === targetUser.id
        );

        return res.json({
          isFollowing,
          authenticatedUser: targetUser.userName,
          targetUser: targetScreenName,
        });
      } catch (error) {
        console.error("Error verifying follow status:", error);
        return res.status(500).json({ error: "Error verifying follow status" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public verifyTwitterRetweet = async (req: Request, res: Response) => {
    try {
      const { accessToken, contributionId, tweetUrl } = req.body;

      if (!accessToken || !contributionId || !tweetUrl) {
        return res
          .status(400)
          .json({ error: "Missing oauth2Token or contributionId or tweetUrl" });
      }
      const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
      if (!tweetIdMatch) {
        return res.status(400).json({ error: "Invalid tweet URL" });
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
      try {
        // Get the target user's info by screen name
        const retweetsResponse = await axios.get(
          `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by`,
          {
            headers: {
              Authorization: `Bearer ${process.env.X_API_BEARER_TOKEN}`,
            },
          }
        );

        const retweets: TwitterUser[] = retweetsResponse.data.data;

        const hasRetweeted = retweets.some((retweet) => retweet.id === userId);

        return res.json({
          hasRetweeted,
          targetUser: userMeResponse.data.data.username,
        });
      } catch (error) {
        console.error("Error verifying retweet status:", error);
        return res.status(500).json({ error: "Error verifying retweet status" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };
}
