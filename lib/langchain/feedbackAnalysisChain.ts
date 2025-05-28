import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.5,
  maxTokens: 300,
});

const prompt = PromptTemplate.fromTemplate(
  `You are an expert HR assistant. Analyze the following feedback and provide a summary, sentiment (positive, neutral, negative), and suggest one actionable improvement if possible. Respond as a JSON object with 'summary', 'sentiment', and 'suggestion' fields.

Feedback: {feedback}`
);

export const feedbackAnalysisChain = RunnableSequence.from([
  prompt,
  model
]);
