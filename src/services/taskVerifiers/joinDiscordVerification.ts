export * from "../logger.service";
import axios from "axios";
import { getJSONFromURI, ipfsCIDToHttpUrl } from "../../tools/ethers";
import {
  finalizeTask,
  getTask,
} from "../../contracts/onboardingOffchainVerificationTask";

export async function verifyJoinDiscordTask(
  taskAddress: string,
  taskID: string,
  address: string,
  bearerToken: string
): Promise<boolean> {
  const task = (await getTask(taskAddress, taskID)) as any;
  if (!task) return false;
  const metadataUri = ipfsCIDToHttpUrl(task.metadata, true);
  const metadata = await getJSONFromURI(metadataUri);

  if (!metadata.inviteLink) return false;

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
    return false;
  } else {
    await finalizeTask(taskAddress, taskID, address);
    return true;
  }
}
