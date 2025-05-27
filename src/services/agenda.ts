import { Agenda } from "@hokify/agenda";
import { Client, Collection, GuildMember, TextChannel } from "discord.js";
import {
  IParticipant,
  ParticipantModel,
} from "../models/discord/gathering.model";
import { GatheringModel } from "../models/discord/gathering.model";
import { PollModel } from "../models/discord/poll.model";
import { SubgraphQueryService } from "./subgraph-query.service";
import { MemberModel } from "../models/discord/member.model";
import { SdkContainerService } from "../tools/sdk.container";
import { Hub } from "@aut-labs/sdk";

export class AgendaManager {
  private discordClient: Client;
  private subgrapghQueryService: SubgraphQueryService;
  private sdkContainerService: SdkContainerService;
  agenda: Agenda;
  constructor(discordClient, subgrahpQueryServuce, sdkContainerService) {
    try {
      this.discordClient = discordClient;
      this.subgrapghQueryService = subgrahpQueryServuce;
      this.sdkContainerService = sdkContainerService;
      this.agenda = new Agenda({
        db: { address: `${process.env.MONGODB_CONNECTION_STRING}/agenda` },
      });

      this.initializeJobs();
      this.startAgenda();
    } catch (error) {
      console.error("Error initializing AgendaManager:", error);
    }
  }

  initializeJobs() {
    this.agenda.define("finalizeGathering", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await this.finalizeGathering(job.attrs.data.id);
    });

    this.agenda.define("initializeGathering", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await this.initializeGathering(job.attrs.data.id);
    });

    this.agenda.define("finalizePoll", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await this.finalizePoll(job.attrs.data.id);
    });
  }

  async startAgenda() {
    try {
      console.log("Trying to start agenda");
      await this.agenda.start();
      console.log("Agenda started successfully");
    } catch (error) {
      console.error("Failed to start Agenda:", error);
    }
  }

  // Method to schedule a job
  async scheduleJob(when, jobName, data) {
    try {
      await this.agenda.schedule(when, jobName, data);
      console.log(`Job '${jobName}' scheduled successfully`);
    } catch (error) {
      console.error(`Failed to schedule job '${jobName}':`, error);
    }
  }

  async finalizeGathering(id: string) {
    try {
      const gathering = await GatheringModel.findById(id);
      if (!gathering) return;

      const guild = await this.discordClient.guilds.cache.find(
        (g) => g.id === gathering.guildId
      );
      const channel = guild.channels.cache.find(
        (c) => c.id === gathering.channelId
      );
      const memberCols = channel.members as Collection<string, GuildMember>;
      const gatheringDuration =
        (gathering.endDate.getTime() - gathering.startDate.getTime()) / 1000;

      const hub = await this.subgrapghQueryService.getHubFromGuildId(
        gathering.guildId
      );

      const hubService: Hub = this.sdkContainerService.sdk.initService(
        Hub,
        hub.address
      );

      for (const participant of gathering.participants) {
        const member = memberCols.find(
          (m) => m.user.id === participant.discordId
        );
        const isInCall = !!member;

        let secondsInCall = participant.secondsInChannel || 0;

        if (isInCall) {
          const newSeconds =
            (new Date().getTime() - participant.lastUpdatedPresence.getTime()) /
            1000;
          secondsInCall += newSeconds;
        }

        const meetsMinDuration = secondsInCall > gatheringDuration * 0.5;
        console.log(
          `Participant ${participant.discordId}: ${secondsInCall}s in call, ` +
            `${
              meetsMinDuration ? "meets" : "does not meet"
            } 50% duration requirement`
        );
        await GatheringModel.updateOne(
          {
            id: gathering.id,
            "participants._id": participant._id,
          },
          {
            $set: {
              "participants.$.secondsInChannel": secondsInCall,
              "participants.$.lastUpdatedPresence": new Date(),
            },
          }
        );
        const memberModel = await MemberModel.findOne({
          discordId: member.user.id,
        });
        // memberModel.
        if (memberModel.autIdAddress) {
          if (meetsMinDuration) {
            const taskManager = await hubService.getTaskManager();
            const response = await taskManager.commitContribution(
              gathering.contributionId,
              memberModel.autIdAddress,
              "0x"
            );
            if (!response.isSuccess) {
              console.error(
                `Error committing contribution for user ${member.user.id}:`,
                response.errorMessage
              );
              continue;
            }
            const pointsResponse = await taskManager.giveContribution(
              gathering.contributionId,
              memberModel.autIdAddress
            );
            if (!pointsResponse.isSuccess) {
              console.error(
                `Error giving points for user ${member.user.id}:`,
                pointsResponse.errorMessage
              );
            }
          }
        }
      }
    } catch (e) {
      console.error("Error finalizing gathering:", e);
    }
  }

  async initializeGathering(id: string) {
    try {
      const gathering = await GatheringModel.findById(id);
      if (!gathering) return;

      const guild = await this.discordClient.guilds.cache.find(
        (g) => g.id === gathering.guildId
      );

      const channel = guild.channels.cache.find(
        (c) => c.id === gathering.channelId
      );
      const members = channel.members as Collection<string, GuildMember>;
      for (const member of members) {
        const roleMatched = member[1].roles.cache.find((r) =>
          gathering.roleIds.includes(r.id)
        );

        if (!roleMatched) continue;

        const participant = gathering.participants.find(
          (p) => p.discordId === member[1].user.id
        );

        if (!participant) {
          gathering.participants.push({
            discordId: member[1].user.id,
            secondsInChannel: 0,
            timeJoined: new Date(),
            lastUpdatedPresence: new Date(),
          } as IParticipant);
        }
      }

      await gathering.save();
    } catch (e) {
      console.error("Error initializing gathering:", e);
    }
  }

  async finalizePoll(id: string) {
    const poll = await PollModel.findById(id);
    const guild = await this.discordClient.guilds.cache.find(
      (g) => g.id === poll.guildId
    );

    const members = await guild.members.fetch();

    const channel = await guild.channels.cache.find(
      (c) => c.id === poll.channelId
    );

    const textChannel = channel as TextChannel;

    const message = await textChannel.messages.cache.find(
      (m) => m.id === poll.messageId
    );
    const fetchMessage = await textChannel.messages.fetch(poll.messageId);
    let reactions = [];

    for (const o of poll.options) {
      // Get users who reacted with this emoji
      const userReactions = await fetchMessage.reactions.cache
        .get(o.emoji)
        .users.fetch();

      // Create an object for this emoji and its users
      const emojiReaction = {
        emoji: o.emoji,
        userIds: [],
      };

      // Filter users based on role match
      fetchMessage.reactions.cache.get(o.emoji).users.cache.forEach((u) => {
        const roleMatched = members
          .find((m) => m.user.id === u.id)
          .roles.cache.find((r) => poll.roleIds.includes(r.id));

        if (roleMatched) {
          emojiReaction.userIds.push(u.id);
        }
      });

      reactions.push(emojiReaction);
    }

    const userReactions = reactions.reduce((acc, { emoji, userIds }) => {
      userIds.forEach((userId) => {
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(emoji);
      });
      return acc;
    }, {});

    const uniqueUserIds = [
      ...new Set(reactions.flatMap((reaction) => reaction.userIds)),
    ];

    const hub = await this.subgrapghQueryService.getHubFromGuildId(
      poll.guildId
    );

    const hubService: Hub = this.sdkContainerService.sdk.initService(
      Hub,
      hub.address
    );

    for (let i = 0; i < uniqueUserIds.length; i++) {
      const userId = uniqueUserIds[i];

      const member = await guild.members.fetch(userId);
      const memberModel = await MemberModel.findOne({
        discordId: member.user.id,
      });
      // memberModel.
      if (memberModel.autIdAddress) {
        const taskManager = await hubService.getTaskManager();
        const response = await taskManager.commitContribution(
          poll.contributionId,
          memberModel.autIdAddress,
          "0x"
        );
        if (!response.isSuccess) {
          console.error(
            `Error committing contribution for user ${userId}:`,
            response.errorMessage
          );
          continue;
        }
        const pointsResponse = await taskManager.giveContribution(
          poll.contributionId,
          memberModel.autIdAddress
        );
        if (!pointsResponse.isSuccess) {
          console.error(
            `Error giving points for user ${userId}:`,
            pointsResponse.errorMessage
          );
        }
      } else {
        console.error(`Address not found for user ${userId}`);
      }
    }

    console.log(JSON.stringify(reactions));
    console.log(JSON.stringify(userReactions));
  }
}
