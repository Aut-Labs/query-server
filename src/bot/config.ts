export interface Config {
  clientId: string;
  guildId: string;
  token: string;
  messages: {
    prefixes: {
      help: string;
    };
  };
  roles: {
    colors: string[];
  };
}

export const config: Config = {
  clientId: "1129037421615529984",
  guildId: "1133407677091942480",
  token: process.env.DISCORD_TOKEN,
  messages: {
    prefixes: {
      help: "/aut-help",
    },
  },
  roles: {
    colors: [
      "BLUE",
      "GREEN",
      "PURPLE",
      "DARK_AQUA",
      "DARK_VIVID_PINK",
      "DARK_RED",
    ],
  },
};
