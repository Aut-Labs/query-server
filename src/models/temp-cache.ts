import { Schema, model } from "mongoose";

const DynamicStringPropSchema = new Schema({
  key: String,
  value: String
});

const DynamicNumberPropSchema = new Schema({
  key: String,
  value: Number
});


const TempCacheSchema = new Schema({
  address: { type: String, required: true },
  attrc1: DynamicStringPropSchema,
  attrc2: DynamicStringPropSchema,
  attrc3: DynamicStringPropSchema,
  attrc4: DynamicStringPropSchema,
  attrn1: DynamicNumberPropSchema,
  attrn2: DynamicNumberPropSchema,
  list: [
    new Schema({
      attrc1: DynamicStringPropSchema,
      attrc2: DynamicStringPropSchema,
      attrc3: DynamicStringPropSchema,
      attrc4: DynamicStringPropSchema,
      attrn1: DynamicNumberPropSchema,
      attrn2: DynamicNumberPropSchema,
    }),
  ],
});

export const TempCacheModel = model("TempCache", TempCacheSchema);


interface TempCacheString {
  key: string;
  value: string
}

interface TempCacheNumber {
  key: string;
  value: string
}

export interface TempCache {
  address: string;
  attrc1: TempCacheString;
  attrc2: TempCacheString;
  attrc3: TempCacheString;
  attrc4: TempCacheString;
  attrn1: TempCacheNumber;
  attrn2: TempCacheNumber;
  list: {
    attrc1: TempCacheString;
    attrc2: TempCacheString;
    attrc3: TempCacheString;
    attrc4: TempCacheString;
    attrn1: TempCacheNumber;
    attrn2: TempCacheNumber;
  }[];
}
