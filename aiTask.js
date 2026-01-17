import dotenv from "dotenv";

import { callOllama } from "./utils/LLMAPI/ollama.js";
import { callOpenAI } from "./utils/LLMAPI/openai.js";
import { callGemini } from "./utils/LLMAPI/gemini.js";
import { callOpenRouter } from "./utils/LLMAPI/openrouter.js";

import { create } from "flat-cache";
import crypto from "crypto";

import sharp from "sharp";
import { logger } from "./utils/logger.js";

// TODO make this customizable
const cache = create({ cacheId: 'website-modular-cache' }); //, cacheDir: './mycache', ttl: 60 * 60 * 1000 });

const hashQuery = (params) => {
    return crypto.createHash("sha256").update(JSON.stringify(params)).digest("hex");
};

export function buildPrompt(task, inputs, outputs = null, isJSON = false) {
  const hasTask = (task ? true : false);
  const hasInput = inputs && (Array.isArray(inputs) ? inputs.length > 0 : Object.keys(inputs).length > 0);
  const hasOutputs = (outputs ? true : false)
  const delimiter = '```';
  let prompt = '';

  if (hasTask) {
    prompt += `TASK:
${delimiter}
${task}
${delimiter}

`
  }

  if (hasOutputs) {
    const outputPrompt = `OUTPUT WITH FOLLOWING ${isJSON ? 'JSON' : ''} FORMAT:`
    prompt += `${outputPrompt}
${delimiter}
${outputs}
${delimiter}
`
  }

  if (hasInput) {
    prompt += `INPUT:
${delimiter}
${JSON.stringify(inputs, null, 2)}
${delimiter}
    
`
  }

  prompt = prompt.trim()

  return prompt
}

export async function base64Image(image, doResize = true) {
  return await sharp(image)
    .rotate()
    .resize(doResize ? {
      width: 1344,
      height: 1344,
      fit: 'inside',
      withoutEnlargement: true
    } : null)
    .toBuffer()
    .then(buffer => buffer.toString('base64'));
}

export async function aiTask(configOrRole, task, inputs, outputs, outputFormat = "json_object", localOnly = false) {
  let role = typeof configOrRole === 'string' ? configOrRole : null
  let modelInput = {
    role, task, inputs, outputs, outputFormat
  }

  let remainingModels = null

  if (typeof configOrRole === 'object' && configOrRole !== null) {
    modelInput = Object.assign(modelInput, configOrRole)

    if(Array.isArray(modelInput.model)) {
      remainingModels = modelInput.model
      modelInput.model = modelInput.model.shift()
    }
  }

  const hash = hashQuery(modelInput);
  const cachedResponse = cache.get(hash);

  if (cachedResponse) {
    logger.log("Using cache..");
    return cachedResponse;
  }

  try {
    let responseContent = null;

    if(localOnly) {
      responseContent = await callOllama(modelInput)
    } else {
      if (modelInput.provider && typeof modelInput.provider === 'function') {
        responseContent = await modelInput.provider(modelInput);
      } else if (modelInput.model && modelInput.model.includes("/")) {
        responseContent = await callOpenRouter(modelInput);
      } else if(!modelInput.provider || modelInput.provider === 'gemini') {
        responseContent = await callGemini(modelInput)
      } else if (modelInput.provider === 'openai') {
        responseContent = await callOpenAI(modelInput)
      }

      if(responseContent === null) {
        throw "Could not generate answer"
      }
    }
    
    cache.set(hash, responseContent);
    cache.save();

    return responseContent;
  } catch (error) {
    if(remainingModels) {
      return await aiTask({...modelInput, model: remainingModels})
    }

    console.error("Error performing aiTask:", error);
    console.log(role, task);
    return null;
  }
}

export async function aiTaskJSONLocal(role, task, inputs, outputs) {
  return await aiTask(
    role, 
    task, 
    inputs, 
    outputs,
    "json_object",
    true
  );
}

export async function aiTaskJSON(configOrRole, task, inputs, outputs, localOnly = false) {
  return await aiTask(
    configOrRole, 
    task, 
    inputs, 
    "Output should be a JSON object with the requested structure.\n" + JSON.stringify(outputs, null, 2), 
    "json_object",
    localOnly
  );
}

export async function aiTaskText(role, task, inputs, outputs) {
  return await aiTask(
    role, 
    task, 
    inputs, 
    outputs, 
    "text"
  );
}
