import dotenv from "dotenv";
dotenv.config()

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPrompt } from "../../aiTask.js";
import { logger } from "../../utils/logger.js";

import util from 'util';

const DEBUG_GEMINI = true;
const DEBUG_GEMINI_LEVEL = "stats";
const google = new GoogleGenerativeAI(process.env.GEMINI_KEY);

const geminiModels = [
  {
    "model": "gemini-3-flash",
  },
  {
    "model": "gemini-2.5-flash",
  },
  {
    "model": "gemini-2.5-flash-lite", 
  },
]

function rateLimitRetryDelay(error) {
  let retryDelaySeconds = null;
  if (error.errorDetails) {
    const retryInfo = error.errorDetails.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
    if (retryInfo && retryInfo.retryDelay) {
      retryDelaySeconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
    }
  }

  const defaultDelaySeconds = 30; // Default retry delay if parsing fails or no RetryInfo
  const delaySeconds = retryDelaySeconds !== null ? retryDelaySeconds : defaultDelaySeconds;
  const delayMs = (delaySeconds * 1000) + 250;
  logger.log(`Rate limit hit, retrying in ${delaySeconds} seconds.`); // Log the delay
  return delayMs;
}

function isRateLimitError(error) {
  // Implement your rate limit error detection logic here.
  // This might involve checking the error message or error code.
  // Example:
  // return error.message.includes("rate limit");
  return error.status === 429
  // return error.message.includes("Too Many Requests") && error.message.includes("429");
}

let lastRateLimitedGeminiModelIndex = 0;

export async function callGemini({ role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7, model = null, bestModel = false, includeMetadata = false }) {
  if (model !== null || bestModel) {
    try {
      return await callGeminiModel({ role, task, inputs, outputs, outputFormat, temperature, model, includeMetadata})
    } catch(error) {
      if (isRateLimitError(error)) {
        //wait
        await new Promise(resolve => setTimeout(resolve, rateLimitRetryDelay(error) + 1000));
        //rerun
        return callGemini({ role, task, inputs, outputs, outputFormat, temperature, model, bestModel, includeMetadata})
      }
    }
    
  }

  let modelIndex = lastRateLimitedGeminiModelIndex;

  while(modelIndex < geminiModels.length) {
    const modelConfig = geminiModels[modelIndex];

    try {
      model = modelConfig.model
      return await callGeminiModel({ role, task, inputs, outputs, outputFormat, temperature, model, includeMetadata})
    } catch(error) {
      if (isRateLimitError(error)) {
        logger.warn(`Rate limit hit for model ${modelConfig.model}. Trying next model.`);
        modelIndex++;
      } else {
        throw error; // Re-throw non-rate-limit errors
      }
    }
  }  
}

function logGeminiDebug({level, role, task, inputs, outputs, responseContent, usageMetadata}) {
  if (!DEBUG_GEMINI) {
    return;
  }

  logger.setLevel(logger.levels.DEBUG);

  if (level === "stats") {
    let tokenInfo = "";
    if (usageMetadata) {
      tokenInfo = `tokens in: ${usageMetadata.promptTokenCount}, out: ${usageMetadata.candidatesTokenCount}, `;
    }
    logger.info(`[Gemini] Calling Gemini... ${tokenInfo}response received.`);
    return;
  }

  if (level === "basic") {
    let tokenInfo = "";
    if (usageMetadata) {
      tokenInfo = `tokens in: ${usageMetadata.promptTokenCount}, out: ${usageMetadata.candidatesTokenCount}, `;
    }
    logger.info(`[Gemini] Calling Gemini... ${tokenInfo}response received.`);

    logger.debug(`[Gemini] Input: task: ${task}, inputs: ${util.inspect(inputs, { depth: 2 })}`);
    logger.debug(`[Gemini] Output: ${util.inspect(responseContent, { depth: 2 })}`);
    return;
  }

  if (level === "detailed") {
    let tokenInfo = "";
    if (usageMetadata) {
      tokenInfo = `tokens in: ${usageMetadata.promptTokenCount}, out: ${usageMetadata.candidatesTokenCount}, `;
    }
    logger.info(`[Gemini] Calling Gemini... ${tokenInfo}response received.`);

    logger.debug(`[Gemini] Role: ${role}`);
    logger.debug(`[Gemini] Task: ${task}`);
    logger.debug(`[Gemini] Inputs: ${util.inspect(inputs, { depth: 3 })}`);
    logger.debug(`[Gemini] Outputs: ${util.inspect(outputs, { depth: 3 })}`);
    logger.debug(`[Gemini] Output: ${util.inspect(responseContent, { depth: 3 })}`);
    return
  }

   if (level === "very_detailed") {
    let tokenInfo = "";
    if (usageMetadata) {
      tokenInfo = `tokens in: ${usageMetadata.promptTokenCount}, out: ${usageMetadata.candidatesTokenCount}, `;
    }
    logger.info(`[Gemini] Calling Gemini... ${tokenInfo}response received.`);

    logger.debug(`[Gemini] Role: ${role}`);
    logger.debug(`[Gemini] Task: ${task}`);
    logger.debug(`[Gemini] Inputs: ${util.inspect(inputs, { depth: null })}`); // No depth limit for very_detailed
    logger.debug(`[Gemini] Outputs: ${util.inspect(outputs, { depth: null })}`); // No depth limit for very_detailed
    logger.debug(`[Gemini] Output: ${util.inspect(responseContent, { depth: null })}`);
    return
  }
}

// --- Call Gemini ---
export async function callGeminiModel({ role, task, inputs, outputs, outputFormat = "json_object", temperature = 0.7, model = "gemini-2.0-flash", JSONErrorRetry = false, OverloadErrorRetry = false, includeMetadata = false }) {
  try {
    if (model === null) {
      model = "gemini-2.5-flash"
    }
    //outputs is json schema?
    let isSchemaType = false
    if (outputs.type && (outputs.type === "array" || outputs.type === "object")) {
      isSchemaType = true
    }

    let supportsSystemInstruction = true
    if (model.startsWith('gemma')) {
      supportsSystemInstruction = false
      task = 'ROLE:' + role + '\n\n' + task
    }

    const gModel = google.getGenerativeModel({ 
      model,
      ...(supportsSystemInstruction ? {systemInstruction: role} : {}),
    });

    const result = await gModel.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(task, inputs, outputs, outputFormat === "json_object") }] }],
      generationConfig: {
        temperature,
        responseMimeType: outputFormat === "json_object" ? "application/json" : "text/plain",
        responseSchema: isSchemaType ? outputs : null,
      }
    });

    const responseContent = result.response.text();

    // Log Gemini debug information
     logGeminiDebug({
      level: DEBUG_GEMINI_LEVEL,
      role,
      task,
      inputs,
      outputs,
      responseContent,
      usageMetadata: result.response.usageMetadata,
    });

    let output = outputFormat === "json_object" ? JSON.parse(responseContent) : responseContent;

    if(includeMetadata) {
      if(outputFormat === "json_object") {
        output.usageMetadata = result.response.usageMetadata
      }
    }

    try {
      return output
    } catch(JSONError) {
      console.log('##############################')
      console.log(responseContent)
      console.log('##############################')

      console.log('########## ERROR #############')
      console.log(JSON.stringify(JSONError))
      console.log('##############################')
      console.error("Gemini Error:", JSONError);
      console.log('##############################')

      // retry max 3 times
      if (JSONErrorRetry) {
        JSONErrorRetry++
        if (JSONErrorRetry > 3) {
          throw JSONError
        }
      } else {
        JSONErrorRetry = 1
      }
      return callGeminiModel({ role, task, inputs, outputs, outputFormat, temperature, model, JSONErrorRetry, OverloadErrorRetry, includeMetadata })
    }
  } catch (error) {
    if (error.status === 429) {
      throw error
    }

    console.log('########## ERROR #############')
    console.log(JSON.stringify(error))
    console.log('##############################')

    if (error.status === 499 || error.status === 503) {
      //known error
      //{"status":499,"statusText":"Client Closed Request"}
      //{"status":503,"statusText":"Service Unavailable"}
      // retry until get answer

      // retry max 3 times
      if (OverloadErrorRetry) {
        OverloadErrorRetry++
        // if (OverloadErrorRetry > 3) {
        //   throw error
        // }
      } else {
        OverloadErrorRetry = 1
      }

      // wait 10 seconds
      console.log(`Waiting ${OverloadErrorRetry*10} seconds`)
      await new Promise(resolve => setTimeout(resolve, OverloadErrorRetry * 10000));

      console.log('Retrying..')

      return callGeminiModel({ role, task, inputs, outputs, outputFormat, temperature, model, JSONErrorRetry, OverloadErrorRetry, includeMetadata })
    } else {
      //unknown error
      // retry 3 times, then fail
      // TODO
    }

    console.log('##############################')
    console.error("Gemini Error:", error);
    console.log('##############################')
    return null;
  }
}
