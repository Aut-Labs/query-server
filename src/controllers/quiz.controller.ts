import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import AutSDK, { Nova } from "@aut-labs/sdk";
import { QuestionsModel } from "../models/question";

const verifyIsAdmin = async (
  userAddress: string,
  taskAddress: string
): Promise<boolean> => {
  const sdk = AutSDK.getInstance();

  const holderDaos = await sdk.autID.contract.getHolderDAOs(userAddress);
  let novaAddress = null;
  for (let i = 0; i < holderDaos.data.length; i++) {
    if (novaAddress) {
      break;
    }
    const dao = holderDaos.data[i];
    const pluginIds =
      await sdk.pluginRegistry.contract.functions.getPluginIdsByNova(dao);
    for (let j = 0; j < pluginIds.length; j++) {
      if (novaAddress) {
        break;
      }
      const pluginId = pluginIds[j];
      const pluginInstance =
        await sdk.pluginRegistry.contract.functions.pluginInstanceByTokenId(
          pluginId
        );
      if (pluginInstance.pluginAddress === taskAddress) {
        novaAddress = dao;
        break;
      }
    }
  }
  const nova = sdk.initService<Nova>(
    Nova,
    novaAddress
  );
  const isAdmin = await nova.contract.admins.isAdmin(userAddress);
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
        message: "Success"
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
        uuid: req.body.uuid
      });
      return res.status(200).send({
        code: 200,
        message: "Success"
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
