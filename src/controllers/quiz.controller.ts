import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { getNetworkConfig, getNetworksConfig } from "../services";
import { getSigner } from "../tools/ethers";
import AutSDK, { DAOExpander } from "@aut-labs-private/sdk";
import { Holder } from "../models/holder";
import { ethers } from "ethers";
import { AutIDQuery } from "@aut-labs-private/sdk/dist/services/autID.service";
import { QuestionsModel } from "../models/question";

const verifyIsAdmin = async (
  userAddress: string,
  taskAddress: string
): Promise<boolean> => {
  const sdk = AutSDK.getInstance();

  const holderDaos = await sdk.autID.contract.getHolderDAOs(userAddress);
  let daoExpanderAddress = null;
  for (let i = 0; i < holderDaos.data.length; i++) {
    if (daoExpanderAddress) {
      break;
    }
    const dao = holderDaos.data[i];
    const pluginIds =
      await sdk.pluginRegistry.contract.functions.getPluginIdsByDAO(dao);
    for (let j = 0; j < pluginIds.length; j++) {
      if (daoExpanderAddress) {
        break;
      }
      const pluginId = pluginIds[j];
      const pluginInstance =
        await sdk.pluginRegistry.contract.functions.pluginInstanceByTokenId(
          pluginId
        );
      if (pluginInstance.pluginAddress === taskAddress) {
        daoExpanderAddress = dao;
        break;
      }
    }
  }
  const expander = sdk.initService<DAOExpander>(
    DAOExpander,
    daoExpanderAddress
  );
  const isAdmin = await expander.contract.admins.isAdmin(userAddress);
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
      if (!req.body.taskId) {
        return res.status(400).send("Task Id not provided.");
      }
      const isAdmin = await verifyIsAdmin(
        req.user.address,
        req.body.taskAddress
      );

      if (!isAdmin) {
        return res.status(401).send("Only admins can add questions.");
      }

      const answers = new QuestionsModel();
      answers.taskAddress = req.body.taskAddress;
      answers.taskId = req.body.taskId;
      answers.questions = req.body.questions;
      if (req.body.questions && req.body.questions.length > 0) {
        const tempQuestions = req.body.questions.map(function (q) {
          return q.question;
        });
        const duplicatesExist = tempQuestions.some(function (item, idx) {
          return tempQuestions.indexOf(item) != idx;
        });
        if (duplicatesExist) {
          return res.status(400).send("Duplicate questions are not allowed.");
        }
        for (let index = 0; index < req.body.questions.length; index++) {
          const question = req.body.questions[index];
          if (question.answers && question.answers.length > 1) {
            const tempAnswers = question.answers.map(function (a) {
              return a.value;
            });
            const duplicatesAnswersExist = tempAnswers.some(function (
              item,
              idx
            ) {
              return tempAnswers.indexOf(item) != idx;
            });
            if (duplicatesAnswersExist) {
              return res.status(400).send("Duplicate answers are not allowed.");
            }
            let foundCorrectAnswer = false;
            for (let j = 0; j < question.answers.length; j++) {
              const answer = question.answers[j];
              if (answer.correct) {
                if (foundCorrectAnswer) {
                  return res
                    .status(400)
                    .send("Questions cannot have multiple correct answers.");
                } else {
                  foundCorrectAnswer = true;
                }
              }
            }
            if (!foundCorrectAnswer) {
              return res
                .status(400)
                .send("Questions should have at least one correct answer.");
            }
          } else {
            return res
              .status(400)
              .send("Some questions don't have enough answers.");
          }
        }
      } else {
        return res.status(400).send("Questions not provided");
      }
      await answers.save();
      return res.status(200).send();
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getQuestions = async (req: any, res: Response) => {
    try {
      if (!req.params.taskAddress) {
        return res.status(400).send("Task Address not provided.");
      }

      const questions = await QuestionsModel.findOne({
        taskId: req.params.taskAddress,
      });
      console.log(questions);
      if (questions) {
        const response = questions.questions.map((q) => {
          return {
            question: q.question,
            answers: q.answers.map((a) => {
              return {
                value: a.value,
              };
            }),
          };
        });
        return res.status(200).send(response);
      }
      return res.status(404).send("Questions not found");
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
        req.user.address,
        req.body.taskAddress
      );

      if (!isAdmin) {
        return res.status(401).send("Only admins can add questions.");
      }

      const questions = await QuestionsModel.findOne({
        taskAddress: req.params.taskAddress,
      });
      console.log(questions);
      if (questions) {
        const response = questions.questions.map((q) => {
          return {
            question: q.question,
            answers: q.answers.map((a) => {
              return {
                value: a.value,
                correct: a.correct,
              };
            }),
          };
        });
        return res.status(200).send(response);
      }
      return res.status(404).send("Questions not found");
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
