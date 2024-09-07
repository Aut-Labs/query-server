import { injectable } from "inversify";
import { Request, Response } from "express";
import {
  Client,
  TextChannel,
  EmbedBuilder,
  ChannelType,
  GatewayIntentBits,
  Events,
} from "discord.js";
import axios from "axios";
import { GuildModel } from "../models/discord/guild.model";
import { GatheringModel } from "../models/discord/gathering.model";
import { PollModel } from "../models/discord/poll.model";
import { MemberModel } from "../models/discord/member.model";
import { Agenda } from "@hokify/agenda";
import { AgendaManager } from "../services/agenda";

@injectable()
export class DiscordController {
  private client: Client;
  private agenda: Agenda;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.client.once(Events.ClientReady, async (c) => {
      console.log(`Ready! Logged in as ${c.user.tag}`);
    });
    console.log("logging in");
    this.client.login(process.env.DISCORD_TOKEN);

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

  public checkGuild = async (req: Request, res: Response) => {
    try {
      const { guildId } = req.params;
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
