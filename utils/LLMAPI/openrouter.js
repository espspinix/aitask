import dotenv from "dotenv";
dotenv.config();

import { getConfigurableOpenAI } from "./openai.js";

export async function callOpenRouter({ role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7, model, reasoning = {effort: "none", enabled: false} }) {
  const customCall = getConfigurableOpenAI({
    apiKey: process.env.OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    model
  });

  return await customCall({ role, task, inputs, outputs, outputFormat, temperature, reasoning });
}
