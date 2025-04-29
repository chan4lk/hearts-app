import { OpenAI } from "langchain/llms/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 500,
});

const prompt = PromptTemplate.fromTemplate(
  `You are a professional goal-setting assistant. Create a SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goal based on the user's input and category. The goal should be professional, actionable, and aligned with the specified category. Format the response as a JSON object with 'title' and 'description' fields.

Category: {category}
Prompt: {prompt}`
);

export const goalChain = new LLMChain({ llm: model, prompt });