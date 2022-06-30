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
      const holder = await getAutID(req.params.username)
      return res.status(200).send(holder);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  }
}
