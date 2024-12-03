import { Schema, model, Document } from "mongoose";

// export interface IParticipant extends Document {
//   discordId: string;
//   secondsOpenMic: number;
//   secondsStream: number;
//   secondsVideo: number;
//   timeJoined: Date;
//   deafened: boolean;
//   muted: boolean;
//   streaming: boolean;
//   selfVideo: boolean;
//   serverMutedCount: number;
//   lastUpdatedMute: Date;
//   lastUpdatedStream: Date;
//   lastUpdatedVideo: Date;
// }

export interface IGathering extends Document {
  guildId: string;
  contributionId: string;
  title: string;
  description: string;
  channelId: string;
  roleIds: string[];
  startDate: Date;
  endDate: Date;
  weight: number;
  participants: IParticipant[];
}

// const ParticipantSchema = new Schema<IParticipant>({
//   discordId: { type: String, required: true },
//   secondsOpenMic: { type: Number, required: true },
//   secondsStream: { type: Number, required: true },
//   secondsVideo: { type: Number, required: true },
//   timeJoined: { type: Date, required: true },
//   deafened: { type: Boolean, required: true },
//   muted: { type: Boolean, required: true },
//   streaming: { type: Boolean, required: true },
//   selfVideo: { type: Boolean, required: true },
//   serverMutedCount: { type: Number, required: true },
//   lastUpdatedMute: { type: Date, required: true },
//   lastUpdatedStream: { type: Date, required: true },
//   lastUpdatedVideo: { type: Date, required: true },
// });

export interface IParticipant extends Document {
  discordId: string;
  secondsInChannel: number;
  timeJoined: Date;
  lastUpdatedPresence: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  discordId: { type: String, required: true },
  secondsInChannel: { type: Number, default: 0 },
  timeJoined: { type: Date, required: true },
  lastUpdatedPresence: { type: Date, required: true },
});

const GatheringSchema = new Schema<IGathering>({
  guildId: { type: String, required: true },
  contributionId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  channelId: { type: String, required: true },
  roleIds: { type: [String], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  weight: { type: Number, required: true },
  participants: { type: [ParticipantSchema], required: true },
});

export const ParticipantModel = model<IParticipant>(
  "Participant",
  ParticipantSchema
);
export const GatheringModel = model<IGathering>("Gathering", GatheringSchema);
