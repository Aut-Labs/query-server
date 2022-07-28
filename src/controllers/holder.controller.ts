import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getAutID } from "../services";

@injectable()
export class HoldersController {
  constructor(
    private loggerService: LoggerService,
  ) {

  }

  public get = async (req: any, res: Response) => {
    try {
      console.log(req.params.username)
      const holder = await getAutID(req.params.username)
      return res.status(200).send(holder);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }


  public getConfig = async (_: any, res: Response) => {
    try {
      return res.status(200).send({
        autIDAddress: process.env.AUTID_CONTRACT_ADDRESS,
        communityRegistryAddress: process.env.COMMUNITY_REGISTRY_ADDRESS
      });
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }
}
