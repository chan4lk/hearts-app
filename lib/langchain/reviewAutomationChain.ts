import { OpenAI } from "langchain/llms/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";

const model = new OpenAI({
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

export const reviewAutomationChain = new LLMChain({ llm: model, prompt });
