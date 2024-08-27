import { Schema, model, Document } from "mongoose";

interface IRole {
  name: string;
  id: string;
}

export interface IGuild extends Document {
  guildId: string;
  daoAddress: string;
  roleChannelId: string;
  roles: IRole[];
  callDuration: number;
}

const roleSchema = new Schema<IRole>({
  name: String,
  id: String,
});

const GuildSchema = new Schema<IGuild>({
  guildId: { type: String },
  daoAddress: { type: String },
  roleChannelId: { type: String },
  roles: [roleSchema],
  callDuration: { type: Number },
});

export const GuildModel = model<IGuild>("Guild", GuildSchema);