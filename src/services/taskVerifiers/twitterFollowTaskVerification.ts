export * from "../logger.service";
import axios from "axios";
import { finalizeTask, getTask } from "../../contracts/onboardingOffchainVerificationTask";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";


export async function verifyTwitterFollowTask(taskAddress: string, userID: string, taskID: string, address: string): Promise<boolean> {
  let loop = true;
  let paginationToken = '';
  console.log(taskID);
  console.log(address);

  const task = await getTask(taskAddress, taskID) as any;
  if(!task) return false; 
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);
  const handle = metadata.handle;

  while (loop) {

    const result = await axios.get(`${process.env.API_TWITTER_URL}/users/${userID}/following`, {
      params: {
        pagination_token: paginationToken
      },
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_AUTH_TOKEN}`,
      }
    });
    const following = result.data.data as Array<any>;
    const index = following.findIndex(x => x.username === handle);
    if(following.length == 0) {
      loop = false;
    }
    if (index == -1) {
      paginationToken = result.data.meta.next_token;
    } else {
      await finalizeTask(taskAddress, taskID, address);
      return true;
    }
  }
  console.log(false);
  return false;
}
