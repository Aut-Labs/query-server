export * from "../logger.service";
import axios from "axios";
import { finalizeTask, getTask } from "../../contracts/onboardingOffchainVerificationTask";
import { ipfsCIDToHttpUrl, getJSONFromURI} from "../../tools/ethers";


export async function verifyTransaction(taskAddress: string, taskID: string, address: string): Promise<boolean> {
  // The Validator helps you validate the Chainlink request data
  console.log(taskID);
  address = '0xca05bce175e9c39fe015a5fc1e98d2b735ff51d9';

  const task = await getTask(taskAddress, taskID) as any;
  if(!task) return false; 
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);

  // const task = {
  //   network: '',
  //   contractAddress: '0x4d407a5ba5c2c7d38ef0f7e4ee87c570fbd8cca0',
  //   chainID: 80001,
  // }
  let finished = false;
  let pageNumber = 0;
  console.log(process.env.COVALENT_API_KEY);
  // const chainID = getChinID(network);
  while (!finished) {

    const url = `https://api.covalenthq.com/v1/${metadata.chainID}/address/${address}/transactions_v2/?key=${process.env.COVALENT_API_KEY}&no-logs=true&page-size=1000&page-number=${pageNumber}`
    console.log(url);
    const result = await axios.get(url)
    if (result.data.data.items.length > 0) {
      const txs = result.data.data.items.filter(
        (tx) =>
          tx.to_address &&
          tx.block_height > 0 &&
          tx.to_address == metadata.contractAddress,
      )

      console.log(txs);

      if (txs.length > 0) {
      await finalizeTask(taskAddress, taskID, address);
      return true;
      }
    } else finished = true
    pageNumber++
  }

  return false;
}
