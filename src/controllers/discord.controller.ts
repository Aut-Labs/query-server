import { injectable } from "inversify";
import { Request, Response } from "express";
import {
  Client,
  TextChannel,
  EmbedBuilder,
  ChannelType,
  GatewayIntentBits,
  Events,
  Collection,
  SlashCommandBuilder,
  CommandInteraction,
  REST,
  Routes,
} from "discord.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { GuildModel } from "../models/discord/guild.model";
import { GatheringModel } from "../models/discord/gathering.model";
import { PollModel } from "../models/discord/poll.model";
import { MemberModel } from "../models/discord/member.model";
import { Agenda } from "@hokify/agenda";
import { AgendaManager } from "../services/agenda";
import { gql, GraphQLClient, Variables } from "graphql-request";
import AutSDK, { fetchMetadata, HubNFT } from "@aut-labs/sdk";

interface Hub {
  id: string;
  address: string;
  domain: string;
  deployer: string;
  minCommitment: string;
  metadataUri: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    properties: {
      market: number;
      deployer: string;
      minCommitment: string;
      rolesSets: Array<{
        roleSetName: string;
        roles: Array<{
          id: number;
          roleName: string;
        }>;
      }>;
      timestamp: number;
      socials: Array<{
        type: string;
        link: string;
        metadata: {
          guildId?: string;
          guildName?: string;
        };
      }>;
    };
  };
}

const cache: any = {};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

const getMetadataFromCache = (metadataUri: string) => {
  return cache[metadataUri];
};

const addMetadataToCache = (metadataUri: string, metadata: any) => {
  cache[metadataUri] = metadata;
  console.log(cache);
};

function ipfsCIDToHttpUrl(url: string, nftStorageUrl: string) {
  if (!url) {
    return url;
  }
  if (!url.includes("https://"))
    return `${nftStorageUrl}/${replaceAll(url, "ipfs://", "")}`;
  return url;
}

const fetchMetadatas = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const { metadataUri } = item;
      if (!metadataUri) return;
      let result = getMetadataFromCache(metadataUri);
      console.log("cache used!", result);
      if (!result) {
        try {
          const response = await fetch(
            ipfsCIDToHttpUrl(metadataUri, process.env.IPFS_GATEWAY),
            {
              method: "GET",
              // headers: {
              //   "Content-Type": "application/json"
              // }
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          result = await response.json();
          addMetadataToCache(metadataUri, result);
        } catch (error) {
          console.warn(error);
        }
      }
      return {
        ...item,
        metadata: result,
      };
    })
  );
};

class AutDiscordClient extends Client {
  public commands: Collection<any, any>;
}

@injectable()
export class DiscordController {
  private client: AutDiscordClient;
  private agenda: Agenda;
  private graphqlClient: GraphQLClient;
  private commandsCollection: Collection<any, any>;

  private _getAutIdsByHub = async (hubAddress: string): Promise<any[]> => {
    const filters = {
      where: {
        joinedHubs_: {
          hubAddress: hubAddress,
        },
      },
    };
    const GET_AUTIDS = gql`
      query GeAutIDs($where: AutID_filter) {
        autIDs(skip: 0, first: 100, where: $where) {
          id
          owner
          tokenID
          username
          metadataUri
          joinedHubs {
            id
            role
            commitment
            hubAddress
          }
        }
      }
    `;
    return this.graphqlClient
      .request<any>(GET_AUTIDS, filters)
      .then((data) => data.autIDs)
      .then((autIDs) => fetchMetadatas(autIDs))
      .catch((e) => {
        console.error("Error fetching hubs:", e);
        return [];
      });
  };

  private _getHubs = async (): Promise<any[]> => {
    const query = gql`
      query GetHubs {
        hubs(first: 1000) {
          id
          address
          domain
          deployer
          minCommitment
          metadataUri
        }
      }
    `;

    return this.graphqlClient
      .request<any>(query)
      .then((data) => data.hubs)
      .then((hubs) => fetchMetadatas(hubs))
      .catch((e) => {
        console.error("Error fetching hubs:", e);
        return [];
      });
  };

  private _deployCommands = async (guildId: string): Promise<void> => {
    try {
      const clientId = process.env.DISCORD_BOT_CLIENT_ID as string;
      const token = process.env.DISCORD_BOT_TOKEN as string;
      const rest = new REST().setToken(token);
      console.log(
        `Started refreshing ${this.commandsCollection} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data: any = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: this.commandsCollection }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  };

  constructor() {
    console.log("setting up client");
    this.graphqlClient = new GraphQLClient(process.env.GRAPH_API_DEV_URL);
    this.client = new AutDiscordClient({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    const userMeCommand = {
      data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("Provides information about the user."),
      async execute(interaction: CommandInteraction) {
        await interaction.reply(
          `This command was run by ${interaction.user.username}.`
        );
      },
    };
    this.commandsCollection = new Collection();
    this.commandsCollection.set(userMeCommand.data.name, userMeCommand);

    // const foldersPath = path.join(__dirname, "../tools/discord/commands");
    // const commandFolders = fs.readdirSync(foldersPath);

    // for (const folder of commandFolders) {
    //   const commandsPath = path.join(foldersPath, folder);
    //   const commandFiles = fs
    //     .readdirSync(commandsPath)
    //     .filter((file) => file.endsWith(".ts"));
    //   for (const file of commandFiles) {
    //     const filePath = path.join(commandsPath, file);
    //     const command = require(filePath);
    //     if ("data" in command && "execute" in command) {
    //       this.commandsCollection.set(command.data.name, command);
    //     } else {
    //       console.log(
    //         `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    //       );
    //     }
    //   }
    // }

    this.client.on(Events.GuildCreate, async (guild) => {
      console.log("Joined a new guild: " + guild.name);

      const hub = await this.getHubFromGuildId(guild.id);

      if (
        hub &&
        hub.metadata &&
        hub.metadata.properties &&
        hub.metadata.properties.rolesSets
      ) {
        const botRole = guild.roles.cache.find(
          (r) => r.name === this.client.user.username
        );

        // Create roles for each role in the rolesSets
        const roleSet = hub.metadata.properties.rolesSets.find(
          (rs) => rs.roleSetName === "Default"
        );

        if (botRole) {
          try {
            await botRole.setPosition(1);
          } catch (e) {
            console.error("Error setting bot role position:", e);
          }
        }

        for (const role of roleSet.roles) {
          const randomColor = Math.floor(Math.random() * 16777215).toString(16);
          try {
            await guild.roles.create({
              name: role.roleName,
              color: `#${randomColor}`,
              reason: "Āut role from Āut Hub",
            });
          } catch (e) {
            console.error(`Error creating role ${role.roleName}:`, e);
          }
        }

        // Create Āut-role-Channel if it doesn't exist
        const existingRoleChannel = guild.channels.cache.find(
          (channel) => channel.name === "āut-role-channel"
        );
        if (!existingRoleChannel) {
          try {
            const channel = await guild.channels.create({
              name: "āut-role-channel",
              type: ChannelType.GuildText,
            });
            console.log(`Created new channel: ${channel.name}`);
            // Note: You might want to store this channel ID somewhere if needed
          } catch (e) {
            console.error("Error creating āut-role-channel:", e);
          }
        }
      } else {
        console.log("Hub data not found or incomplete for this guild.");
      }

      // Your other stuff like adding to guildArray can go here
    });

    this.client.on(Events.GuildMemberAdd, async (guildMember) => {
      console.log(`member! ${guildMember}`);

      const hub = await this.getHubFromGuildId(guildMember.guild.id);
      // const guildData = await GuildModel.findOne({ guildId: m.guild.id });
      const autIds = await this._getAutIdsByHub(hub.address);
      const autId = autIds.find((autId) => {
        return autId.metadata.properties.socials.some(
          (social) => social?.metadata?.userId === guildMember.id
        );
      });
      const channel = guildMember.guild.channels.cache.find(
        (c) => c.name === "āut-role-channel"
      );
      if (autId) {
        const role = autId.joinedHubs.find(
          (h) => h.hubAddress === hub.address
        ).role;
        const roleSet = hub.metadata.properties.rolesSets.find(
          (rs) => rs.roleSetName === "Default"
        );
        const roleName = roleSet.roles.find((r) => r.id == role).roleName;
        const discordGuild = this.client.guilds.cache.find(
          (g) => g.id === guildMember.guild.id
        );

        const discordRole = discordGuild.roles.cache.find(
          (r) => r.name === roleName
        );

        await guildMember.roles.add(discordRole);

        (channel as TextChannel).send(
          `Everyone welcome <@${guildMember.id}>. They have joined with the role <@&${discordRole.id}>! `
        );
      } else {
        (channel as TextChannel).send(
          `Everyone welcome <@${guildMember.id}>. Looks like you haven't verified your discord profile.\nPlease follow this {link} and add your discord account to your ĀutID. Once done use the command /claimRole in this channel to get your role.`
        );
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      const command = this.commandsCollection.get(interaction.commandName);

      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
          });
        }
      }
    });

    this.client.once(Events.ClientReady, async (c) => {
      console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    this.client.login(process.env.DISCORD_BOT_TOKEN);

    this.agenda = new AgendaManager(this.client).agenda;
  }

  public createGathering = async (req: Request, res: Response) => {
    try {
      //make this upsert
      const gatheringRequest = req.body;
      const gathering = { ...gatheringRequest };
      gathering.roleIds = [];
      const roles = req.body.roles;
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === gathering.guildId
      );
      if (gatheringRequest.allCanAttend) {
        const guildModel = await GuildModel.findOne({
          guildId: gatheringRequest.guildId,
        });
        for (let i = 0; i < guildModel.roles.length; i++) {
          const role = guildModel.roles[i];
          const result = await guildModel.roles.find(
            (r) => r.name === role.name
          );
          gathering.roleIds.push(result.id);
        }
      } else {
        for (let i = 0; i < gatheringRequest.roles.length; i++) {
          const role = gatheringRequest.roles[i];
          const result = await guild.roles.cache.find((r) => r.name === role);
          gathering.roleIds.push(result.id);
        }
      }
      const newGathering = new GatheringModel(gathering);
      const savedGathering = await newGathering.save();
      await this.agenda.schedule(
        new Date(gathering.startDate),
        "initializeGathering",
        {
          id: savedGathering.id,
        }
      );
      await this.agenda.schedule(
        new Date(gathering.endDate),
        "finalizeGathering",
        {
          id: savedGathering.id,
        }
      );
      res.json(savedGathering);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred" });
    }
  };

  public createPoll = async (req: Request, res: Response) => {
    try {
      const pollRequest = req.body;
      const poll = { ...pollRequest };
      poll.roleIds = [];
      const roles = req.body.roles;
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === poll.guildId
      );
      if (pollRequest.allCanAttend) {
        const guildModel = await GuildModel.findOne({
          guildId: pollRequest.guildId,
        });
        for (let i = 0; i < guildModel.roles.length; i++) {
          const role = guildModel.roles[i];
          const result = await guildModel.roles.find(
            (r) => r.name === role.name
          );
          poll.roleIds.push(result.id);
        }
      } else {
        for (let i = 0; i < pollRequest.roles.length; i++) {
          const role = pollRequest.roles[i];
          const result = await guild.roles.cache.find((r) => r.name === role);
          poll.roleIds.push(result.id);
        }
      }

      //Discord message
      let allowedRolesLine = "";
      allowedRolesLine += "\n";
      if (poll.allCanAttend) {
        allowedRolesLine =
          "\nAnyone with an Āut role from the community can attend.";
      } else {
        allowedRolesLine =
          "'\nAnyone with the following Āut roles can attend:\n";
        poll.roles.forEach((role, i) => {
          allowedRolesLine += `- ${role}\n`;
        });
      }
      let options = "\n Options:";
      options += "\n";
      poll.options.forEach((o, i) => {
        options += `${o.option}\n`;
      });
      let description = "";
      description += poll.description;
      description += allowedRolesLine;
      description += options;
      description += `\n Vote ends at ${poll.endTime}`;

      // TODO: validate if poll exists
      // TODO: if not - don't publish and save info
      // TODO: return bad request

      const channel = guild.channels.cache.find(
        (c) => c.id == poll.channelId
      ) as TextChannel;

      // publish a poll

      const pollContent = new EmbedBuilder()
        .setTitle(poll.title)
        .setDescription(`${description}`);
      channel
        .send({ embeds: [pollContent] }) // Use a 2d array?
        .then(async function (message) {
          for (let i = 0; i < poll.options.length; i++) {
            await message.react(poll.options[i].emoji);
          }
          poll.messageId = message.id;
          const newPoll = new PollModel(poll);
          const savedPoll = await newPoll.save();

          await this.agenda.schedule("in 2 minutes", "finalizePoll", {
            id: savedPoll.id,
          });

          res.json(savedPoll);
        })
        .catch(console.error);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred" });
    }
  };

  public getHubFromGuildId = async (guildId: string): Promise<Hub> => {
    const hubs = await this._getHubs();

    const hub = hubs.find((hub) => {
      const social = hub.metadata.properties.socials.find(
        (s) => s.type === "discord"
      );
      return social && social.metadata.guildId === guildId;
    });
    return hub;
  };

  public checkGuild = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      await this._deployCommands(guildId);
      const guild = this.client.guilds.cache.find((g) => g.id === guildId);
      if (guild) {
        return res.json({ active: true });
      }
      return res.json({ active: false });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getBotAddress = async (req: Request, res: Response) => {
    try {
      const address = process.env.BOT_ADDRESS;
      return res.json({ address: address });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public createOrUpdateGuild = async (req: Request, res: Response) => {
    try {
      const guildData = req.body;
      const guildId = guildData.guildId;
      const existingGuild = await GuildModel.findOneAndUpdate(
        { guildId },
        guildData,
        { upsert: true, new: true }
      );
      return res.json(existingGuild);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getVoiceChannels = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === guildId
      );
      const channels = guild.channels.cache.filter(
        (c) => c.type === ChannelType.GuildVoice
      );
      const responseObject = channels.map((c) => {
        return { id: c.id, name: c.name };
      });
      return res.json(responseObject);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getTextChannels = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === guildId
      );
      const channels = guild.channels.cache.filter(
        (c) => c.type === ChannelType.GuildText
      );
      const responseObject = channels.map((c) => {
        return { id: c.id, name: c.name };
      });
      return res.json(responseObject);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getRole = async (req: Request, res: Response) => {
    try {
      const guild = await GuildModel.findOne({
        daoAddress: req.body.daoAddress,
      });
      if (!guild) {
        return res.status(404).json({ error: "Guild not found" });
      }

      const lookupConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://discord.com/api/users/@me",
        headers: {
          Authorization: `Bearer ${req.body.accessToken}`,
        },
      };
      const discordUser = await axios(lookupConfig);

      const discordGuild = await this.client.guilds.cache.find(
        (g) => g.id === guild.guildId
      );

      const autDao = req.body.autId.properties.communities.find(
        (c) => c.properties.address === req.body.daoAddress
      );

      const roleId = autDao.properties.userData.role;

      const role = guild.roles.find((r) => r.id === roleId);

      const discordRole = discordGuild.roles.cache.find(
        (r) => r.name === role.name
      );

      //todo check if address was already set

      const memberAddress = {
        autIdAddress: req.body.autId.properties.address,
        discordId: discordUser.data.id,
      };
      const newMember = new MemberModel(memberAddress);
      await newMember.save();

      const members = await discordGuild.members.fetch();

      const member = members.find((m) => m.user.id === discordUser.data.id);

      member.roles.add(discordRole);

      return res.sendStatus(200);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getGuildByDaoAddress = async (req: Request, res: Response) => {
    try {
      const { daoAddress } = req.params;
      const guildData = await GuildModel.findOne({ daoAddress: daoAddress });
      console.log(daoAddress);
      return res.json(guildData);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getGatherings = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const gatherings = await GatheringModel.find({ guildId: guildId });
      const guildModel = await GuildModel.findOne({ guildId: guildId });
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === guildId
      );
      const roles = {};
      for (let i = 0; i < guildModel.roles.length; i++) {
        const role = guildModel.roles[i];
        const result = await guild.roles.cache.find(
          (r) => r.name === role.name
        );
        roles[result.id] = result.name;
      }
      const responseModel = gatherings.map((g) => {
        let gatheringRole = "";
        if (g.roleIds.length === 3) {
          gatheringRole = "All can attend";
        } else {
          g.roleIds.forEach((roleId, i) => {
            if (i === 0) {
              gatheringRole += roles[roleId];
            } else {
              gatheringRole += ", " + roles[roleId];
            }
          });
          gatheringRole = roles[g.roleIds[0]];
        }
        return {
          title: g.title,
          description: g.description,
          startDate: g.startDate,
          duration:
            (new Date(g.endDate).getTime() - new Date(g.startDate).getTime()) /
            1000 /
            60,
          roles: gatheringRole,
        };
      });
      return res.json(responseModel);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getPolls = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const polls = await PollModel.find({ guildId: guildId });
      const guildModel = await GuildModel.findOne({ guildId: guildId });
      const guild = await this.client.guilds.cache.find(
        (g) => g.id === guildId
      );
      const roles = {};
      for (let i = 0; i < guildModel.roles.length; i++) {
        const role = guildModel.roles[i];
        const result = await guild.roles.cache.find(
          (r) => r.name === role.name
        );
        roles[result.id] = result.name;
      }
      const responseModel = polls.map((p) => {
        let pollRole = "";
        if (p.roleIds.length === 3) {
          pollRole = "All can attend";
        } else {
          p.roleIds.forEach((roleId, i) => {
            if (i === 0) {
              pollRole += roles[roleId];
            } else {
              pollRole += ", " + roles[roleId];
            }
          });
          pollRole = roles[p.roleIds[0]];
        }
        return {
          title: p.title,
          description: p.description,
          startDate: p.startDate,
          endDate: p.endDate,
          roles: pollRole,
        };
      });
      return res.json(responseModel);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };

  public getGuildById = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
      const guildData = await GuildModel.findOne({ guildId: guildId });
      console.log(guildId);
      return res.json(guildData);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "An error occurred" });
    }
  };
}
