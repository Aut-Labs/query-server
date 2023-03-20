export * from "../logger.service";
import axios from "axios";
import { finalizeTask, getTask } from "../../contracts/onboardingOffchainVerificationTask";
import { ipfsCIDToHttpUrl, getJSONFromURI } from "../../tools/ethers";
import { getNetworkConfig } from "../../services";
import AutSDK, {
  QuestOnboarding, Task,
} from "@aut-labs-private/sdk";
import { PluginDefinitions } from "../../constants/pluginDefinitions";

export async function verifyTransaction(pluginAddress: string, taskID: number, address: string, network: string): Promise<boolean> {

  const sdk = AutSDK.getInstance();
  let questOnboarding: QuestOnboarding = sdk.questOnboarding;
  if (!questOnboarding) {
    sdk.initService<QuestOnboarding>(QuestOnboarding, pluginAddress);
    sdk.questOnboarding = questOnboarding;
  }

  sdk.
    address = '0xca05bce175e9c39fe015a5fc1e98d2b735ff51d9';

  const task = await getTask(taskAddress, taskID) as any;
  if (!task) return false;
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);

  const contractAddress = task.properties.smartContractAddress;

  let finished = false;
  let pageNumber = 0;
  console.log(process.env.COVALENT_API_KEY);
  const chainID = getNetworkConfig(network, undefined).chainId;
  while (!finished) {
    const url = `https://api.covalenthq.com/v1/${chainID}/address/${address}/transactions_v2/?key=${process.env.COVALENT_API_KEY}&no-logs=true&page-size=1000&page-number=${pageNumber}`
    console.log(url);
    const result = await axios.get(url)
    if (result.data.data.items.length > 0) {
      const txs = result.data.data.items.filter(
        (tx) =>
          tx.to_address &&
          tx.block_height > 0 &&
          tx.to_address == contractAddress,
      )

      if (txs.length > 0) {
        const response = await questOnboarding.finalizeFor(
          { taskId: taskID } as Task,
          pluginAddress,
          PluginDefinitions.TransactionTask
        );

        if (!response.isSuccess)
          return false;
        else return true;
      }
    } else finished = true
    pageNumber++
  }

  return false;
}
