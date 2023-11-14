import { Schema, model } from "mongoose";

const AddressSchema = new Schema({
  novaAddress: { type: String },
  address: { type: String },
  note: { type: String },
});

export const AddressModel = model("Address", AddressSchema);

export interface Address {
  novaAddress: string;
  address: string;
  note: string;
}
