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
import {
  GatheringModel,
  IParticipant,
} from "../models/discord/gathering.model";
import { PollModel } from "../models/discord/poll.model";
import { MemberModel } from "../models/discord/member.model";
import { Agenda } from "@hokify/agenda";
import { AgendaManager } from "../services/agenda";
import { gql, GraphQLClient, Variables } from "graphql-request";
import AutSDK, { fetchMetadata, HubNFT } from "@aut-labs/sdk";
import { AuthSig } from "../models/auth-sig";
import { SdkContainerService } from "../tools/sdk.container";
import { verifyMessage } from "ethers";
import { Hub, SubgraphQueryService } from "../services/subgraph-query.service";

interface ClaimRoleRequest {
  authSig: AuthSig;
  message: string;
  hubAddress: string;
  discordAccessToken: string;
}

class AutDiscordClient extends Client {
  public commands: Collection<any, any>;
}

@injectable()
export class DiscordController {
  private client: AutDiscordClient;
  private agenda: Agenda;
  private commandsCollection: Collection<any, any>;
  private _deployCommands = async (guildId: string): Promise<void> => {
    try {
      const clientId = process.env.DISCORD_BOT_CLIENT_ID as string;
      const token = process.env.DISCORD_BOT_TOKEN as string;
      const rest = new REST().setToken(token);
      console.log(
        `Started refreshing ${this.commandsCollection.size} application (/) commands.`
      );

      // Extract the command data from the Collection
      const commandData = Array.from(this.commandsCollection.values()).map(
        (command) => command.data.toJSON()
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data: any = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commandData }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  };

  constructor(
    private _subgraphQueryService: SubgraphQueryService,
    private _sdkContainerService: SdkContainerService
  ) {
    console.log("setting up client");
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
    const claimRoleCommand = {
      data: new SlashCommandBuilder()
        .setName("claimrole")
        .setDescription("Claim your Āut role from the hub within the server."),
      execute: async function (interaction: CommandInteraction) {
        const hub = await this.getHubFromGuildId(interaction.guild.id);
        const autIds = await this._getAutIdsByHub(hub.address);
        const discordUserId = interaction.user.id;
        const autId = autIds.find((autId) => {
          return autId.metadata.properties.socials.some(
            (social) => social?.metadata?.userId === discordUserId
          );
        });

        if (autId) {
          const role = autId.joinedHubs.find(
            (h) => h.hubAddress === hub.address
          ).role;
          const roleSet = hub.metadata.properties.rolesSets.find(
            (rs) => rs.roleSetName === "Default"
          );
          const roleName = roleSet.roles.find((r) => r.id == role).roleName;
          const discordGuild = this.client.guilds.cache.find(
            (g) => g.id === interaction.guild.id
          );

          const discordRole = discordGuild.roles.cache.find(
            (r) => r.name === roleName
          );
          const guildMember = await interaction.guild.members.fetch(
            discordUserId
          );

          // Add the role to the guild member
          await guildMember.roles.add(discordRole);

          await interaction.reply(
            `<@${discordUserId}> has claimed their role as <@&${discordRole.id}>.`
          );
        } else {
          await interaction.reply(
            "Looks like you haven't verified your discord profile.\nPlease follow this {link} and add your discord account to your ĀutID. Once done use /claimRole to get your role."
          );
        }
      }.bind(this),
    };
    this.commandsCollection = new Collection();
    this.commandsCollection.set(userMeCommand.data.name, userMeCommand);
    this.commandsCollection.set(claimRoleCommand.data.name, claimRoleCommand);

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

    this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      const { member, channelId } = newState;
      const guildId = member.guild.id;

      const currentDate = new Date();
      const activeGatherings = await GatheringModel.find({
        guildId: guildId,
        startDate: { $lte: currentDate },
        endDate: { $gt: currentDate },
      });

      for (const gathering of activeGatherings) {
        const roleMatched = newState.member.roles.cache.find((r) =>
          gathering.roleIds.includes(r.id)
        );

        if (!roleMatched) continue;

        const participant = gathering.participants.find(
          (p) => p.discordId === member.user.id
        );

        if (!participant) {
          gathering.participants.push({
            discordId: member.user.id,
            secondsInChannel: 0,
            timeJoined: new Date(),
            lastUpdatedPresence: new Date(),
          } as IParticipant);
          gathering.save();
        } else {
          if (!channelId) {
            // User left channel
            let secondsInCall = participant.secondsInChannel || 0;

            const newSeconds =
              (new Date().getTime() -
                participant.lastUpdatedPresence.getTime()) /
              1000;
            secondsInCall += newSeconds;

            await GatheringModel.findOneAndUpdate(
              {
                _id: gathering.id,
                "participants._id": participant.id,
              },
              {
                $set: {
                  "participants.$.secondsInChannel": secondsInCall,
                  "participants.$.lastUpdatedPresence": new Date(),
                },
              }
            );
          } else {
            await GatheringModel.findOneAndUpdate(
              {
                _id: gathering.id,
                "participants._id": participant.id,
              },
              {
                $set: {
                  "participants.$.lastUpdatedPresence": new Date(),
                },
              }
            );
          }
        }
      }
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      console.log("Joined a new guild: " + guild.name);

      await this._deployCommands(guild.id);

      const hub = await this._subgraphQueryService.getHubFromGuildId(guild.id);

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
      // // const guildData = await GuildModel.findOne({ guildId: m.guild.id });
      // const autIds = await this._getAutIdsByHub(hub.address);
      // const autId = autIds.find((autId) => {
      //   return autId.metadata.properties.socials.some(
      //     (social) => social?.metadata?.userId === guildMember.id
      //   );
      // });
      // const channel = guildMember.guild.channels.cache.find(
      //   (c) => c.name === "āut-role-channel"
      // );
      // if (autId) {
      //   const role = autId.joinedHubs.find(
      //     (h) => h.hubAddress === hub.address
      //   ).role;
      //   const roleSet = hub.metadata.properties.rolesSets.find(
      //     (rs) => rs.roleSetName === "Default"
      //   );
      //   const roleName = roleSet.roles.find((r) => r.id == role).roleName;
      //   const discordGuild = this.client.guilds.cache.find(
      //     (g) => g.id === guildMember.guild.id
      //   );

      //   const discordRole = discordGuild.roles.cache.find(
      //     (r) => r.name === roleName
      //   );

      //   await guildMember.roles.add(discordRole);

      //   (channel as TextChannel).send(
      //     `Everyone welcome <@${guildMember.id}>. They have joined with the role <@&${discordRole.id}>! `
      //   );
      // } else {
      //   (channel as TextChannel).send(
      //     `Everyone welcome <@${guildMember.id}>. Looks like you haven't verified your discord profile.\nPlease follow this {link} and add your discord account to your ĀutID. Once done use /claimRole to get your role.`
      //   );
      // }

      const hub = await this._subgraphQueryService.getHubFromGuildId(
        guildMember.guild.id
      );

      const roleChannel = guildMember.guild.channels.cache.find(
        (channel) => channel.name === "āut-role-channel"
      ) as TextChannel;

      if (!roleChannel) return;
      roleChannel.send(
        `Welcome <@${guildMember.id}>! Get your Āut role by following this link: http://localhost:3000/claim-discord-role?hub-address=${hub.address}`
      );
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

    this.agenda = new AgendaManager(
      this.client,
      this._subgraphQueryService,
      this._sdkContainerService
    ).agenda;
  }

  private getDiscordUserIdFromToken = async (
    token: string
  ): Promise<string | null> => {
    try {
      const response = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Discord user data");
      }

      const userData = await response.json();
      return userData.id;
    } catch (error) {
      console.error("Error fetching Discord user data:", error);
      return null;
    }
  };

  public getDiscordRole = async (req: Request, res: Response) => {
    try {
      const {
        authSig,
        message,
        hubAddress,
        discordAccessToken,
      }: ClaimRoleRequest = req.body;

      if (!authSig) {
        return res.status(400).send({ error: "autSig not provided." });
      }

      if (!hubAddress) {
        return res.status(400).send({ error: "hubAddress not provided." });
      }

      const lookupConfig = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://discord.com/api/users/@me",
        headers: {
          Authorization: `Bearer ${discordAccessToken}`,
        },
      };

      const discordUser = await axios(lookupConfig);

      const discordUserId = discordUser.data.id;

      if (!discordUserId) {
        return res.status(400).send({ error: "Invalid Discord token." });
      }

      const { sig, signedMessage, address } = authSig;
      const recoveredAddress = verifyMessage(signedMessage, sig).toLowerCase();

      if (recoveredAddress.toLocaleLowerCase() !== address.toLowerCase()) {
        return res.status(400).send({ error: "Invalid signature." });
      }

      const hub = await this._subgraphQueryService.getHubFromAddress(
        hubAddress
      );

      const social = hub.metadata.properties.socials.find(
        (s) => s.type === "discord"
      );

      const guildId = social.metadata.guildId;

      const autIds = await this._subgraphQueryService._getAutIdsByHub(
        hub.address
      );
      const autId = autIds.find((autId) => {
        return autId.id.toLowerCase() === recoveredAddress.toLowerCase();
      });

      if (autId) {
        const role = autId.joinedHubs.find(
          (h) => h.hubAddress === hub.address
        ).role;
        const roleSet = hub.metadata.properties.rolesSets.find(
          (rs) => rs.roleSetName === "Default"
        );
        const roleName = roleSet.roles.find((r) => r.id == role).roleName;
        const discordGuild = this.client.guilds.cache.find(
          (g) => g.id === guildId
        );

        const discordRole = discordGuild.roles.cache.find(
          (r) => r.name === roleName
        );
        const guildMember = await discordGuild.members.fetch(discordUserId);
        const newMember = new MemberModel({
          discordId: discordUserId,
          autIdAddress: recoveredAddress,
        });
        const savedMember = await newMember.save();

        // Add the role to the guild member
        await guildMember.roles.add(discordRole);

        return res.status(200).send();
        // await interaction.reply(
        //   `<@${discordUserId}> has claimed their role as <@&${discordRole.id}>.`
        // );
      }
      return res.status(400).send("Failed to claim role");
    } catch (err) {
      // this.loggerService.error(err);
      return res.status(500).send({
        error: err?.message ?? "Something went wrong, please try again later.",
      });
    }
  };

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
      allowedRolesLine += "\n\n\n";
      if (poll.allCanAttend) {
        allowedRolesLine =
          "Anyone with an Āut role from the community can attend.";
      } else {
        allowedRolesLine = "\nPoll for: \n";
        poll.roles.forEach((role, i) => {
          const discordRole = guild.roles.cache.find((r) => r.name === role);
          allowedRolesLine += `<@&${discordRole.id}>\n`;
        });
      }
      let options = "\n Options:";
      options += "\n";
      poll.options.forEach((o, i) => {
        options += `${o.emoji}: ${o.option}\n\n`;
      });
      let description = "";
      description += poll.description;
      description += allowedRolesLine;
      description += options;
      description += `\n Vote ends at ${new Date(poll.endDate).toUTCString()}`;

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

      const message = await channel.send({ embeds: [pollContent] }); // Use a 2d array?

      for (let i = 0; i < poll.options.length; i++) {
        await message.react(poll.options[i].emoji);
      }
      poll.messageId = message.id;
      const newPoll = new PollModel(poll);
      const savedPoll = await newPoll.save();
      await this.agenda.schedule("in 30 seconds", "finalizePoll", {
        id: savedPoll.id,
      });

      res.json(savedPoll);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "An error occurred" });
    }
  };

  public checkGuild = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;

      // Attempt to fetch the guild directly instead of using cache
      try {
        const guild = await this.client.guilds.fetch(guildId);
        return res.json({ active: true });
      } catch (error) {
        // If fetch fails, bot is not in the guild
        return res.json({ active: false });
      }
    } catch (error) {
      console.error(error);
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
