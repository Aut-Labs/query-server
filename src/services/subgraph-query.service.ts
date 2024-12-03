import { injectable } from "inversify";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import { LoggerService } from "../tools/logger.service";
import { BaseNFTModel } from "@aut-labs/sdk";

export interface Hub {
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
          id: string;
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


export interface TaskType {
    id: string;
    metadataUri: string;
    taskId: string;
    creator: string;
    metadata: BaseNFTModel<any>;
  }
  

interface AutID {
  id: string;
  owner: string;
  tokenID: string;
  username: string;
  metadataUri: string;
  joinedHubs: Array<{
    id: string;
    role: string;
    commitment: string;
    hubAddress: string;
  }>;
  metadata?: any;
}

const cache: Record<string, any> = {};

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function ipfsCIDToHttpUrl(url: string, nftStorageUrl: string): string {
  if (!url) {
    return url;
  }
  if (!url.includes("https://")) {
    return `${nftStorageUrl}/${replaceAll(url, "ipfs://", "")}`;
  }
  return url;
}

const getMetadataFromCache = (metadataUri: string): any => {
  return cache[metadataUri];
};

const addMetadataToCache = (metadataUri: string, metadata: any): void => {
  cache[metadataUri] = metadata;
};

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
            ipfsCIDToHttpUrl(metadataUri, process.env.IPFS_GATEWAY_URL),
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

@injectable()
export class SubgraphQueryService {
  private graphqlClient: GraphQLClient;

  private taskTypesCache: { [key: string]: TaskType[] } = {};
  private readonly GET_AUTIDS = gql`
    query GetAutIDs($where: AutID_filter) {
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

  private readonly GET_HUBS = gql`
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

  constructor(private readonly loggerService: LoggerService) {
    this.graphqlClient = new GraphQLClient(process.env.GRAPH_API_DEV_URL);
  }

  public async _getAutIdsByHub(hubAddress: string): Promise<AutID[]> {
    const filters = {
      where: {
        joinedHubs_: {
          hubAddress: hubAddress.toLowerCase(),
        },
      },
    };

    try {
      const data = await this.graphqlClient.request<{ autIDs: AutID[] }>(
        this.GET_AUTIDS,
        filters
      );
      return fetchMetadatas(data.autIDs);
    } catch (error) {
      this.loggerService.error(error?.message || JSON.stringify(error));
      return [];
    }
  }

  public async _getHubs(): Promise<Hub[]> {
    try {
      const data = await this.graphqlClient.request<{ hubs: Hub[] }>(
        this.GET_HUBS
      );
      return fetchMetadatas(data.hubs);
    } catch (error) {
      this.loggerService.error(error?.message || JSON.stringify(error));
      return [];
    }
  }

  public async getHubFromAddress(address: string): Promise<Hub | undefined> {
    const hubs = await this._getHubs();
    return hubs.find(
      (hub) => hub.address.toLowerCase() === address.toLowerCase()
    );
  }

  public async getHubFromGuildId(guildId: string): Promise<Hub | undefined> {
    const hubs = await this._getHubs();
    return hubs.find((hub) => {
      const social = hub.metadata?.properties?.socials?.find(
        (s) => s.type === "discord"
      );
      return social?.metadata?.guildId === guildId;
    });
  }

  public async getAutIdsByHub(hubAddress: string): Promise<AutID[]> {
    return this._getAutIdsByHub(hubAddress);
  }

  public _getTaskTypes = async (hubAddress: string): Promise<TaskType[]> => {
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

  public _getHubContributionbyId = async (
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
}
