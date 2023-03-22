export * from "../logger.service";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import { QuestionsModel } from "../../models/question";
import AutSDK, { QuestOnboarding, Task } from "@aut-labs-private/sdk";
import { FinalizeTaskResult } from "../../models/finalizeTask";
import { PluginDefinitionType } from "@aut-labs-private/sdk/dist/models/plugin";

export async function verifyQuizTask(
  onboardingPluginAddress: string,
  taskAddress: string,
  taskID: number,
  address: string,
  answers: string[]
): Promise<FinalizeTaskResult> {

  const sdk = AutSDK.getInstance();
  let questOnboarding: QuestOnboarding = sdk.questOnboarding;
  if (!questOnboarding) {
    questOnboarding = sdk.initService<QuestOnboarding>(
      QuestOnboarding,
      onboardingPluginAddress
    );
    sdk.questOnboarding = questOnboarding;
  }
  const response = await questOnboarding.getTaskById(
    taskAddress,
    taskID,
  );

  if (!response.isSuccess) {
    return { isFinalized: false, error: "invalid task" };
  }

  const task = response.data;

  const metadataUri = ipfsCIDToHttpUrl(task.metadataUri, true);
  const metadata = await getJSONFromURI(metadataUri);

  if (metadata.questions.length != answers.length)
    return { isFinalized: false, error: "missing answer" };
  ;

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
      return { isFinalized: false, error: "incorrect answer" };
    }
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
