import { Schema, model } from "mongoose";

const AddressSchema = new Schema({
  hubAddress: { type: String },
  address: { type: String },
  note: { type: String },
});

export const AddressModel = model("Address", AddressSchema);

export interface Address {
  hubAddress: string;
  address: string;
  note: string;
}
