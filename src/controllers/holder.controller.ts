import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getAutID, getNetworkConfig } from "../services";

@injectable()
export class HoldersController {
  constructor(
    private loggerService: LoggerService,
  ) {}

  public get = async (req: any, res: Response) => {
    try {
      const username = req.params.username;
      const network = req.query.network;
      if (!username)
        return res.status(400).send({ error: "Username not provided." });
      if (!network)
        return res.status(400).send({ error: "Network not provided." });
      if (!getNetworkConfig(network))
        return res.status(400).send({ error: "Network not supported." });

      const holder = await getAutID(username, network);
      if(!holder) {
        return res.status(404).send({ error: "No such autID." });
      }
      return res.status(200).send(holder);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }
}
