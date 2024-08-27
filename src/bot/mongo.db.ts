import { Schema, model, Document } from "mongoose";
import { PollModel } from "./mongo/poll.model";

interface IGuildPerPartner extends Document {
  guildID: string;
  key: string;
  communityAddress: string;
}

const GuildPerPartner = new Schema<IGuildPerPartner>({
  guildID: { type: String },
  key: { type: String },
  communityAddress: { type: String },
});

const GuildPerPartnerModel = model<IGuildPerPartner>(
  "GuildPerPartners",
  GuildPerPartner
);

export const getAllPolls = async () => {
  const polls = await PollModel.find().exec();
  return polls;
};

export const insertPoll = async (
  guildID: string,
  channelID: string,
  messageID: string,
  endDate: string,
  emojis: string[],
  pollsAddress: string,
  pollID: string,
  role: string
) => {
  const guild = new PollModel({
    guildID,
    channelID,
    messageID,
    endDate,
    emojis,
    pollsAddress,
    pollID,
    role,
  });

  return guild.save();
};

export const deletePoll = async (id: string) => {
  await PollModel.deleteOne({ _id: id }).exec();
};

export const addGuild = (
  guildID: string,
  key: string,
  communityAddress: string
) => {
  const guild = new GuildPerPartnerModel({
    communityAddress,
    key,
    guildID,
  });

  return guild.save();
};
