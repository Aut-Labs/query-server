export * from "../logger.service";
import axios from "axios";
import { getNetworkConfig } from "../../services";
import AutSDK, {
  QuestOnboarding, Task,
} from "@aut-labs-private/sdk";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import { PluginDefinitionType } from "@aut-labs-private/sdk/dist/models/plugin";
import { FinalizeTaskResult } from "../../models/finalizeTask";


export async function verifyTransaction(pluginAddress: string, taskAddress: string, taskID: number, address: string, network: string): Promise<FinalizeTaskResult> {

  const sdk = AutSDK.getInstance();
  let questOnboarding: QuestOnboarding = sdk.questOnboarding;
  if (!questOnboarding) {
    questOnboarding = sdk.initService<QuestOnboarding>(
      QuestOnboarding,
      pluginAddress
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

  const contractAddress = metadata.properties.smartContractAddress.toLowerCase();

  let finished = false;
  let pageNumber = 0;
  const chainID = getNetworkConfig(network, undefined).chainId;
  while (!finished) {
    const url = `https://api.covalenthq.com/v1/${chainID}/address/${address}/transactions_v2/?key=${process.env.COVALENT_API_KEY}&no-logs=true&page-size=1000&page-number=${pageNumber}`
    const result = await axios.get(url)
    if (result.data.data.items.length > 0) {
      const txs = result.data.data.items.map(
        (tx) =>
          tx.to_address &&
          tx.block_height > 0 &&
          tx.to_address == contractAddress,
      )

      if (txs.length > 0) {
        finished = true;
        const response = await questOnboarding.finalizeFor(
          { taskId: taskID, submitter: address } as Task,
          taskAddress,
          PluginDefinitionType.OnboardingQuizTaskPlugin
        );
        return { isFinalized: response.isSuccess, txHash: response.transactionHash, error: response.errorMessage };
      }
      pageNumber++
    } else finished = true;
  }

  return { isFinalized: false, error: "transaction not completed" };
}
