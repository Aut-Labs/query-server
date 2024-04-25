import { injectable } from "inversify";
import { LoggerService } from "../services/logger.service";
import { gql, GraphQLClient } from "graphql-request";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
import AutSDK, { Nova } from "@aut-labs/sdk";
import { MumbaiNetwork } from "../services/networks";
import { getSigner } from "../tools/ethers";

// TODO: extract in env
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

      const novasResponse: { novaDAOs: any[] } = await this.graphqlClient
        .request(gql`
        query GetNovas {
          novaDAOs(where: {deployer: "${wallet.toLowerCase()}"}) {
            id
            deployer
          }
        }
      `);
      const novas = novasResponse.novaDAOs;

      if (novas.length > 0) {
        return res.status(200).send({ message: "User has deployed" });
      }
      return res.status(400).send({ message: "User has not deployed" });
    } catch (e) {
      this.loggerService.error(e);
      // Return a 400 status with an error message if the action couldn't be verified
      return res
        .status(400)
        .send({ message: "Error message describing the issue" });
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
            novaAddress
          }
        }
      `);

      const { autIDs } = response;
      const autID = autIDs[0];
      if (!autID) {
        return res.status(400).send({ message: "AutId not found" });
      }
      const networkConfig = MumbaiNetwork();
      const signer = getSigner(MumbaiNetwork());
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer,
      };

      const sdk = AutSDK.getInstance();

      await sdk.init(multiSigner, networkConfig.contracts);

      const nova = sdk.initService<Nova>(Nova, autID.novaAddress);
      const isAdmin = await nova.contract.admins.isAdmin(wallet);
      if (isAdmin) {
        return res.status(200).send({ message: "User is an admin" });
      }
      res.status(400).send({ message: "Not an admin" });
    } catch (e) {
      this.loggerService.error(e);
      return res
        .status(400)
        .send({ message: "Error message describing the issue" });
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
            address
          }
        }
      `);

      const novas = novasResponse.novaDAOs;

      const nova = novas[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed nova" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
        query GetAutID {
          autIDs(
            where: { novaAddress: "${nova.address.toLowerCase()}" }
          ) {
            novaAddress
          }
        }
      `);

      if (autIdsResponse.autIDs.length > 20) {
        res.status(200).send({ message: "Nova has more than 20 members" });
      }
      res.status(400).send({ message: "Less than 20 members" });
    } catch (e) {
      this.loggerService.error(e);
      return res
        .status(400)
        .send({ message: "Error message describing the issue" });
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
            address
          }
        }
      `);

      const novas = novasResponse.novaDAOs;

      const nova = novas[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed nova" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
        query GetAutID {
          autIDs(
            where: { novaAddress: "${nova.address.toLowerCase()}" }
          ) {
            novaAddress
          }
        }
      `);

      if (autIdsResponse.autIds.length > 0) {
        res.status(200).send({ message: "Nova has more than 50 members" });
      }
      return res.status(400).send({ message: "Less than 50 members" });
    } catch (e) {
      this.loggerService.error(e);
      return res
        .status(400)
        .send({ message: "Error message describing the issue" });
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
            address
          }
        }
      `);

      const novas = novasResponse.novaDAOs;

      const nova = novas[0];

      if (!nova) {
        return res.status(400).send({ message: "Hasn't deployed nova" });
      }

      const autIdsResponse = await this.graphqlClient.request<any>(gql`
        query GetAutID {
          autIDs(
            where: { novaAddress: "${nova.address.toLowerCase()}" }
          ) {
            novaAddress
          }
        }
      `);

      if (autIdsResponse.autIds.length > 0) {
        res.status(200).send({ message: "Nova has more than 100 members" });
      }
      res.status(400).send({ message: "Less than 100 members" });
    } catch (e) {
      this.loggerService.error(e);
      return res
        .status(400)
        .send({ message: "Error message describing the issue" });
    }
  };
}
