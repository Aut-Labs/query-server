import { Agenda } from "@hokify/agenda";
import { Client, Collection, GuildMember, TextChannel } from "discord.js";
import { ParticipantModel } from "../models/discord/gathering.model";
import { GatheringModel } from "../models/discord/gathering.model";
import { PollModel } from "../models/discord/poll.model";

export class AgendaManager {
  private discordClient: Client;
  agenda: Agenda;
  constructor(discordClient) {
    this.discordClient = discordClient;
    this.agenda = new Agenda({
      db: { address: `${process.env.MONGODB_CONNECTION_STRING}/agenda` },
    });

    this.initializeJobs();
    this.startAgenda();
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
      const gathering = await GatheringModel.findOne({
        id: id,
      });
      if (gathering) {
        gathering.participants.forEach((participant) => {
          let secondsOpenMic = 0;
          let secondsStream = 0;
          let secondsVideo = 0;
          if (!participant.muted) {
            secondsOpenMic =
              (new Date().getTime() - participant.lastUpdatedMute.getTime()) /
              1000;
          }
          if (participant.streaming) {
            secondsStream =
              (new Date().getTime() - participant.lastUpdatedStream.getTime()) /
              1000;
          }
          if (participant.selfVideo) {
            secondsVideo =
              (new Date().getTime() - participant.lastUpdatedVideo.getTime()) /
              1000;
          }
          //1,2,3
          let participantScore = 0;
          const weight = 1;
          const weightPoints = weight * 100;
          const newSecondsOpenMic = participant.secondsOpenMic + secondsOpenMic;
          const newSecondsStream = participant.secondsStream + secondsStream;
          const newSecondsVideo = participant.secondsVideo + secondsVideo;
          const gatheringDuration =
            (gathering.endDate.getTime() - gathering.startDate.getTime()) /
            1000;
          const { serverMutedCount } = participant;

          if (newSecondsOpenMic > gatheringDuration * 0.66) {
            participantScore += weightPoints;
          }
          if (newSecondsStream > 60) {
            participantScore = participantScore + 0.15 * weightPoints;
          }
          if (newSecondsVideo > 60) {
            participantScore = participantScore + 0.15 * weightPoints;
          }
          if (serverMutedCount > 1) {
            participantScore = participantScore - 0.15 * weightPoints;
          }

          console.log(
            `Participant with ${participant.id} and score:`,
            participantScore
          );
          // const member = await MemberModel.findOne({ discordId: participant.duration });

          GatheringModel.updateOne(
            {
              id: id,
              "participants._id": participant._id,
            },
            {
              $set: {
                "participants.$.secondsOpenMic": newSecondsOpenMic,
                "participants.$.secondsStream": newSecondsStream,
                "participants.$.secondsVideo": newSecondsVideo,
                // "participants.$.serverMutedCount":
                //   participant.serverMutedCount + (serverMuted ? 1 : 0),
                // "participants.$.deafened": newState.deaf,
                // "participants.$.muted": newState.mute,
                // "participants.$.streaming": newState.streaming,
                // "participants.$.selfVideo": newState.selfVideo,
                // "participants.$.lastUpdatedMute": muteChanged
                //   ? new Date()
                //   : participant.lastUpdatedMute,
                // "participants.$.lastUpdatedStream": selfStreamChanged
                //   ? new Date()
                //   : participant.lastUpdatedStream,
                // "participants.$.lastUpdatedVideo": selfVideoChanged
                //   ? new Date()
                //   : participant.lastUpdatedVideo,
              },
            },
            (err, result) => {
              if (err) {
                console.error("Error updating participant:", err);
              } else {
                console.log("Participant updated successfully:", result);
              }
            }
          );
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async initializeGathering(id: string) {
    const gathering = await GatheringModel.findOne({
      id: id,
    });

    const guild = await this.discordClient.guilds.cache.find(
      (g) => g.id === gathering.guildId
    );

    const channel = guild.channels.cache.find(
      (c) => c.id === gathering.channelId
    );

    const members = channel.members as Collection<string, GuildMember>;

    members.forEach((member) => {
      const participant = gathering.participants.find(
        (p) => p.discordId === member.user.id
      );

      if (!participant) {
        const voiceState = member.voice;
        const newParticipant = new ParticipantModel({
          discordId: member.user.id,
          secondsOpenMic: 0,
          secondsStream: 0,
          secondsVideo: 0,
          timeJoined: new Date(),
          deafened: voiceState.deaf,
          muted: voiceState.mute,
          streaming: voiceState.streaming,
          selfVideo: voiceState.selfVideo,
          serverMutedCount: 0,
          lastUpdatedMute: new Date(),
          lastUpdatedStream: new Date(),
          lastUpdatedVideo: new Date(),
        });

        gathering.participants.push(newParticipant);
      }
    });

    gathering.save();
  }

  async finalizePoll(id: string) {
    const poll = await PollModel.findOne({
      id: id,
    });
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
    let reactions = {};
    for (const o of poll.options) {
      reactions[o.emoji] = [];
      const userReactions = await fetchMessage.reactions.cache
        .get(o.emoji)
        .users.fetch();
      fetchMessage.reactions.cache.get(o.emoji).users.cache.forEach((u) => {
        const roleMatched = members
          .find((m) => m.user.id === u.id)
          .roles.cache.find((r) => poll.roleIds.includes(r.id));

        if (roleMatched) {
          reactions[o.emoji].push(u.id);
        }
      });
    }

    console.log(JSON.stringify(reactions));
  }
}
