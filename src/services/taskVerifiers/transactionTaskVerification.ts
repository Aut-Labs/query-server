export * from "../../tools/logger.service";
import axios from "axios";
import AutSDK, {
  QuestOnboarding, Task,
} from "@aut-labs/sdk";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import { FinalizeTaskResult } from "../../models/finalizeTask";
import { supportFunction } from "../../constants/supportedNetworks";


export async function verifyTransaction(
  pluginAddress: string,
  taskAddress: string,
  taskID: number,
  address: string
): Promise<FinalizeTaskResult> {
  // const sdk = await AutSDK.getInstance(false);
  // const questOnboarding = sdk.initService<QuestOnboarding>(
  //   QuestOnboarding,
  //   pluginAddress
  // );
  // const response = await questOnboarding.getTaskById(
  //   taskAddress,
  //   taskID,
  // );

  // if (!response.isSuccess) {
  //   return { isFinalized: false, error: "invalid task" };
  // }

  // const task = response.data;

  // const metadataUri = ipfsCIDToHttpUrl(task.metadataUri, true);

  // const metadata = await getJSONFromURI(metadataUri);

  // const contractAddress = metadata.properties.smartContractAddress.toLowerCase();
  // const network = supportFunction(metadata.properties.network) ? metadata.properties.network : 'matic-mumbai';

  // let finished = false;
  // let pageNumber = 0;
  // while (!finished) {
  //   const url = `https://api.covalenthq.com/v1/${network}/address/${address}/transactions_v2/?key=${process.env.COVALENT_API_KEY}&no-logs=true&page-size=1000&page-number=${pageNumber}`
  //   const result = await axios.get(url)
  //   if (result.data.data.items.length > 0) {
  //     const txs = result.data.data.items.filter(
  //       (tx) =>
  //         tx.to_address &&
  //         tx.block_height > 0 &&
  //         tx.to_address == contractAddress,
  //     )

  //     if (txs.length > 0) {
  //       finished = true;
  //       console.log(txs);
  //       console.log('taskId', taskID);
  //       console.log('submitter', address);
  //       console.log('taskAddress', taskAddress);

  //       // @TODO: fix this once we support TransactionTask
  //       // const responseFinalize = await questOnboarding.finalizeFor(
  //       //   { taskId: taskID, submitter: address } as Task,
  //       //   taskAddress,
  //       //   PluginDefinitionType.OnboardingTransactionTaskPlugin
  //       // );
  //       // return { isFinalized: responseFinalize.isSuccess, txHash: responseFinalize.transactionHash, error: responseFinalize.errorMessage };
  //     }
  //     pageNumber++
  //   } else finished = true;
  // }

  return { isFinalized: false, error: "transaction not completed" };
}
