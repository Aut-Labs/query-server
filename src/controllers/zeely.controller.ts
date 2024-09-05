import { injectable } from "inversify";
import { LoggerService } from "../tools/logger.service";
import { gql, GraphQLClient } from "graphql-request";
import AutSDK, { fetchMetadata, HubNFT, Hub } from "@aut-labs/sdk";
import { Variables } from "graphql-request/build/esm/types";

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

const GET_HUBS_AND_AUTIDS = gql`
  query GetHubs($hub_filter: Hub_filter) {
    hubs(skip: 0, first: 100, where: $hub_filter) {
      id
      address
      domain
      deployer
      minCommitment
      metadataUri
    }
  }
`;

const fetchMetadatas = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const metadata = await fetchMetadata<HubNFT>(
        item.metadataUri,
        process.env.IPFS_GATEWAY
      );
      return {
        ...item,
        metadata,
      };
    })
  );
};

@injectable()
export class ZeelyController {
  private graphqlClient: GraphQLClient;

  constructor(private loggerService: LoggerService) {
    this.graphqlClient = new GraphQLClient(process.env.GRAPH_API_DEV_URL);
  }

  public hasDeployed = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;
      const filters: Variables = {
        where: { deployer: wallet.toLowerCase() },
      };
      const hubs = await this._getHubs(filters);

      if (hubs.length > 0) {
        return res.status(200).send({ message: "User has deployed" });
      }
      return res.status(400).send({ message: "User has not deployed" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      return res.status(400).send({ message: "Something went wrong" });
    }
  };

  public isAdmin = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet, hubAddress } = accounts;
      const filters: Variables = {
        where: { owner: wallet.toLowerCase() },
      };

      const [autID] = await this._getAutIDs(filters);

      if (!autID) {
        return res.status(400).send({ message: "AutId not found" });
      }

      const joinedHubs = autID.joinedHubs.filters((hub) => {
        return hubAddress && hub.hubAddress === hubAddress;
      });

      for (const hub of joinedHubs) {
        const sdk = await AutSDK.getInstance(false);
        const hubService = sdk.initService<Hub>(Hub, hub.hubAddress);
        const isAdminResponse = await hubService.contract.admins.isAdmin(
          wallet
        );
        if (isAdminResponse.data) {
          return res.status(200).send({ message: "User is an admin" });
        }
      }
      res.status(400).send({ message: "Not an admin" });
    } catch (e) {
      this.loggerService.error(e);
      return res.status(400).send({ message: "Something went wrong" });
    }
  };

  public has20Members = async (req, res) => {
    return this._hasReachedMembers(req, res, 20);
  };

  public has50Members = async (req, res) => {
    return this._hasReachedMembers(req, res, 50);
  };

  public has100Members = async (req, res) => {
    return this._hasReachedMembers(req, res, 100);
  };

  public hasAddedAnArchetype = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet, hubAddress } = accounts;
      const filters: Variables = {
        where: { deployer: wallet.toLowerCase() },
      };
      if (hubAddress) {
        filters.where["address"] = hubAddress?.toLowerCase();
      }
      const hubs = await this._getHubs(filters, true);
      if (!hubs.length) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }
      let hasArchetype = false;
      const filteredHubs = hubs.filter((hub) => {
        return hubAddress && hub.address === hubAddress;
      });

      for (const hub of filteredHubs) {
        const metadata = hub.metadata as HubNFT;
        if (metadata.properties.archetype) {
          hasArchetype = true;
          break;
        }
      }
      if (hasArchetype) {
        return res.status(200).send({ message: "Has added an archetype" });
      }
      return res.status(400).send({ message: "Hasn't added an archetype" });
    } catch (e) {
      this.loggerService.error(e);
      return res.status(400).send({ message: "Something went wrong" });
    }
  };

  public hasRegisteredADomain = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet, hubAddress } = accounts;
      const filters: Variables = {
        where: { deployer: wallet.toLowerCase() },
      };
      if (hubAddress) {
        filters.where["address"] = hubAddress?.toLowerCase();
      }
      const hubs = await this._getHubs(filters);
      if (!hubs.length) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }
      let hasAddedDomain = false;
      const filteredHubs = hubs.filter((hub) => {
        return hubAddress && hub.address === hubAddress;
      });
      for (const hub of filteredHubs) {
        if (hub.domain) {
          hasAddedDomain = true;
          break;
        }
      }

      if (hasAddedDomain) {
        return res.status(200).send({ message: "Has added a domain" });
      }
      return res.status(400).send({ message: "Hasn't added a domain" });
    } catch (e) {
      this.loggerService.error(e);
      return res.status(400).send({ message: "Something went wrong" });
    }
  };

  private _hasReachedMembers = async (req, res, maxMembers: number) => {
    try {
      const { accounts } = req.body;
      const { wallet, hubAddress } = accounts;
      const { total, ...perHubCounts } = await this._getAutIDsCountPerHub(
        wallet
      );
      let totalCount = total;

      if (hubAddress) {
        totalCount = perHubCounts[hubAddress];
      }

      if (totalCount >= maxMembers) {
        return res
          .status(200)
          .send({ message: `Hub has reached ${maxMembers} members` });
      }
      return res
        .status(400)
        .send({ message: `Less than ${maxMembers} members` });
    } catch (e) {
      this.loggerService.error(e);
      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  private _getAutIDsCountPerHub = async (
    wallet: string
  ): Promise<{
    total: number;
    [key: string]: number;
  }> => {
    const filters: Variables = {
      where: { deployer: wallet.toLowerCase() },
    };
    const hubs = await this._getHubs(filters);
    const deployedHubs = hubs.map((hub) => hub.address?.toLowerCase());
    const autIds = await this._getAutIDs({
      where: {
        joinedHubs_: {
          hubAddress_in: deployedHubs,
        },
      },
    });
    return hubs.reduce(
      (acc, hub) => {
        const count = autIds.filter(
          (autId) => autId.joinedHubs.hubAddress === hub.address
        ).length;
        return {
          ...acc,
          [hub.address]: count,
        };
      },
      {
        total: autIds.length,
      }
    );
  };

  private _getAutIDs = async (
    variables: Variables,
    includeMetadata = false
  ): Promise<any[]> => {
    return this.graphqlClient
      .request<any>(GET_AUTIDS, variables)
      .then((data) => data.autIDs)
      .then((autIDs) => (includeMetadata ? fetchMetadatas(autIDs) : autIDs))
      .catch((e) => {
        this.loggerService.error(e);
        return [];
      });
  };

  private _getHubs = async (
    variables: Variables,
    includeMetadata = false
  ): Promise<any[]> => {
    return this.graphqlClient
      .request<any>(GET_HUBS_AND_AUTIDS, variables)
      .then((data) => data.hubs)
      .then((hubs) => (includeMetadata ? fetchMetadatas(hubs) : hubs))
      .catch((e) => {
        this.loggerService.error(e);
        return [];
      });
  };
}
