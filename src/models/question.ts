import { Schema, model } from "mongoose";

const QuestionsSchema = new Schema({
  taskId: { type: String },
  taskAddress: { type: String },
  questions: [
    {
      question: { type: String },
      answers: [
        {
          value: { type: String },
          correct: { type: Boolean },
        },
      ],
    },
  ],
});

export const QuestionsModel = model("Questions", QuestionsSchema);

export interface Question {
  question: string;
  answers: {
    value: string;
    correct: boolean;
  }[];
}

export interface Questions {
  taskId: string;
  taskAddress: boolean;
  questions: Question[];
}
