import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getNetworkConfig, getNetworksConfig } from "../services";

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
      if (!network) {
        return res.status(400).send({ error: "Network name not provided." });
      }
      const configuration = getNetworkConfig(network);
      if (!configuration)
        return res.status(400).send({ error: "Network not supported." });
      return res.status(200).send(configuration);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getNetworks = async (_: any, res: Response) => {
    try {
      return res.status(200).send(getNetworksConfig());
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
