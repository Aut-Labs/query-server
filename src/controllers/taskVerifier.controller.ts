import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import {
  verifyTransaction,
  verifyQuizTask,
  verifyJoinDiscordTask,
} from "../services/taskVerifiers";
import { Question } from "../models/question";

@injectable()
export class TaskVerifierController {
  constructor(private loggerService: LoggerService) { }

  public verifyTransactionTask = async (req: any, res: Response) => {
    try {
      const pluginAddress: string = req.body.onboardingPluginAddress;
      const taskAddress: string = req.body.taskAddress;
      const taskId: number = req.body.taskId;
      const submitter: string = req.body.address;
      console.log('submitter', submitter);
      const finalizedResult = await verifyTransaction(
        pluginAddress,
        taskAddress,
        taskId,
        submitter
      );
      if (finalizedResult.isFinalized)
        return res.status(200).send(finalizedResult);
      else return res.status(400).send(finalizedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public verifyQuizTask = async (req: any, res: Response) => {
    try {
      const submitter: string = req.body.address;

      const onboardingPluginAddress: string = req.body.onboardingPluginAddress;
      if (!onboardingPluginAddress) {
        return res
          .status(400)
          .send({ error: "onboardingPluginAddress not provided." });
      }
      const taskAddress: string = req.body.taskAddress;
      if (!taskAddress) {
        return res.status(400).send({ error: "taskAddress not provided." });
      }
      const taskId: number = req.body.taskId;
      if (!taskId) {
        return res.status(400).send({ error: "taskId not provided." });
      }

      const uuid: string = req.body.uuid;
      if (!uuid) {
        return res.status(400).send({ error: "uuid not provided." });
      }
      const userQuestionsAndAnswers: Question[] = req.body.questionsAndAnswers;
      if (!userQuestionsAndAnswers?.length) {
        return res.status(400).send({ error: "answers not provided." });
      }
      const finalizedResult = await verifyQuizTask(
        onboardingPluginAddress,
        taskAddress,
        taskId,
        uuid,
        submitter,
        userQuestionsAndAnswers
      );
      if (finalizedResult.isFinalized)
        return res.status(200).send(finalizedResult);
      else return res.status(400).send(finalizedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public verifyDiscordJoinTask = async (req: any, res: Response) => {
    try {
      const submitter: string = req.body.address;
      console.log('submitter', submitter);

      const onboardingPluginAddress: string = req.body.onboardingPluginAddress;
      if (!onboardingPluginAddress) {
        return res
          .status(400)
          .send({ error: "onboardingPluginAddress not provided." });
      }
      const taskAddress: string = req.body.taskAddress;
      if (!taskAddress) {
        return res.status(400).send({ error: "taskAddress not provided." });
      }
      const taskId: number = req.body.taskId;
      if (!taskId) {
        return res.status(400).send({ error: "taskId not provided." });
      }
      const bearerToken: string = req.body.bearerToken;
      if (!bearerToken) {
        return res.status(400).send({ error: "bearerToken not provided." });
      }
      const finalizedResult = await verifyJoinDiscordTask(
        onboardingPluginAddress,
        taskAddress,
        taskId,
        submitter,
        bearerToken
      );
      if (finalizedResult.isFinalized)
        return res.status(200).send(finalizedResult);
      else return res.status(400).send(finalizedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
