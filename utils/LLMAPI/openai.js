import dotenv from "dotenv";

import { OpenAI } from "openai";
import { createOllamaMessages } from "./messages.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Call OpenAI ---
async function _callOpenAI({ openai, model = "gpt-4o-mini", role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7, reasoning = null }) {
  try {
    const { messages, isSchemaType, schema } = await createOllamaMessages({
      role,
      task,
      inputs,
      outputs,
      outputFormat,
      USE_JSON_SCHEMA: true
    });

    const response_format = isSchemaType ?
      { type: "json_schema", "json_schema": {name: "Schema", schema: schema} }
      : { type: outputFormat === "json_object" ? "json_object" : "text" }

    // console.log({
    //   model,
    //   response_format,
    //   // messages,
    //   temperature,
    //   ...(reasoning ? { reasoning } : {})
    // })

    const response = await openai.chat.completions.create({
      model,
      response_format,
      messages,
      temperature,
      ...(reasoning ? { reasoning } : {})
    });

    // console.log(response.choices[0].message)

    let jsonResponse = response.choices[0].message.content

    try {
      return JSON.parse(jsonResponse);
    } catch(err) {
      //handle bad model behavior
      try {
        return JSON.parse(jsonResponse.replace(/^```json/, '').replace(/```$/, ''))
      } catch(err2) {
        console.error('JSON Parse Error', JSON.stringify(response, null, 2))
      }
    }
  } catch (error) {
    console.error("OpenAI Error:", error);
    return null;
  }
}

export async function callOpenAI({ role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7 }) {
  return _callOpenAI({ openai, role, task, inputs, outputs, outputFormat, temperature });
}

export function getConfigurableOpenAI({ apiKey, baseURL, model }) {
  const openaiConfig = {
    apiKey: apiKey,
  };

  if (baseURL) {
    openaiConfig.baseURL = baseURL;
  }

  const customOpenai = new OpenAI(openaiConfig);

  return function customCallOpenAI({ role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7, reasoning = null }) {
    return _callOpenAI({ openai: customOpenai, model, role, task, inputs, outputs, outputFormat, temperature, reasoning });
  };
}
