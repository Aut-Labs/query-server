export * from "../logger.service";
import axios from "axios";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import { FinalizeTaskResult } from "../../models/finalizeTask";
import AutSDK, { QuestOnboarding, Task } from "@aut-labs-private/sdk";
import { PluginDefinitionType } from "@aut-labs-private/sdk/dist/models/plugin";

export async function verifyJoinDiscordTask(
  onboardingPluginAddress: string,
  taskAddress: string,
  taskID: number,
  address: string,
  bearerToken: string
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

  if (!metadata.properties.inviteLink)     
  return { isFinalized: false, error: "invalid task" };


  const serverIdResponse = await axios.get(
    `https://discord.com/api/invites/${metadata.inviteLink.split("/")[3]}`
  );
  const discordServerId = serverIdResponse.data.guild.id;

  const lookupConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://discord.com/api/users/@me/guilds",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };

  const guildsResponse = await axios(lookupConfig);

  const guilds = guildsResponse.data;

  const guild = guilds.find((g) => g.id === discordServerId);

  if (!guild) {
    return { isFinalized: false, error: "task not completed" };
  } else {
    const response = await questOnboarding.finalizeFor(
      { taskId: taskID, submitter: address } as Task,
      taskAddress,
      PluginDefinitionType.OnboardingQuizTaskPlugin
    );
    return { isFinalized: response.isSuccess, txHash: response.transactionHash, error: response.errorMessage };  }
}
