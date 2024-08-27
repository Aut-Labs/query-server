const { GatheringModel } = require("./mongo/gathering.model");

const finalizeGathering = async (gatheringId) => {
  try {
    const gathering = await GatheringModel.findOne({
      id: gatheringId,
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
          (gathering.endDate.getTime() - gathering.startDate.getTime()) / 1000;
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
            id: gatheringId,
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
};

const initializeGathering = async (gatheringId) => {
  const gathering = await GatheringModel.findOne({
    id: gatheringId,
  });

  const guild = await client.guilds.cache.find(
    (g) => g.id === gathering.guildId
  );

  const channel = guild.channels.cache.find(
    (c) => c.id === gathering.channelId
  );

  channel.members.forEach((member) => {
    const participant = gathering.participants.find(
      (p) => p.discordId === member.user.id
    );

    if (!participant) {
      const voiceState = member.voice;
      gathering.participants.push({
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
    }
  });

  gathering.save();

  // client.guilds.cache.forEach(async (guild) => {
  //   const guildData = await GuildModel.findOne({ guildId: guild.id });
  //   const channel = guild.channels.cache.find(
  //     (c) => c.id === guildData.gatheringChannelId
  //   );
  //   if (!channel) return;
  //   const gathering = await GatheringModel.findOne({
  //     channelId: channel.id,
  //   });
  //   if (!gathering) {
  //     const newGathering = new GatheringModel({
  //       guildId: guild.id,
  //       channelId: channel.id,
  //       participants: [],
  //       startDate: new Date(),
  //       endDate: new Date(new Date().getTime() + 60 * 60 * 1000),
  //     });
  //     await newGathering.save();
  //   }
  // });
};

const finalizePoll = async (pollId) => {
  const poll = await PollModel.findOne({
    id: pollId,
  });
  //652fbd207be76f7cb024c2ec
  //1133407677091942480
  //1133407677544935486
  //1162041973994168401
  const guild = await client.guilds.cache.find((g) => g.id === poll.guildId);

  const members = await guild.members.fetch();

  const channel = await guild.channels.cache.find(
    (c) => c.id === poll.channelId
  );

  const message = await channel.messages.cache.find(
    (m) => m.id === poll.messageId
  );
  const fetchMessage = await channel.messages.fetch(poll.messageId);
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
};

// setTimeout(async () => {
//   await finalizePoll("652fbd207be76f7cb024c2ec");
// }, 10000);

export const defineJobs = async (agenda) => {
  agenda.define("finalizeGathering", async (job) => {
    console.log("job date", job.attrs.lockedAt);
    console.log(job.attrs.data.id);
    await finalizeGathering(job.attrs.data.id);
  });
  agenda.define("initializeGathering", async (job) => {
    console.log("job date", job.attrs.lockedAt);
    console.log(job.attrs.data.id);
    await initializeGathering(job.attrs.data.id);
  });
  agenda.define("finalizePoll", async (job) => {
    console.log("job date", job.attrs.lockedAt);
    console.log(job.attrs.data.id);
    await finalizePoll(job.attrs.data.id);
  });
};
