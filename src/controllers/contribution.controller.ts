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
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../tools/ethers";
import { Hub } from "@aut-labs/sdk";

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

@injectable()
export class ContributionController {
  constructor(
    private loggerService: LoggerService,
    private _sdkContainerService: SdkContainerService,
    private _encryptDecryptService: EncryptDecryptService
  ) {}

  public commitContribution = async (req: any, res: Response) => {
    try {
      const {
        autSig,
        message,
        hubAddress,
        contributionAddress,
        contributionId,
      }: ContributionRequest = req.body;

      if (!autSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!hubAddress) {
        return res.status(400).send({ error: "hubAddress not provided." });
      }

      if (!contributionId) {
        return res.status(400).send({ error: "contributionId not provided." });
      }

      if (!contributionAddress) {
        return res
          .status(400)
          .send({ error: "contributionAddress not provided." });
      }

      if (!message) {
        return res.status(400).send({ error: "message not provided." });
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

      // const model = new EncryptDecryptModel({
      //   name: "CommitContribution",
      //   description: "Commit Contribution",
      //   properties: {
      //     hash: encryptionResponse.hash,
      //     accessControl,
      //   },
      // });
      // const cid = await this._sdkContainerService.sdk.client.sendJSONToIPFS(
      //   model as any
      // );

      const hubService: Hub = this._sdkContainerService.sdk.initService(
        Hub,
        hubAddress
      );
      const taskManager = await hubService.getTaskManager();
      const response = await taskManager.commitContribution(
        contributionId,
        encryptionResponse.hash
      );

      if (!response.isSuccess) {
        return res
          .status(400)
          .send({
            error: response.errorMessage ?? "Error commiting contribution.",
          });
      }

      return res.status(200).send({ hash: encryptionResponse.hash });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: err?.message ?? "Something went wrong, please try again later." });
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
