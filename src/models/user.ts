import { Schema, model, Document } from "mongoose";

const UserSchema = new Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  points: { type: Number, default: 0 },
  referredBy: { type: String, default: null },
  referralCodes: [{ type: String }],
  referredAddresses: [{ type: String }],
  hasEditedCommitment: { type: Boolean, default: false },
  hasAddedSocials: { type: Boolean, default: false },
  hasFollowedOnTwitter: { type: Boolean, default: false },
  hasAddedBio: { type: Boolean, default: false },
});

export const UserModel = model("User", UserSchema);

export interface User extends Document {
  address: string;
  nonce: string;
  points: number;
  referredBy: string | null;
  referrals: string[];
  hasEditedCommitment: boolean;
  hasAddedSocials: boolean;
  hasFollowedOnTwitter: boolean;
  hasAddedBio: boolean;
}
