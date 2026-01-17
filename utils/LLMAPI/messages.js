import { base64Image, buildPrompt } from "../../aiTask.js";
import { createJSONSchema } from "../createJSONSchema.js";

export async function createOllamaMessages({
  role,
  task,
  inputs,
  outputs,
  outputFormat,
  USE_JSON_SCHEMA = false,
  imageMessageBuilder = openAIImageMessageBuilder
}) {
  let images = []

  if (inputs.images && inputs.images.length > 0) {
    for (let i = 0; i < inputs.images.length; i++) {
      inputs.images[i] = await base64Image(inputs.images[i])
    }

    images = inputs.images
    delete inputs.images
  }

  let isSchemaType = false
  let schema = null
  if (USE_JSON_SCHEMA && (outputs.type && (outputs.type === "array" || outputs.type === "object"))) {
    isSchemaType = true
    schema = outputs
  }

  USE_JSON_SCHEMA = USE_JSON_SCHEMA && (outputFormat === "json_object" ? true : false)
  const USE_JSON_AS_OUTPUT = outputFormat === "text" ? false : true

  const jsonOutputs = outputs !== null ? JSON.stringify(outputs, null, 2) : ''
  const jsonSchemaOutputs = outputs !== null ? createJSONSchema(outputs) : ''
  const jsonOutputsAsList = outputs !== null ?
    'JSON ' + Object.entries(outputs).map(([key, output]) => `${key}: ${JSON.stringify(output, null, 2)}`).join('\n')
    : ''
  const prompt = buildPrompt(
    task, 
    inputs, 
    USE_JSON_SCHEMA || !USE_JSON_AS_OUTPUT ? jsonOutputsAsList : jsonOutputs,
    USE_JSON_AS_OUTPUT
  )

  // outputs = !USE_JSON_SCHEMA ? jsonOutputs : jsonSchemaOutputs

  // console.log('::', prompt)
  // console.log(JSON.stringify(outputs, null, 2))

  let messages = role ? [{ role: 'system', content: role }] : []
  let returnWholeMessage = false
  if (Array.isArray(inputs.messages)) {
    returnWholeMessage = true

    for (const message of inputs.messages) {
      if (typeof message === 'string') {
        messages.push({
          role: 'user', content: message
        })
      } else {
        messages.push(message)
      }
    }

    // add images to last message
    if (messages.length > 0) {
      messages.slice(-1)[0].images = images
    }
  } else {
    messages.push(imageMessageBuilder(prompt, images))
  }
  messages = messages.filter(Boolean)

  // console.log(JSON.stringify(messages, null, 2))

  return { messages, returnWholeMessage, isSchemaType, schema };
}

export function openAIImageMessageBuilder(text, images) {
  return {
    role: 'user',
    content: [
      { type: 'text', text },
      ...images.map((base64Image) => {
        return {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          }
        }
      })
    ]
  }
}
