import { Schema, model } from "mongoose";

const AddressSchema = new Schema({
  daoAddress: { type: String },
  address: { type: String },
  note: { type: String },
});

export const AddressModel = model("Address", AddressSchema);

export interface Address {
  daoAddress: string;
  address: string;
  note: string;
}
