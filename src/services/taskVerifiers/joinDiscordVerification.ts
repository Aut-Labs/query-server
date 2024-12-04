export * from "../../tools/logger.service";
import axios from "axios";

export const verifyJoinDiscordTask = async ({ accessToken, guildId }) => {
  const lookupConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://discord.com/api/users/@me/guilds",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const guildsResponse = await axios(lookupConfig);

  const guilds = guildsResponse.data;

  const guild = guilds.find((g) => g.id === guildId);

  return {
    hasJoined: !!guild,
  };
};
