export * from "../logger.service";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import {
  finalizeTask,
  getTask,
} from "../../contracts/onboardingOffchainVerificationTask";
import { QuestionsModel } from "../../models/question";

export async function verifyQuizTask(
  taskAddress: string,
  taskID: string,
  address: string,
  answers: []
): Promise<boolean> {
  const task = (await getTask(taskAddress, taskID)) as any;
  if (!task) return false;
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);

  if (metadata.questions.length != answers) return false;

  const localQuestionData = await QuestionsModel.findOne({
    taskId: taskID,
  });

  for (let i = 0; i < metadata.questions.length; i++) {
    const question = metadata.questions[i];
    const localQuestion = localQuestionData.questions.find(
      (q) => q.question === question
    );
    const correctAnswer = localQuestion.answers.find((a) => a.correct);
    if (correctAnswer.value !== answers[i]) {
      return false;
    }
  }

  await finalizeTask(taskAddress, taskID, address);
  return true;
}
