import { injectable } from "inversify";
import { LoggerService } from "../services/logger.service";
import { gql, GraphQLClient } from "graphql-request";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
import AutSDK, { Nova } from "@aut-labs/sdk";
import { MumbaiNetwork } from "../services/networks";
import { getSigner } from "../tools/ethers";

const graphqlEndpoint =
  "https://api.studio.thegraph.com/query/63763/aut-mumbai/version/latest";

const fetchNovas = gql`
  query GetNovas {
    novaDAOs(skip: 0, first: 100) {
      id
      deployer
      address
      market
      members
      metadataUri
      minCommitment
    }
  }
`;

const fetchAutIds = gql`
  query GetAutIds {
    autIDs(skip: 0, first: 100) {
      novaAddress
    }
  }
`;

@injectable()
export class ZeelyController {
  private graphqlClient: GraphQLClient;

  constructor(private loggerService: LoggerService) {
    this.graphqlClient = new GraphQLClient(graphqlEndpoint);
  }

  public hasDeployed = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const novasResponse: { novaDAOs: any[] } =
        await this.graphqlClient.request(fetchNovas);
      const novas = novasResponse.novaDAOs;

      for (let i = 0; i < novas.length; i++) {
        const novaDAO = novas[i];
        if (novaDAO.deployer === wallet) {
          return res.status(200).send({ message: "User has deployed" });
        }
      }
      res.status(400).send({ message: "User has not deployed" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };

  public isAdmin = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const response = await this.graphqlClient.request<any>(gql`
      query GetAutID {
        autID(id: "${wallet.toLowerCase()}") {
          novaAddress
        }
      }
    `);
      const networkConfig = MumbaiNetwork();
      const signer = getSigner(MumbaiNetwork());
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer,
      };

      const sdk = AutSDK.getInstance();

      await sdk.init(multiSigner, networkConfig.contracts);

      const nova = sdk.initService<Nova>(Nova, response.autID.novaAddress);
      const isAdmin = await nova.contract.admins.isAdmin(wallet);
      if (isAdmin) {
        return res.status(200).send({ message: "User is an admin" });
      }
      res.status(400).send({ message: "Not an admin" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };

  public has20Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const novasResponse: { novaDAOs: any[] } = await this.graphqlClient
        .request(gql`
        query GetNovas {
          novaDAOs(deployer: "${wallet.toLowerCase()}") {
            deployer
            members
          }
        }
      `);
      const novas = novasResponse.novaDAOs;
      for (let i = 0; i < novas.length; i++) {
        const novaDAO = novas[i];
        if (novaDAO.members > 20) {
          return res.status(200).send({ message: "More than 20 members!" });
        }
      }
      // Implement the logic for has20Members using the provided request data
      // Return a 200 status with a success message if the user has completed the action
      res.status(400).send({ message: "Less than 20 members" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };

  public has50Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const novasResponse: { novaDAOs: any[] } = await this.graphqlClient
        .request(gql`
        query GetNovas {
          novaDAOs(deployer: "${wallet.toLowerCase()}") {
            deployer
            members
          }
        }
      `);
      const novas = novasResponse.novaDAOs;
      for (let i = 0; i < novas.length; i++) {
        const novaDAO = novas[i];
        if (novaDAO.members > 50) {
          return res.status(200).send({ message: "More than 50 members!" });
        }
      }
      // Implement the logic for has20Members using the provided request data
      // Return a 200 status with a success message if the user has completed the action
      res.status(400).send({ message: "Less than 50 members" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };

  public has100Members = async (req, res) => {
    try {
      const { accounts } = req.body;
      const { wallet } = accounts;

      const novasResponse: { novaDAOs: any[] } = await this.graphqlClient
        .request(gql`
        query GetNovas {
          novaDAOs(deployer: "${wallet.toLowerCase()}") {
            deployer
            members
          }
        }
      `);
      const novas = novasResponse.novaDAOs;
      for (let i = 0; i < novas.length; i++) {
        const novaDAO = novas[i];
        if (novaDAO.members > 100) {
          return res.status(200).send({ message: "More than 100 members!" });
        }
      }
      // Implement the logic for has20Members using the provided request data
      // Return a 200 status with a success message if the user has completed the action
      res.status(400).send({ message: "Less than 100 members" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };

  public hasTweeted = async (req, res) => {
    try {
      const { userId, communityId, subdomain, questId, requestId, accounts } =
        req.body;
      // Implement the logic for hasTweeted using the provided request data
      // Return a 200 status with a success message if the user has completed the action
      res.status(200).send({ message: "User completed the action" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      res.status(400).send({ message: "Error message describing the issue" });
    }
  };
}
