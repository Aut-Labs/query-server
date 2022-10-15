import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getNetworkConfig, getNetworksConfig } from "../services";
import { NetworkConfigEnv } from "../models/config";

@injectable()
export class AutController {
  constructor(private loggerService: LoggerService) {}

  public getLegacyNetwork = async (req: any, res: Response) => {
    try {
      const network = req.params.networkName;
      if (!network) {
        return res.status(400).send({ error: "Network name not provided." });
      }
      const configuration = getNetworkConfig(network);
      if (!configuration)
        return res.status(400).send({ error: "Network not supported." });
      return res.status(200).send({
        ...configuration,
        ...configuration.contracts,
        rpc: configuration.rpcUrls[0],
      });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getNetwork = async (req: any, res: Response) => {
    try {
      const network = req.params.networkName;
      const networkEnv = req.params.networkEnv;
      const avaiableNetEnvs = Object.values(NetworkConfigEnv);

      if (!networkEnv) {
        return res.status(400).send({
          error: `Network env name not provided. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!avaiableNetEnvs.includes(networkEnv)) {
        return res.status(400).send({
          error: `Network env name not supported. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!network) {
        return res.status(400).send({ error: "Network name not provided." });
      }

      const configuration = getNetworkConfig(network, networkEnv);
      if (!configuration)
        return res.status(400).send({ error: `Network not supported. Make sure you using the correct network environment. ${avaiableNetEnvs.join(
          "|"
        )}` });
      return res.status(200).send(configuration);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getNetworks = async (req: any, res: Response) => {
    try {
      const networkEnv = req.params.networkEnv;
      const avaiableNetEnvs = Object.values(NetworkConfigEnv);

      if (!networkEnv) {
        return res.status(400).send({
          error: `Network env name not provided. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!avaiableNetEnvs.includes(networkEnv)) {
        return res.status(400).send({
          error: `Network env name not supported. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      return res.status(200).send(getNetworksConfig(networkEnv));
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
