import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  address: { type: String },
  nonce: { type: String },
});

export const UserModel = model("User", UserSchema);

export interface User {
  address: string;
  nonce: string;
}
