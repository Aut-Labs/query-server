export * from "../logger.service";
import { Question, QuestionsModel } from "../../models/question";
import AutSDK, { QuestOnboarding, Task } from "@aut-labs/sdk";
import { FinalizeTaskResult } from "../../models/finalizeTask";
import { PluginDefinitionType } from "@aut-labs/sdk/dist/models/plugin";

export async function verifyQuizTask(
  onboardingPluginAddress: string,
  taskAddress: string,
  taskID: number,
  uuid: string,
  address: string,
  userQuestionsAndAnswers: Question[]
): Promise<FinalizeTaskResult> {
  const sdk = AutSDK.getInstance();
  const questOnboarding = sdk.initService<QuestOnboarding>(
    QuestOnboarding,
    onboardingPluginAddress
  );

  const response = await questOnboarding.getTaskById(
    taskAddress,
    taskID,
  );

  if (!response.isSuccess) {
    return { isFinalized: false, error: "invalid task" };
  }

  const task = response.data;

  const taskAnsweredQuestions = await QuestionsModel.findOne({
    taskAddress: taskAddress,
    uuid: uuid,
  });

  if (!taskAnsweredQuestions) {
    return {
      isFinalized: false,
      error: `No answers found for task ${task?.metadata?.name}`
    };
  }

  let incorrectAnsweredQuestions = {};

  for (let i = 0; i < userQuestionsAndAnswers.length; i++) {
    const question = taskAnsweredQuestions.questions[i];
    const answers = question.answers;

    const userQuestion: Question = userQuestionsAndAnswers[i];
    const userAnswers = userQuestion.answers;
   
    for (let j = 0; j < userAnswers.length; j++) {
      const answer = answers[j];
      const userAnswer = userAnswers[j];
      const correntAnswer = !!answer?.correct;
      const correctUserAnswer = !!userAnswer?.correct;

      if (correntAnswer !== correctUserAnswer) {
        incorrectAnsweredQuestions[i] = true;
      }
    }
  }

  const totalTasksCount = taskAnsweredQuestions.questions.length;
  const MIN_CORRECT_ANSWERS = totalTasksCount;
  const TOTAL_ANSWERED_CORRECTLY = totalTasksCount - Object.keys(incorrectAnsweredQuestions).length;
  if (TOTAL_ANSWERED_CORRECTLY < MIN_CORRECT_ANSWERS) {
    let helperInfo = `In order to complete the task you need to answer correctly ${MIN_CORRECT_ANSWERS} questions.`
    if (MIN_CORRECT_ANSWERS === totalTasksCount) {
      helperInfo = `In order to complete the task you need to answer correctly all the questions.`
    }
    return {
      isFinalized: false,
      error: `You have answered correctly ${TOTAL_ANSWERED_CORRECTLY} out of ${totalTasksCount} questions. ${helperInfo}`
    };
  }

  const responseFinalize = await questOnboarding.finalizeFor(
    { taskId: taskID, submitter: address } as Task,
    taskAddress,
    PluginDefinitionType.OnboardingQuizTaskPlugin
  );

  return {
    isFinalized: responseFinalize.isSuccess,
    txHash: responseFinalize.transactionHash,
    error: responseFinalize.errorMessage
  };
}
