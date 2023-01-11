import { Schema, model } from 'mongoose';

const TwitterVerificationSchema = new Schema({ 
    address: { type: String }, 
    tweetID: { type: String },
    signature: {type: String },
})

export const TwitterVerificationModel = model('TwitterVerification', TwitterVerificationSchema);

export interface TwitterVerification { 
    address: string; 
    tweetID: string;
    signature: string;
}