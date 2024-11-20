import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { AuthSig } from "../models/auth-sig";
import { SdkContainerService } from "../tools/sdk.container";
import {
  AccessControl,
  EncryptDecryptModel,
  EncryptDecryptService,
} from "../services/encrypt-decrypt.service";
import { ethers, getJSONFromURI } from "../tools/ethers";
import { BaseNFTModel, Hub } from "@aut-labs/sdk";
import { gql, GraphQLClient } from "graphql-request";
import { verifyPullRequest } from "../services/taskVerifiers/githubTaskVerification";
import { verifyTwitterRetweet } from "../services/taskVerifiers/twitterVerification";
import { verifyCommit } from "../services/taskVerifiers/githubTaskVerification";

interface ContributionRequest {
  autSig: AuthSig;
  message: string;
  hubAddress: string;
  contributionAddress: string;
  contributionId: string;
}

interface ViewContributionsByHashes {
  autSig: AuthSig;
  hashes: string[];
}

interface ViewContributionsByCids {
  autSig: AuthSig;
  cids: string[];
}

const cache: any = {};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function ipfsCIDToHttpUrl(url: string, nftStorageUrl: string) {
  if (!url) {
    return url;
  }
  if (!url.includes("https://"))
    return `${nftStorageUrl}/${replaceAll(url, "ipfs://", "")}`;
  return url;
}

const getMetadataFromCache = (metadataUri: string) => {
  return cache[metadataUri];
};

const addMetadataToCache = (metadataUri: string, metadata: any) => {
  cache[metadataUri] = metadata;
};

const fetchMetadatas = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const { metadataUri } = item;
      if (!metadataUri) return item;

      let result = getMetadataFromCache(metadataUri);
      if (!result) {
        try {
          const url = ipfsCIDToHttpUrl(
            metadataUri,
            process.env.IPFS_GATEWAY_URL
          );
          const response = await fetch(
            ipfsCIDToHttpUrl(metadataUri, process.env.IPFS_GATEWAY_URL),
            { method: "GET" }
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

interface TaskType {
  id: string;
  metadataUri: string;
  taskId: string;
  creator: string;
  metadata: BaseNFTModel<any>;
}

@injectable()
export class ContributionController {
  private graphqlClient: GraphQLClient;
  private taskTypesCache: { [key: string]: TaskType[] } = {};
  constructor(
    private loggerService: LoggerService,
    private _sdkContainerService: SdkContainerService,
    private _encryptDecryptService: EncryptDecryptService
  ) {
    this.graphqlClient = new GraphQLClient(process.env.GRAPH_API_DEV_URL);
  }

  private _getTaskTypes = async (hubAddress: string): Promise<TaskType[]> => {
    if (this.taskTypesCache[hubAddress]) {
      return this.taskTypesCache[hubAddress];
    }

    const query = gql`
      query GetTaskTypes($where: HubAdmin_filter) {
        tasks(first: 1000, where: $where) {
          id
          metadataUri
          taskId
          creator
        }
      }
    `;

    const tasks = await this.graphqlClient
      .request<any>(query)
      .then((data) => data.tasks)
      .then((tasks) => fetchMetadatas(tasks))
      .catch((e) => {
        this.loggerService.error(JSON.stringify(e));
        return [];
      });

    this.taskTypesCache[hubAddress] = tasks;
    return tasks;
  };

  private _getHubContributionbyId = async (
    contributionId: string
  ): Promise<any> => {
    const query = gql`
      query GetContribution($id: ID!) {
        contribution(id: $id) {
          id
          taskId
          role
          startDate
          endDate
          points
          quantity
          descriptionId
        }
      }
    `;

    const variables = {
      id: contributionId,
    };

    return this.graphqlClient
      .request<any>(query, variables)
      .then((data) => data.contribution)
      .catch((e) => {
        this.loggerService.error(JSON.stringify(e));
        return null;
      });
  };

  public commitContribution = async (req: any, res: Response) => {
    try {
      let { message } = req.body;
      const { autSig, hubAddress, contributionId }: ContributionRequest =
        req.body;

      if (!autSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!hubAddress) {
        return res.status(400).send({ error: "hubAddress not provided." });
      }

      if (!contributionId) {
        return res.status(400).send({ error: "contributionId not provided." });
      }

      if (!message) {
        return res.status(400).send({ error: "message not provided." });
      }

      const taskTypes = await this._getTaskTypes(hubAddress);

      const contribution = await this._getHubContributionbyId(contributionId);

      const correspondingTask = taskTypes.find(
        (taskType) => taskType.id === contribution.taskId
      );

      const taskType = correspondingTask?.metadata?.properties?.type;

      let canAutoGivePoints = false;

      switch (taskType) {
        case "GitHubCommit":
          canAutoGivePoints = true;
          const commitRes = await verifyCommit(JSON.parse(message));
          if (commitRes && commitRes.hasCommit) {
            message = JSON.stringify(commitRes);
            break;
          } else if(commitRes && !commitRes.hasCommit){
            return res.status(400).send({
              error: `User hasn't committed to the branch.`,
            });
          }
          return res.status(500).send({
            error: `Failed to verify commit.`,
          });
        case "GitHubOpenPR":
          canAutoGivePoints = true;
          const prRes = await verifyPullRequest(JSON.parse(message));
          if (prRes && prRes.hasPR) {
            message = JSON.stringify(prRes);
            break;
          } else if(prRes && !prRes.hasPR){
            return res.status(400).send({
              error: `User hasn't opened a PR to the branch.`,
            });
          }
          return res.status(500).send({
            error: `Failed to verify PR.`,
          });
        case "TwitterRetweet":
          canAutoGivePoints = true;
          const retweetRes = await verifyTwitterRetweet(JSON.parse(message));
          if (retweetRes && retweetRes.hasRetweeted) {
            message = JSON.stringify(retweetRes);
            break;
          } else if(retweetRes && !retweetRes.hasRetweeted){
            return res.status(400).send({
              error: `User hasn't retweeted.`,
            });
          }
          return res.status(500).send({
            error: `Failed to verify retweet.`,
          });

        default:
          break;
      }

      const accessControl: AccessControl = {
        hubAddress,
        roles: ["admin"],
      };

      const encryptionResponse = await this._encryptDecryptService.encrypt({
        autSig,
        message,
        accessControl,
      });

      if (!encryptionResponse.isSuccess) {
        return res.status(400).send({ error: encryptionResponse.error });
      }

      const hubService: Hub = this._sdkContainerService.sdk.initService(
        Hub,
        hubAddress
      );
      const address = await this._sdkContainerService.veryifySignature(autSig);
      const taskManager = await hubService.getTaskManager();

      const response = await taskManager.commitContribution(
        contributionId,
        address,
        ethers.toUtf8Bytes(encryptionResponse.hash) as any
      );
      if (!response.isSuccess) {
        return res.status(400).send({
          error: response.errorMessage ?? "Error commiting contribution.",
        });
      }

      if (canAutoGivePoints) {
        const pointsResponse = await taskManager.giveContribution(
          contributionId,
          address
        );
        if (!pointsResponse.isSuccess) {
          return res.status(500).send({
            error: pointsResponse.errorMessage ?? "Error giving points.",
          });
        }
      }

      return res.status(200).send({ hash: encryptionResponse.hash });
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({
        error: err?.message ?? "Something went wrong, please try again later.",
      });
    }
  };

  public viewContributionsByHashes = async (req: any, res: Response) => {
    try {
      const { autSig, hashes }: ViewContributionsByHashes = req.body;

      if (!autSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!hashes) {
        return res.status(400).send({ error: "hashes not provided." });
      }
      const decryptedMessages = [];
      for (const hash of hashes) {
        const decryptionResponse = await this._encryptDecryptService.decrypt({
          autSig,
          hash,
        });
        decryptedMessages.push(decryptionResponse);
      }
      return res.status(200).send(decryptedMessages);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public viewContributionsByCids = async (req: any, res: Response) => {
    try {
      const { autSig, cids }: ViewContributionsByCids = req.body;

      if (!autSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!cids) {
        return res.status(400).send({ error: "cids not provided." });
      }

      const decryptedMessages = [];

      for (const cid of cids) {
        const ipfsJson = await getJSONFromURI(
          ipfsCIDToHttpUrl(cid, process.env.IPFS_GATEWAY_URL as string)
        );
        const parsedModel = new EncryptDecryptModel(ipfsJson);
        const decryptionResponse = await this._encryptDecryptService.decrypt({
          autSig,
          hash: parsedModel.properties.hash,
        });
        decryptedMessages.push(decryptionResponse);
      }
      return res.status(200).send(decryptedMessages);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
