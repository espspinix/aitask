import dotenv from "dotenv";
dotenv.config()//{ path: '../../.env' });

import { Ollama } from 'ollama'
import fetch from "node-fetch"
import { base64Image } from "../../aiTask.js";
import { buildPrompt } from "../../aiTask.js";

import { createJSONSchema } from "../createJSONSchema.js";
import { createOllamaMessages } from "./messages.js";

const ollama = new Ollama({
  fetch: fetch
})

function ollamaImageMessageBuilder(text, images) {
  return {
    role: 'user',
    content: text,
    images
  }
}

export async function callOllama({ role, task, inputs = null, outputs = null, outputFormat = "json_object", temperature = 0.7, model = "llama3.2" }) {
  try {
    const USE_JSON_SCHEMA = false

    if(inputs && inputs.images && inputs.images.length > 0) {
      if( model === 'llama3.2' ) {
        model = 'minicpm-v'
      }
    }

    const { messages, returnWholeMessage } = await createOllamaMessages({ 
      role, 
      task, 
      inputs, 
      outputs, 
      outputFormat, 
      USE_JSON_SCHEMA,
      imageMessageBuilder: ollamaImageMessageBuilder
    });

    const response = await ollama.chat({
      model,
      messages,
      format: outputFormat === "json_object" ? (USE_JSON_SCHEMA ? outputs : "json") : null,
      options: {
        temperature,
        num_ctx: 4096 //16348, // 32768
      }
    })

    console.log('Tokens used:', response.prompt_eval_count, '->', response.eval_count)
    console.log()

    if (returnWholeMessage) {
      return response.message
    }

    return (outputFormat === "json_object") ? JSON.parse(response.message.content) : response.message.content;

  } catch (error) {
    console.error("Ollama Error:", error);
    return null;
  }
}
