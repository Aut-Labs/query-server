import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { verifyTransaction } from "../services/taskVerifiers/transactionTaskVerification";

@injectable()
export class TaskVerifierController {
  constructor(private loggerService: LoggerService) { }

  public verifyTransactionTask = async (req: any, res: Response) => {
    try {

      const pluginAddress: string = req.body.onboardingPluginAddress;
      const taskAddress: string = req.body.taskAddress;
      const taskId: number = req.body.taskId;
      const submitter: string = req.body.submitter;
      const finalizedResult = await verifyTransaction(pluginAddress, taskAddress, taskId, submitter, 'mumbai');
      if (finalizedResult.isFinalized)
        return res.status(200).send(finalizedResult);
      else
        return res.status(400).send(finalizedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
