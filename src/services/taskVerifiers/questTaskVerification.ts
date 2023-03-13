export * from "../logger.service";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import { finalizeTask, getTask } from "../../contracts/onboardingOffchainVerificationTask";


export async function verifyQuestTask(taskAddress: string, taskID: string, address: string, answers: []): Promise<boolean> {

  const task = await getTask(taskAddress, taskID) as any;
  if(!task) return false; 
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);

  if(metadata.questions.length != answers) return false; 

  for(let i = 0; i < metadata.questions.length; i++) {
    if(metadata.questions[i] !== answers[i]) return false; 
  }

  await finalizeTask(taskAddress, taskID, address);
  return true;
}
