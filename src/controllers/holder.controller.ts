import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getAutID, getConfiguration } from "../services";

@injectable()
export class HoldersController {
  constructor(
    private loggerService: LoggerService,
  ) {

  }

  public get = async (req: any, res: Response) => {
    try {
      const username = req.params.username;
      const network = req.query.network;
      if (!username)
        return res.status(400).send({ error: "Username not provided." });
      if (!network)
        return res.status(400).send({ error: "Network not provided." });
      if (network !== 'mumbai' && network !== 'goerli')
        return res.status(400).send({ error: "Network not supported." });

      const holder = await getAutID(username, network)
      return res.status(200).send(holder);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }


  public getConfig = async (req: any, res: Response) => {
    try {
      const network = req.params.network;
      if (!network) {
        return res.status(400).send({ error: "Network not provided." });
      }
      const configuration = getConfiguration(network);
      if (!configuration)
        return res.status(400).send({ error: "Network not supported." });
      return res.status(200).send(configuration);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }
}
