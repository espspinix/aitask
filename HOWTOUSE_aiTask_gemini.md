# How to Use `aiTask` with Gemini

The `aiTask` function (`aiTask.js`) provides a unified interface for interacting with various Large Language Models (LLMs), including Gemini. It handles prompt construction, model selection, caching, and error retries, simplifying LLM integration.

## `aiTaskJSON` Function Signature

```javascript
async function aiTaskJSON(configObject)
```

### Parameters:

The `aiTaskJSON` function is called with a single configuration object:

```javascript
{
  role: "String | LLM's role (e.g., 'You are a helpful assistant.')",
  task: "String | The main instruction or goal for the LLM.",
  inputs: "Object | Data relevant to the task. Can be empty {} if no specific inputs are needed.",
  outputs: "Object | An object representing the desired JSON output structure.",
  localOnly: "Boolean | (Optional, default: false) Forces local models (e.g., Ollama).",
  model: "String | (Optional) Specific model name (e.g., 'gemini-2.0-flash') or Array of models to try. If empty uses least expensive model",
  temperature: "Number | (Optional) Controls randomness (0.0-1.0, default 0.7).",
  bestModel: "Boolean | (Optional) If true, aiTask attempts to find the best available model.",
  includeMetadata: "Boolean | (Optional) If true, includes usage metadata in the response object."
}
```

## Gemini Specifics (via `aiTaskJSON`)

*   **Automatic Model Selection & Rate Limiting**: `aiTask` automatically tries different Gemini models and handles rate limits, retrying with the next available model if one is hit.
*   **JSON Schema Enforcement**: When `outputFormat` is `"json_object"` and `outputs` is a structured object, `aiTask` leverages Gemini's `responseSchema` feature to enforce the output structure, reducing hallucination and ensuring valid JSON.

## Example: Categorization and Data Normalization

This example demonstrates how to use `aiTaskJSON` to categorize product listings and generate normalization rules, leveraging `createJSONSchema` for structured output.

```javascript
import { createJSONSchema } from 'aitask/utils/createJSONSchema.js';
import { aiTaskJSON } from 'aitask';

// 1. Define the desired output structure using createJSONSchema
const outputs = createJSONSchema({
  name: 'String | Suggested recipe name',
  description: 'String | Brief summary of the recipe',
  prepTime: 'Number | Estimated preparation time in minutes',
  isVegan: 'Boolean | Whether the dish is vegan',
  ingredients: [
    {
      name: 'String | Name of the ingredient',
      type: 'Enum | ["dry", "liquid", "spice", "other"]',
      quantity: 'Number | The amount of the ingredient',
      unit: 'String optional | unit of the quantity (e.g., "cups", "grams", "tsp")',
      notes: 'String optional | notes about the ingredient (e.g., "sifted", "divided")',
    }
  ],
  instructions: [
    'String | Description of the step in the cooking process'
  ],
});

// 2. Define the LLM prompt, inputs, and call aiTaskJSON
const llmResponse = await aiTaskJSON({
  role: 'You are an expert cook with experience in recipe writing',
  task: `
      Based on the user request and the provided ingredients, please create a recipe.
      [...]
      `,
  inputs: {
    availableIngredients,
    userRequest
  },
  outputs, // The structured output schema
});

// llmResponse will contain the categorized and normalized product data in the structure defined by llmOutputs.
