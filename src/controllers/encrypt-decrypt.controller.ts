import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { AuthSig } from "../models/auth-sig";
import { SdkContainerService } from "../tools/sdk.container";
import {
  AccessControl,
  EncryptDecryptService,
} from "../services/encrypt-decrypt.service";
import { Hub } from "@aut-labs/sdk";

interface EncryptRequest {
  autSig: AuthSig;
  message: string;
  hubAddress: string;
}

@injectable()
export class EncryptDecryptController {
  constructor(
    private loggerService: LoggerService,
    private _sdkContainerService: SdkContainerService,
    private _encryptDecryptService: EncryptDecryptService
  ) {}

  public encrypt = async (req: any, res: Response) => {
    try {
      const { autSig, message, hubAddress }: EncryptRequest = req.body;

      if (!autSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!hubAddress) {
        return res.status(400).send({ error: "hubAddress not provided." });
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
      return res.status(200).send({ hash: encryptionResponse.hash });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({
          error:
            err?.message ?? "Something went wrong, please try again later.",
        });
    }
  };
}
