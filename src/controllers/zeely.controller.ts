import { injectable } from "inversify";
import { LoggerService } from "../services/logger.service";
import { gql, GraphQLClient } from "graphql-request";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
import AutSDK, { fetchMetadata, Nova } from "@aut-labs/sdk";
import { AmoyNetwork } from "../services/networks";
import { getSigner } from "../tools/ethers";
import axios from "axios";
import { NetworkConfig } from "../models/config";

@injectable()
export class ZeelyController {
  private graphqlClient: GraphQLClient;
  private networkConfig: NetworkConfig;

  constructor(
    graphApiUrl: string,
    networkConfig: NetworkConfig,
    private loggerService: LoggerService
  ) {
    this.graphqlClient = new GraphQLClient(graphApiUrl);
    this.networkConfig = networkConfig;
  }

  public hasDeployed = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query GetHubs {
          hubs(where: {deployer: "${wallet.toLowerCase()}"}) {
            id
            deployer
          }
        }
      `);
      const hubs = hubsResponse.hubs;

      if (hubs.length > 0) {
        return res.status(200).send({ message: "User has deployed" });
      }
      return res.status(400).send({ message: "User has not deployed" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );

      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public isAdmin = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const response = await this.graphqlClient.request<any>(gql`
        query GetAutID {
          autIDs(
            where: { owner: "${wallet.toLowerCase()}" }
          ) {
             joinedHubs(first: 100) {
              id
              hubAddress
            }
          }
        }
      `);
      const { autIDs = [] } = response;
      const autID = autIDs[0];
      if (!autID) {
        return res.status(400).send({ message: "AutId not found" });
      }

      const sdk = await AutSDK.getInstance();

      for (const hub of autID.joinedHubs) {
        const nova = sdk.initService<Nova>(Nova, hub.hubAddress);
        const isAdmin = await nova.contract.admins.isAdmin(wallet);
        if (isAdmin) {
          return res.status(200).send({ message: "User is an admin" });
        }
      }
      res.status(400).send({ message: "Not an admin" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );
      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public has20Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query Gethubs {
          hubs(
            where: { deployer: "${wallet.toLowerCase()}" }
          ) {
            deployer
            address
          }
        }
      `);

      const hubs = hubsResponse.hubs;

      const nova = hubs[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
      query GetAutIds {
        autIDs(where: { novaAddress: "${nova.address.toLowerCase()}" }, first: 10000){
          novaAddress
        }
      }
    `);

      const numberOfMembers = autIdsResponse.autIDs.length;

      if (numberOfMembers > 20) {
        return res
          .status(200)
          .send({ message: "Nova has more than 20 members" });
      }
      return res.status(400).send({ message: "Less than 20 members" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );
      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public has50Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query Gethubs {
          hubs(
            where: { deployer: "${wallet.toLowerCase()}" }
          ) {
            deployer
            address
          }
        }
      `);

      const hubs = hubsResponse.hubs;

      const nova = hubs[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
      query GetAutIds {
        autIDs(where: { novaAddress: "${nova.address.toLowerCase()}" }, first: 10000){
          novaAddress
        }
      }
    `);

      const numberOfMembers = autIdsResponse.autIDs.length;

      if (numberOfMembers > 50) {
        return res
          .status(200)
          .send({ message: "Nova has more than 50 members" });
      }
      return res.status(400).send({ message: "Less than 50 members" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );
      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public has100Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query Gethubs {
          hubs(
            where: { deployer: "${wallet.toLowerCase()}" }
          ) {
            deployer
            address
          }
        }
      `);

      const hubs = hubsResponse.hubs;

      const nova = hubs[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
      query GetAutIds {
        autIDs(where: { novaAddress: "${nova.address.toLowerCase()}" }, first: 10000){
          novaAddress
        }
      }
    `);

      const numberOfMembers = autIdsResponse.autIDs.length;

      if (numberOfMembers > 100) {
        return res
          .status(200)
          .send({ message: "Nova has more than 100 members" });
      }
      return res.status(400).send({ message: "Less than 100 members" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );

      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public hasAddedAnArchetype = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query Gethubs {
          hubs(
            where: { deployer: "${wallet.toLowerCase()}" }
          ) {
            deployer
            address
            metadataUri
          }
        }
      `);
      const hubs = hubsResponse.hubs;

      const nova = hubs[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }
      let ipfsHash = nova.metadataUri;
      const prefix = "ipfs://";
      if (ipfsHash.startsWith(prefix)) {
        ipfsHash = ipfsHash.substring(prefix.length);
      }
      const novaMetadata = await axios.get(
        `${process.env.IPFS_GATEWAY}/${ipfsHash}`
      );

      if (novaMetadata?.data?.properties?.archetype?.default) {
        return res.status(200).send({ message: "Has added an archetype" });
      }
      return res.status(400).send({ message: "Hasn't added an archetype" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );
      return res.status(500).send({ message: "Something went wrong" });
    }
  };

  public hasRegisteredADomain = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const hubsResponse: { hubs: any[] } = await this.graphqlClient
        .request(gql`
        query Gethubs {
          hubs(
            where: { deployer: "${wallet.toLowerCase()}" }
          ) {
            deployer
            address
            domain
          }
        }
      `);
      const hubs = hubsResponse.hubs;

      const nova = hubs[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed hub" });
      }
      if (nova?.domain) {
        return res.status(200).send({ message: "Has added a domain" });
      }
      return res.status(400).send({ message: "Hasn't added a domain" });
    } catch (e) {
      this.loggerService.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          error: e,
          stack: e.stack,
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
        })
      );
      return res.status(500).send({ message: "Something went wrong" });
    }
  };
}
