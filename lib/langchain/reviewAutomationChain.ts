import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.5,
  maxTokens: 500,
});

const prompt = PromptTemplate.fromTemplate(
  `You are a performance review assistant. Given the following ratings and feedback, generate a concise performance review summary for the employee. Respond as a JSON object with 'summary' and 'areasForImprovement' fields.

Ratings: {ratings}
Feedback: {feedback}`
);

export const reviewAutomationChain = RunnableSequence.from([
  prompt,
  model,
]);
