import { Schema, model, Document } from "mongoose";

interface IMember extends Document {
  discordId: string;
  autIdAddress: string;
}

const MemberSchema = new Schema<IMember>({
  discordId: { type: String },
  autIdAddress: { type: String },
});

export const MemberModel = model<IMember>("Member", MemberSchema);