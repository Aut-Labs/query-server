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
  submitter: string,
  bearerToken: string
): Promise<FinalizeTaskResult> {
  const sdk = AutSDK.getInstance();
  const questOnboarding = sdk.initService<QuestOnboarding>(
    QuestOnboarding,
    onboardingPluginAddress
  );
  const response = await questOnboarding.getTaskById(taskAddress, taskID);

  if (!response.isSuccess) {
    return { isFinalized: false, error: "invalid task" };
  }

  const task = response.data;

  const metadata = await getJSONFromURI(
    ipfsCIDToHttpUrl(task.metadataUri, true)
  );

  let { inviteUrl } = metadata?.properties;

  if (!inviteUrl) inviteUrl = "https://discord.gg/gsX9hqya";

  const serverCode = inviteUrl.match(/discord\.gg\/(.+)/i)[1];
  const serverIdResponse = await axios.get(
    `https://discord.com/api/invites/${serverCode}`
  );
  const discordServerId = serverIdResponse.data.guild.id;

  const lookupConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://discord.com/api/users/@me/guilds",
    headers: {
      Authorization: bearerToken,
    },
  };

  const guildsResponse = await axios(lookupConfig);

  const guilds = guildsResponse.data;

  const guild = guilds.find((g) => g.id === discordServerId);

  if (!guild) {
    return { isFinalized: false, error: "Not a member of this server." };
  } else {
    const response = await questOnboarding.finalizeFor(
      { taskId: taskID, submitter: submitter } as Task,
      taskAddress,
      PluginDefinitionType.OnboardingJoinDiscordTaskPlugin
    );
    return {
      isFinalized: response.isSuccess,
      txHash: response.transactionHash,
      error: response.errorMessage,
    };
  }
}
