import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { verifyTransaction, verifyQuizTask, verifyJoinDiscordTask } from "../services/taskVerifiers";

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


  public verifyQuizTask = async (req: any, res: Response) => {
    try {

      const onboardingPluginAddress: string = req.body.onboardingPluginAddress;
      const taskAddress: string = req.body.taskAddress;
      const taskId: number = req.body.taskId;
      const submitter: string = req.body.submitter;
      const answers: string[] = req.body.answers;
      const finalizedResult = await verifyQuizTask(onboardingPluginAddress, taskAddress, taskId, submitter, answers);
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

  public verifyDiscordJoinTask = async (req: any, res: Response) => {
    try {
      const onboardingPluginAddress: string = req.body.onboardingPluginAddress;
      const taskAddress: string = req.body.taskAddress;
      const taskId: number = req.body.taskId;
      const submitter: string = req.body.submitter;
      const bearerToken: string = req.body.bearerToken;
      const finalizedResult = await verifyJoinDiscordTask(onboardingPluginAddress, taskAddress, taskId, submitter, bearerToken);
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
