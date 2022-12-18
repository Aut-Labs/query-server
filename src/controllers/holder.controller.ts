import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getNetworkConfig, getNetworksConfig } from "../services";
import { ethers } from "ethers";
import { getSigner } from "../tools/ethers";
import AutSDK from "@aut-labs-private/sdk";
import { Holder } from "../models/holder";

@injectable()
export class HoldersController {
  constructor(private loggerService: LoggerService) {}

  public get = async (req: any, res: Response) => {
    try {
      const username = req.params.username;
      const networkEnv = req.query.networkEnv;
      const network = req.query.network;

      if (!username) {
        return res.status(400).send({ error: "Username not provided." });
      }
      if (!network) {
        return res.status(400).send({ error: "Network not provided." });
      }

      const networkConfig = getNetworkConfig(network, networkEnv);

      if (!networkConfig) {
        return res.status(400).send({ error: "Network not supported." });
      }

      const signer = getSigner(networkConfig);

      const sdk = AutSDK.getInstance();
      await sdk.init(signer, networkConfig.contracts);

      const holder = await sdk.autID.getAutID({ username });

      if (!holder) {
        return res.status(404).send({ error: "No such autID." });
      }

      return res.status(200).send(holder);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public scanNetworks = async (req: any, res: Response) => {
    try {
      const address = req.params.address;
       const networkEnv = req.query.networkEnv;

      if (!address) {
        return res.status(400).send({ error: "Address not provided." });
      }

      const autIds: Holder[] = [];
      const networkConfigs = getNetworksConfig(networkEnv);
      const sdk = AutSDK.getInstance();

      for (let i = 0; i < networkConfigs.length; i++) {
        const networkConfig = networkConfigs[i];
        const signer = getSigner(networkConfig);
        await sdk.init(signer, networkConfig.contracts);
        const response = await sdk.autID.findAutID(address);

        if (response.isSuccess) {
          autIds.push({
            ...response.data,
            network: networkConfig.network,
            chainId: Number(networkConfig.chainId),
          });
        }
      }
      if (autIds.length < 1) {
        return res.status(404).send({ error: "No such autID." });
      }
      return res.status(200).send(autIds);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
