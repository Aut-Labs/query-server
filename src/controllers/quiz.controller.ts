import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import AutSDK, { Hub } from "@aut-labs/sdk";
import { QuestionsModel } from "../models/question";

const verifyIsAdmin = async (
  userAddress: string,
  hubAddress: string
): Promise<boolean> => {
  const sdk = await AutSDK.getInstance();
  const hub = sdk.initService<Hub>(Hub, hubAddress);
  const isAdmin = await hub.contract.admins.isAdmin(userAddress);
  return isAdmin.data;
};

@injectable()
export class QuizController {
  constructor(private loggerService: LoggerService) {}

  public saveQestions = async (req: any, res: Response) => {
    try {
      if (!req.body.taskAddress) {
        return res.status(400).send("Task Address not provided.");
      }
      if (!req.body.uuid) {
        return res.status(400).send("Task Id not provided.");
      }
      const isAdmin = await verifyIsAdmin(
        req.body.address,
        req.body.taskAddress
      );

      if (!isAdmin) {
        return res.status(401).send("Only admins can add questions.");
      }

      const answers = new QuestionsModel();
      answers.taskAddress = req.body.taskAddress;
      answers.uuid = req.body.uuid;
      answers.questions = req.body.questions;
      await answers.save();
      return res.status(200).send({
        code: 200,
        message: "Success",
      });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public deleteQestions = async (req: any, res: Response) => {
    try {
      if (!req.body.taskAddress) {
        return res.status(400).send("Task Address not provided.");
      }
      if (!req.body.uuid) {
        return res.status(400).send("Task Id not provided.");
      }
      const isAdmin = await verifyIsAdmin(
        req.body.address,
        req.body.taskAddress
      );

      if (!isAdmin) {
        return res.status(401).send("Only admins can delete questions.");
      }
      const result = await QuestionsModel.deleteOne({
        taskAddress: req.body.taskAddress,
        uuid: req.body.uuid,
      });
      return res.status(200).send({
        code: 200,
        message: "Success",
      });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getAllQuestionsAndAnswers = async (req: any, res: Response) => {
    try {
      const questions = await QuestionsModel.find({});
      return res.status(200).send(questions);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getQuestionsAndAnswers = async (req: any, res: Response) => {
    try {
      if (!req.params.taskAddress) {
        return res.status(400).send("Task Address not provided.");
      }

      const isAdmin = await verifyIsAdmin(
        req.query.address,
        req.params.taskAddress
      );

      if (!isAdmin) {
        return res.status(401).send("Only admins can add questions.");
      }

      const questions = await QuestionsModel.findOne({
        taskAddress: req.params.taskAddress,
      });
      return res.status(200).send(questions);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
