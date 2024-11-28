import { Schema, model, Document } from "mongoose";

interface IOption {
  option: string;
  emoji: string;
}

interface IPoll extends Document {
  guildId: string;
  title: string;
  description: string;
  channelId: string;
  messageId: string;
  roleIds: string[];
  startDate: Date;
  endDate: Date;
  weight: number;
  options: string[];
}

const optionSchema = new Schema<IOption>({
  option: String,
  emoji: String,
});

const PollSchema = new Schema<IPoll>({
  guildId: { type: String },
  title: { type: String },
  description: { type: String },
  channelId: { type: String },
  messageId: { type: String },
  roleIds: [String],
  startDate: { type: Date },
  endDate: { type: Date },
  weight: { type: Number },
  options: [{ type: String, required: true }],
});

export const PollModel = model<IPoll>("Poll", PollSchema);