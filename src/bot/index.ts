import dotenv from "dotenv";
dotenv.config();

// imports
import {
  Client,
  Events,
  Collection,
  GatewayIntentBits,
  ChannelType,
  WebSocketManager,
  EmbedBuilder,
  ColorResolvable,
  DMChannel,
  NewsChannel,
  TextChannel,
  GuildMember,
} from "discord.js";
import { config } from "./config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connect } from "mongoose";

import fs from "fs";
import path from "path";
import { GuildModel, IGuild } from "./mongo/guild.model";
import axios from "axios";
import { GatheringModel, ParticipantModel } from "./mongo/gathering.model";
import { Agenda } from "@hokify/agenda";
import { MemberModel } from "./mongo/member.model";
import { PollModel } from "./mongo/poll.model";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const agenda = new Agenda({
  db: { address: process.env.MONGODB_AGENDA_CONNECTION_STRING },
});

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
};

// setTimeout(async () => {
//   await finalizePoll("652fbd207be76f7cb024c2ec");
// }, 10000);

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
(async function () {
  // IIFE to give access to async/await
  await agenda.start();

  // await agenda.schedule("in 5 seconds", "finalizeTask", {
  //   id: "6501e2d11b40017d7a78b9d1",
  // });
  // await agenda.schedule("in 1 minutes", "listen", {
  //   to: "admin@example.com",
  // });
})();

app.post("/gathering", async (req, res) => {
  try {
    //make this upsert
    const gatheringRequest = req.body;
    const gathering = { ...gatheringRequest };
    gathering.roleIds = [];
    const roles = req.body.roles;
    const guild = await client.guilds.cache.find(
      (g) => g.id === gathering.guildId
    );
    if (gatheringRequest.allCanAttend) {
      const guildModel = await GuildModel.findOne({
        guildId: gatheringRequest.guildId,
      });
      for (let i = 0; i < guildModel.roles.length; i++) {
        const role = guildModel.roles[i];
        const result = await guildModel.roles.find((r) => r.name === role.name);
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
    await agenda.schedule(
      new Date(gathering.startDate),
      "initializeGathering",
      {
        id: savedGathering.id,
      }
    );
    await agenda.schedule(new Date(gathering.endDate), "finalizeGathering", {
      id: savedGathering.id,
    });
    res.json(savedGathering);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/poll", async (req, res) => {
  try {
    //make this upsert
    const pollRequest = req.body;
    const poll = { ...pollRequest };
    poll.roleIds = [];
    const roles = req.body.roles;
    const guild = await client.guilds.cache.find((g) => g.id === poll.guildId);
    if (pollRequest.allCanAttend) {
      const guildModel = await GuildModel.findOne({
        guildId: pollRequest.guildId,
      });
      for (let i = 0; i < guildModel.roles.length; i++) {
        const role = guildModel.roles[i];
        const result = await guildModel.roles.find((r) => r.name === role.name);
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
      allowedRolesLine = "'\nAnyone with the following Āut roles can attend:\n";
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

        await agenda.schedule("in 2 minutes", "finalizePoll", {
          id: savedPoll.id,
        });

        res.json(savedPoll);
      })
      .catch(console.error);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/check/:guildId", async (req, res) => {
  try {
    //make this upsert
    const { guildId } = req.params;
    const guild = client.guilds.cache.find((g) => g.id === guildId);
    if (guild) {
      return res.json({ active: true });
    }
    return res.json({ active: false });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/address", async (req, res) => {
  try {
    const address = process.env.BOT_ADDRESS;
    return res.json({ address: address });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});
// Guild is not properly set in tao's nova
app.post("/guild", async (req, res) => {
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
});

app.get("/guild/voiceChannels/:guildId", async (req, res) => {
  try {
    //make this upsert
    const { guildId } = req.params;
    const guild = await client.guilds.cache.find((g) => g.id === guildId);
    //return only voice channels
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
});

app.get("/guild/textChannels/:guildId", async (req, res) => {
  try {
    //make this upsert
    const { guildId } = req.params;
    const guild = await client.guilds.cache.find((g) => g.id === guildId);
    //return only voice channels
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
});

app.post("/getRole", async (req, res) => {
  try {
    const guild = await GuildModel.findOne({ daoAddress: req.body.daoAddress });
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

    const discordGuild = await client.guilds.cache.find(
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
});

app.get("/guild/:daoAddress", async (req, res) => {
  try {
    const { daoAddress } = req.params;
    const guildData = await GuildModel.findOne({ daoAddress: daoAddress });
    console.log(daoAddress);
    return res.json(guildData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/gatherings/:guildId", async (req, res) => {
  try {
    const { guildId } = req.params;
    const gatherings = await GatheringModel.find({ guildId: guildId });
    const guildModel = await GuildModel.findOne({ guildId: guildId });
    const guild = await client.guilds.cache.find((g) => g.id === guildId);
    const roles = {};
    for (let i = 0; i < guildModel.roles.length; i++) {
      const role = guildModel.roles[i];
      const result = await guild.roles.cache.find((r) => r.name === role.name);
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
});

app.get("/polls/:guildId", async (req, res) => {
  try {
    const { guildId } = req.params;
    const polls = await PollModel.find({ guildId: guildId });
    const guildModel = await GuildModel.findOne({ guildId: guildId });
    const guild = await client.guilds.cache.find((g) => g.id === guildId);
    const roles = {};
    for (let i = 0; i < guildModel.roles.length; i++) {
      const role = guildModel.roles[i];
      const result = await guild.roles.cache.find((r) => r.name === role.name);
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
});

app.get("/guild/:guildId", async (req, res) => {
  try {
    const { guildId } = req.params;
    const guildData = await GuildModel.findOne({ guildId: guildId });
    console.log(guildId);
    return res.json(guildData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

const PORT = process.env.SERVER_PORT || 4006;
app.listen(PORT, async () => {
  try {
    await connect(process.env.MONGODB_CONNECTION_STRING);

    console.log(`AutID Discord client listening on port ${PORT}!`);
  } catch (е) {
    console.log("Failed to connect to MongoDB");
  }
});

// app.listen(PORT, async () => {});

// constants
const {
  messages: { prefixes },
  roles: { colors },
} = config;

// const { joinVoiceChannel, VoiceConnectionStatus } = require("@discordjs/voice");
// init

const client = new Client({
  // fetchAllMembers: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// client.commands = new Collection();

// const foldersPath = path.join(__dirname, "commands");
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
//   const commandsPath = path.join(foldersPath, folder);
//   const commandFiles = fs
//     .readdirSync(commandsPath)
//     .filter((file) => file.endsWith(".js"));
//   for (const file of commandFiles) {
//     const filePath = path.join(commandsPath, file);
//     const command = require(filePath);
//     // Set a new item in the Collection with the key as the command name and the value as the exported module
//     if ("data" in command && "execute" in command) {
//       client.commands.set(command.data.name, command);
//     } else {
//       console.log(
//         `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
//       );
//     }
//   }
// }

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;
//   console.log(interaction);
//   const command = interaction.client.commands.get(interaction.commandName);

//   if (!command) {
//     console.error(`No command matching ${interaction.commandName} was found.`);
//     return;
//   }

//   try {
//     await command.execute(interaction);
//   } catch (error) {
//     console.error(error);
//     if (interaction.replied || interaction.deferred) {
//       await interaction.followUp({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     } else {
//       await interaction.reply({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     }
//   }
// });

client.on(Events.GuildMemberAdd, async (m) => {
  console.log(`member! ${m}`);

  const guildData = await GuildModel.findOne({ guildId: m.guild.id });

  const channel = m.guild.channels.cache.find(
    (c) => c.id === guildData.roleChannelId
  );
  if (!channel) return;
  (channel as TextChannel | DMChannel | NewsChannel).send(
    `Welcome <@${m.id}>! Get your Āut role by following this link: http://localhost:3000/claimrole?daoAddress=${guildData.daoAddress}`
  );
});

// client.on(Events.MessageCreate, async (m) => {
// console.log("message!");
// console.log(`message! ${m.guildId}`);
// console.log(`message! ${m.content}`);
// const guild = m.guild;
// guild.channels
//   .delete({
//     name: "Aut-role-Channel",
//     type: ChannelType.GuildText,
//   })
//   .then((channel) => {
//     console.log(`Created new channel: ${channel.name}`);
//   })
//   .catch(console.error);
// guild.roles
//   .create({
//     name: "Aut-Role-1",
//     color: "#ff0000",
//     reason: "we needed a role for Aut-Role-1",
//   })
//   .then((i) => {
//     console.log(i);
//   })
//   .catch(console.error);
// });

client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  // const res = await c.guilds.fetch();
  // res.forEach((guild) => {
  //   console.log(`${guild.name} (ID: ${guild.id})`);
  // });
});

//joined a server
client.on(Events.GuildCreate, async (guild) => {
  console.log("Joined a new guild: " + guild.name);
  const botRole = guild.roles.cache.find(
    (r) => r.name === client.user.username
  );
  const guildData = await GuildModel.findOne({ guildId: guild.id });
  guildData.roles.forEach((role, i) => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    guild.roles
      .create({
        name: role.name,
        color: randomColor as ColorResolvable,
        reason: "Āut role from Āut Nova",
      })
      .then((i) => {
        // console.log(i);
      })
      .catch((e) => {
        console.error(e);
      });
  });
  botRole.setPosition(1);
  if (!guildData.roleChannelId) {
    guild.channels
      .create({
        name: "Āut-role-Channel",
        type: ChannelType.GuildText,
      })
      .then(async (channel) => {
        console.log(`Created new channel: ${channel.name}`);
        await GuildModel.updateOne(
          { guildId: guild.id },
          { $set: { roleChannelId: channel.id } }
        );
      })
      .catch((e) => {
        console.error(e);
      });
  }

  //Your other stuff like adding to guildArray
});

// const userStates = {};

// const hasUnmuted = (oldState, newState) => {
//   // for (let keys in oldState) {
//   //   if (oldState[keys] !== newState[keys]) {
//   //     console.log(keys);
//   //   }
//   // }

//   return oldState.mute && !newState.mute;
// };

// const hasMuted = (oldState, newState) => {
//   return !oldState.mute && newState.mute;
// };

const compareStates = (oldState, newState) => {
  return {
    selfStreamChanged: oldState.streaming !== newState.streaming,
    selfVideoChanged: oldState.selfVideo !== newState.selfVideo,
    muteChanged: oldState.mute !== newState.mute,
    serverMuted: !oldState.serverMute && newState.serverMute,
    selfDeafChanged: oldState.selfDeaf !== newState.selfDeaf,
    hasMuted: !oldState.mute && newState.mute,
    hasStoppedStreaming: oldState.streaming && !newState.streaming,
    hasStoppedVideo: oldState.selfVideo && !newState.selfVideo,
  };
};

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const { member, channelId } = newState;
  const guildId = member.guild.id;

  // const gathering = await GatheringModel.findOne({ channelId: channelId });
  const currentDate = new Date();
  const gathering = await GatheringModel.findOne({
    guildId: guildId,
    startDate: { $lte: currentDate },
    endDate: { $gt: currentDate },
  });

  const {
    selfStreamChanged,
    selfVideoChanged,
    muteChanged,
    serverMuted,
    selfDeafChanged,
    hasMuted,
    hasStoppedStreaming,
    hasStoppedVideo,
  } = compareStates(oldState, newState);

  if (gathering) {
    // const unmute = hasUnmuted(oldState, newState);

    // const mute = hasMuted(oldState, newState);
    // todo add all can join
    const roleMatched = newState.member.roles.cache.find((r) =>
      gathering.roleIds.includes(r.id)
    );

    if (!roleMatched) {
      return;
    }

    const participant = gathering.participants.find(
      (p) => p.discordId === member.user.id
    );

    if (!participant) {
      const newParticipant = new ParticipantModel({
        discordId: member.user.id,
        secondsOpenMic: 0,
        secondsStream: 0,
        secondsVideo: 0,
        timeJoined: new Date(),
        deafened: newState.deaf,
        muted: newState.mute,
        streaming: newState.streaming,
        selfVideo: newState.selfVideo,
        serverMutedCount: 0,
        lastUpdatedMute: new Date(),
        lastUpdatedStream: new Date(),
        lastUpdatedVideo: new Date(),
      });

      gathering.participants.push(newParticipant);
      gathering.save();
    } else {
      if (channelId) {
        let secondsOpenMic = 0;
        let secondsStream = 0;
        let secondsVideo = 0;
        if (hasMuted) {
          secondsOpenMic =
            (new Date().getTime() - participant.lastUpdatedMute.getTime()) /
            1000;
        }
        if (hasStoppedStreaming) {
          secondsStream =
            (new Date().getTime() - participant.lastUpdatedStream.getTime()) /
            1000;
        }
        if (hasStoppedVideo) {
          secondsVideo =
            (new Date().getTime() - participant.lastUpdatedVideo.getTime()) /
            1000;
        }

        // discordId: String,
        // seconds: Number,
        // timeJoined: Date,
        // deafened: Boolean,
        // muted: Boolean,
        // serverMutedCount: Number,
        // lastUpdatedMute: Date,
        // lastUpdatedStream: Date,
        // lastUpdatedVideo: Date,
        GatheringModel.updateOne(
          {
            id: gathering.id,
            "participants._id": participant._id,
          },
          {
            $set: {
              "participants.$.secondsOpenMic":
                participant.secondsOpenMic + secondsOpenMic,
              "participants.$.secondsStream":
                participant.secondsStream + secondsStream,
              "participants.$.secondsVideo":
                participant.secondsVideo + secondsVideo,
              "participants.$.serverMutedCount":
                participant.serverMutedCount + (serverMuted ? 1 : 0),
              "participants.$.deafened": newState.deaf,
              "participants.$.muted": newState.mute,
              "participants.$.streaming": newState.streaming,
              "participants.$.selfVideo": newState.selfVideo,
              "participants.$.lastUpdatedMute": muteChanged
                ? new Date()
                : participant.lastUpdatedMute,
              "participants.$.lastUpdatedStream": selfStreamChanged
                ? new Date()
                : participant.lastUpdatedStream,
              "participants.$.lastUpdatedVideo": selfVideoChanged
                ? new Date()
                : participant.lastUpdatedVideo,
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
      } else {
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

        GatheringModel.updateOne(
          {
            id: gathering.id,
            "participants._id": participant._id,
          },
          {
            $set: {
              "participants.$.secondsOpenMic":
                participant.secondsOpenMic + secondsOpenMic,
              "participants.$.secondsStream":
                participant.secondsStream + secondsStream,
              "participants.$.secondsVideo":
                participant.secondsVideo + secondsVideo,
              "participants.$.serverMutedCount": participant.serverMutedCount,
              "participants.$.deafened": true,
              "participants.$.muted": true,
              "participants.$.streaming": false,
              "participants.$.selfVideo": false,
              "participants.$.lastUpdatedMute": new Date(),
              "participants.$.lastUpdatedStream": new Date(),
              "participants.$.lastUpdatedVideo": new Date(),
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
      }
    }
  }

  // console.log(gathering);
});

// client.on("voiceStateUpdate", (oldState, newState) => {
//   const { member, channelID, muted } = newState;
//   const userID = member.id;
//   console.log("voiceStateUpdate", userStates);
//   console.log("userID", userID);

//   if (!channelID) {
//     // User left a voice channel
//     if (userStates[userID]) {
//       // User was in a voice channel, so calculate and log their time
//       const { startTime, unmutedDuration } = userStates[userID];
//       if (!muted && startTime) {
//         const endTime = moment();
//         const duration = moment.duration(endTime.diff(startTime));
//         const unmutedTime = unmutedDuration + duration.asSeconds();
//         console.log(
//           `${member.displayName} spent ${unmutedTime.toFixed(
//             2
//           )} seconds unmuted.`
//         );
//       }
//       delete userStates[userID];
//     }
//   } else {
//     // User joined a voice channel
//     if (!muted) {
//       // User joined a channel with an unmuted mic
//       userStates[userID] = {
//         startTime: moment(),
//         unmutedDuration: 0,
//       };
//     }
//   }
// });

// client.on("voiceStateUpdate", (oldState, newState) => {
//   const { member, channelID, muted } = newState;
//   const userID = member.id;

//   console.log("userID", userID);
//   if (!channelID) {
//     // User left a voice channel
//     if (userStates[userID]) {
//       // User was in a voice channel, so calculate and log their time
//       const { startTime, unmutedDuration } = userStates[userID];
//       if (!muted && startTime) {
//         const endTime = moment();
//         const duration = moment.duration(endTime.diff(startTime));
//         const unmutedTime = unmutedDuration + duration.asSeconds();
//         console.log(
//           `${member.displayName} spent ${unmutedTime.toFixed(
//             2
//           )} seconds unmuted.`
//         );
//       }
//       delete userStates[userID];
//     }
//   } else {
//     // User joined a voice channel
//     if (!muted) {
//       // User joined a channel with an unmuted mic
//       userStates[userID] = {
//         startTime: moment(),
//         unmutedDuration: 0,
//       };
//     }
//   }
// });

client.login(process.env.TOKEN);
// client.commands = new Collection();

// client.commands.set(ping.data.name, ping);

// setInterval(() => closePolls(), 1000 * 60 * 60 * 24); // 24 hours!
// setInterval(() => closePolls(), 1000 * 60); // 1 minute!

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;
//   const command = interaction.client.commands.get(interaction.commandName);

//   if (!command) {
//     console.error(`No command matching ${interaction.commandName} was found.`);
//     return;
//   }

//   try {
//     await command.execute(interaction);
//   } catch (error) {
//     console.error(error);
//     if (interaction.replied || interaction.deferred) {
//       await interaction.followUp({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     } else {
//       await interaction.reply({
//         content: "There was an error while executing this command!",
//         ephemeral: true,
//       });
//     }
//   }
// });

// events actions
// client.on("ready", async () => {
//   console.info(`Logged in as ${client.user.tag}!`);
//   console.log(client.channels);

//   // const res = await client.guilds.fetch();
//   // res.forEach((guild) => {
//   //   console.log(`${guild.name} (ID: ${guild.id})`);
//   // });

//   client.guilds.cache.forEach((guild) => {
//     console.log(`${guild.name} (ID: ${guild.id})`);
//   });

//   client.guilds.cache.forEach((guild) => {
//     console.log(`\nChannels in ${guild.name} (ID: ${guild.id}):`);
//     guild.channels.cache.forEach((channel) => {
//       console.log(`- ${channel.name} (ID: ${channel.id})`);
//     });
//   });

//   const guild = client.guilds.cache.entries().next().value[1];
//   const guildId = client.guilds.cache.entries().next().value[0];
//   const channelId = client.guilds.cache
//     .entries()
//     .next()
//     .value[1].channels.cache.entries()
//     .next().value[1];

//   const connection = joinVoiceChannel({
//     channelId: channelId,
//     guildId: guildId,
//     adapterCreator: guild.voiceAdapterCreator,
//   });

//   connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
//     console.log("Connection is in the Ready state!");
//   });

//   // client.channels.cache.get("General");

//   // closePolls();
// });

// client.on("voiceStateUpdate", (oldState, newState) => {
//   const oldChannel = oldState.channel;
//   const newChannel = newState.channel;

//   if (oldChannel && !newChannel && oldChannel.id === channelId) {
//     // User left the channel, track their duration
//     const timeSpentInChannel = Date.now() - newState.joinedTimestamp;
//     console.log(
//       `${newState.member.displayName} left after ${timeSpentInChannel}ms.`
//     );
//   }
// });

// message
// client.on("messageCreate", async (msg) => {
//   if (msg.content === prefixes.swHelp) {
//     const reply = new MessageEmbed().setTitle("Help").addField(
//       "/setup {key}",
//       `The first thing you need to do is enter \`/setup {key}\` with a *key* parameter
//         to connect your discord server and community, otherwise the client will not work.`
//     );

//     msg.channel.send({ embeds: [reply] });
//   }
// });

const postPoll = async (pollData) => {
  // const poll = {
  //   message: {
  //     title: pollData.title,
  //     description:
  //       "\n          Everyone from a specific role would be able to vote to \n          achieve truly decentralized communities!\n          \nYes 👍\nNo 👎\n          ",
  //     fields: [
  //       {
  //         name: "Poll Duration",
  //         value: "1w",
  //         inline: true,
  //       },
  //       {
  //         name: "Role",
  //         value: "All",
  //         inline: true,
  //       },
  //     ],
  //     author: {
  //       name: "Taulant",
  //       icon_url:
  //         "https://ipfs.io/ipfs/bafybeiaok5esvbdym2othwvxt2wcsanrd4bmyu64p7f25gg7dvtp6bbodq",
  //     },
  //     footer: {
  //       text: "Latest Community@AutID",
  //       icon_url:
  //         "https://ipfs.io/ipfs/bafybeianskdviohbyp2yi7jty55sisrbbmm2jj5xz3dook3jigvvltumji/images.jpeg",
  //     },
  //   },
  //   roleName: "All",
  //   duration: "1w",
  //   emojis: ["👍", "👎"],
  //   pollsAddress: "0x270e27E4E6422C311449E9aA258B3181235837ce",
  //   pollID: 2,
  //   role: 0,
  // };
};
// async function closePolls() {
//   console.log("closePolls");

//   const polls = await getAllPolls();
//   polls.forEach(async (poll) => {
//     console.log(poll.endDate);
//     console.log(Date.now());
//     console.log(poll.endDate < Date.now());
//     if (poll.endDate < Date.now()) {
//       const guild = await client.guilds.fetch(poll.guildID);
//       const channel = await guild.channels.fetch(poll.channelID);

//       const message = await channel.messages.fetch(poll.messageID);

//       let reactionWinnerCount = -1;
//       let reactionWinnerIndex = 0;
//       for (let i = 0; i < poll.emojis.length; i++) {
//         console.log("getting community extension");
//         console.log("polls addr", poll.pollsAddress);
//         const communityExtension = await getCommunityExtensionFromPolls(
//           poll.pollsAddress
//         );
//         console.log("communityExtension", communityExtension);
//         // console.log("relevantDiscordIds", relevantDiscordIds);
//         const userReactionsMapping = await message.reactions
//           .resolve(poll.emojis[i])
//           .users.fetch();
//         var reactedUserIds = Array.from(userReactionsMapping.keys());

//         console.log("getting relevant discord Ids");
//         const relevantDiscordIds =
//           (await getRelevantDiscordIDs(
//             communityExtension,
//             poll.role,
//             reactedUserIds
//           )) ?? [];

//         console.log("relevantDiscordIds", relevantDiscordIds);

//         const relevantReactions = reactedUserIds.filter((value) =>
//           relevantDiscordIds.includes(value)
//         );

//         if (reactionWinnerCount < relevantReactions.length) {
//           reactionWinnerCount = relevantReactions.length;
//           reactionWinnerIndex = i;
//         }

//         // finalize poll onchain
//         await finalizePoll(
//           poll.pollsAddress,
//           poll.pollID,
//           [],
//           poll.emojis[reactionWinnerIndex],
//           reactionWinnerCount
//         );
//       }

//       // close Poll
//       const pollContent = message.embeds[0];

//       console.log("reactionWinnerCount", reactionWinnerCount);
//       console.log("reactionWinnerIndex", reactionWinnerIndex);
//       console.log(poll.emojis[reactionWinnerIndex]);

//       let winnersText;
//       if (reactionWinnerCount == 1) {
//         winnersText = "No one voted!";
//       } else {
//         winnersText =
//           poll.emojis[reactionWinnerIndex] +
//           " (" +
//           (reactionWinnerCount - 1) +
//           " votes)\n";
//       }
//       pollContent.addField("**Winner:**", winnersText);
//       pollContent.setTimestamp();
//       channel.send({ embeds: [pollContent] });

//       deletePoll(poll._id);
//     }
//   });
// }
