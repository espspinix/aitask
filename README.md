# aiTask — The Universal AI Kitchen Tool for Node.js

> "One function. Any model. Perfectly structured output — every time."

A fun, unified way to cook up AI responses from Gemini, OpenAI, Ollama, or OpenRouter. Handles structured JSON, images, caching, and automatic fallbacks — all in one kitchen gadget.

- **Structured JSON output** (strict schemas!)
- **Auto model selection** + fallbacks
- **Image support** (vision models)
- **Built-in caching** to save tokens
- Simple enough for quick scripts, powerful enough for production

## 🔪 TL;DR — aiTask in 15 Seconds
aiTask is your all-in-one AI kitchen tool for Node.js. It gives you *one function* that works with **Gemini**, **OpenAI**, **Ollama**, and **OpenRouter**, delivering **perfectly structured JSON output**, automatic fallbacks, image understanding, and built-in caching.

Here's your "hello-world recipe":

```js
import { aiTaskJSON } from "aitask";

const result = await aiTaskJSON({
  role: "You are a friendly cooking assistant.",
  task: "Give me a one-sentence recipe idea.",
  inputs: {},
  outputs: { idea: "String | A short recipe idea" }
});

console.log(result);
```

**Why use it?**
- One unified API for *all* major LLMs
- Guaranteed structured output (using real JSON Schema)
- Automatic fallback between models when rate-limited
- Drop-in image support for vision models
- Zero boilerplate — stays out of your way

## Installation

```bash
npm install aitask
```

Requires Node.js 16+ with ES modules.

### Environment Variables
Add these to your `.env` file:

```env
GEMINI_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_KEY=your_openrouter_key
```

## Core Concepts

aiTask provides one function (`aiTaskJSON`) that handles everything: provider selection, prompt building, caching, and structured output.

### Structured Output: Strict Mode vs Exploration Mode

aiTask supports two ways to get structured responses:

#### Strict Mode — JSON Schema (Recommended)

Pass a real JSON Schema object (via `createJSONSchema`). The provider enforces the structure — no guesswork, no errors.

```javascript
import { createJSONSchema } from "aitask";

const schema = createJSONSchema({
  recipies: [{
    name: "String | Name of the dish",
    prepTime: "Number | Minutes needed",
    difficulty: 'Enum | ["easy", "medium", "hard"]',
  }]
});

await aiTaskJSON({ task: "Create a list of recipes", inputs: {...}, outputs: schema });
```

#### Exploration Mode (Flexible, for Prototyping)

Pass a plain object with type descriptions. This is flexible but not enforced — great for experimentation.

Some models don't support strict JSON, then you can use this mode.


```javascript
outputs: {
  name: "String",
  description: "Paragraph",
  ingredients: [] // Open-ended array
}
```

**Rule of thumb:** Use Strict Mode for reliable apps, Exploration for quick tests or if model doesn't support it.

**Rule of thumb:** Use `createJSONSchema` for strict outputs, plain objects for exploration.

## ⭐ Quickstart

Let's cook up a structured recipe using strict JSON Schema. This shows aiTask's power: pass a list of ingredients, get a fully structured response with enforced schema.

```javascript
import { aiTaskJSON, createJSONSchema } from "aitask";

const RecipeSchema = createJSONSchema({
  name: "String | Name of the dish",
  prepTime: "Number | Minutes needed",
  difficulty: 'Enum | ["easy", "medium", "hard"]',
  ingredients: [
    {
      name: "String | Ingredient name",
      quantity: "Number | Amount",
      unit: "String | Measurement unit (e.g. grams)",
    }
  ],
  steps: ["Paragraph | Step-by-step instructions"],
});

const recipe = await aiTaskJSON({
  role: "You are a Michelin-star chef.",
  task: "Create a recipe based on these ingredients.",
  inputs: { ingredients: ["chicken", "rice", "garlic"] },
  outputs: RecipeSchema,
});

console.log(recipe);
```

**Output:** A perfectly structured JSON object with name, prep time, difficulty level, ingredients list, and steps. The schema ensures the LLM follows the rules exactly — no malformed JSON or missing fields.

## Provider Selection Rules

aiTask picks the provider automatically — or you can force one:

- `localOnly: true` → **Ollama** (local models)
- `model` contains "/" → **OpenRouter** (e.g., `openrouter/gpt-5-chat`)
- `provider: "openai"` → **OpenAI**
- else → **Gemini** (default)
- `model: ["gemini-2.5-flash", "openai/gpt-4"]` → try in order until success, chooses best model by default if none provided

## Supported Providers

| Provider   | Structured JSON | Images | Fallbacks |
|------------|-----------------|--------|-----------|
| **Gemini** | Depends on model | Yes | Model rotation + retries |
| **OpenAI** | Depends on model | Yes | No built-in |
| **Ollama** | Prompt-only | Yes | No built-in |
| **OpenRouter** | Depends on model | Depends on model | No built-in |

## How aiTask Works

```
(task + schema + inputs)
        ↓
aiTask → Provider Adapter → LLM
        ↓
     Valid JSON
        ↓
      Cache
```

aiTask builds prompts, picks the right provider, handles images, calls the LLM, parses the response, and caches it for speed.

## Real Use Cases (Recipe Themed)

### Recipe Generator

Basic structured recipe:

```javascript
const recipe = await aiTaskJSON({
  role: "You are a chef",
  task: "Create a simple recipe",
  inputs: { ingredients: ["pasta", "tomatoes"] },
  outputs: {
    name: "String",
    steps: ["String"]
  }
});
```

### Ingredient Normalizer

Clean up messy ingredient lists:

```javascript
const normalized = await aiTaskJSON({
  role: "You are a kitchen assistant",
  task: "Normalize these ingredients",
  inputs: { messyList: ["2 cups flour", "1tbsp sugar"] },
  outputs: {
    ingredients: [
      {
        name: "String | Name",
        quantity: "Number | Quantity",
        unit: "String | Unit of quantity"
      }
    ]
  }
});
```

### Vision: Recipe from Fridge Photo

Pass image paths for vision models:

```javascript
const recipe = await aiTaskJSON({
  role: "You are a chef",
  task: "Suggest a recipe from this fridge photo",
  inputs: {
    images: ["fridge.jpg"]
  },
  outputs: {
    name: "String",
    ingredients: ["String"],
    steps: ["String"]
  }
});
```

Images are auto-rotated, resized, and base64-encoded.

### Multi-Model Fallback

Try models in order until one works:

```javascript
const recipe = await aiTaskJSON({
  model: ["gemini-2.5-flash", "qwen/qwen3-235b-a22b:free", "openai/gpt-5-mini"],
  role: "You are a chef",
  task: "Make a vegan recipe",
  inputs: { ingredients: ["beans", "rice"] },
  outputs: { name: "String", steps: ["String"] }
});
```

### Using the Data Compressor

Compress large input objects before sending to LLM — saves tokens and speeds up responses.

```javascript
import { dataCompressor } from "aitask/utils/dataCompressor.js";

// Before: Bloated array of similar ingredients
const bloatedIngredients = [
  { name: "chicken", quantity: 500, unit: "grams", notes: "organic" },
  { name: "rice", quantity: 200, unit: "grams", notes: "brown" },
  { name: "garlic", quantity: 2, unit: "cloves", notes: "minced" }
];

// After: Compressed into a clean object
const compressed = dataCompressor(bloatedIngredients);
// Result: { chicken: {quantity: 500, unit: "grams", notes: "organic"}, rice: {...}, ... }

const recipe = await aiTaskJSON({
  role: "You are a chef",
  task: "Create a recipe with these ingredients",
  inputs: { ingredients: compressed }, // Smaller, faster LLM call
  outputs: { name: "String", steps: ["String"] }
});
```

When to compress: Large datasets, repetitive arrays, noisy properties.

## Advanced Topics

### Caching

aiTask caches responses automatically (SHA256 hash of inputs). Saves tokens for repeated calls.

- **Clear cache:** Import `flat-cache` and `cache.clearAll()`.
- **Location:** `./node_modules/.cache/website-modular-cache/`.

### Model Fallbacks and Rate Limits

Gemini automatically rotates models on rate limits. For other providers, use model arrays to try in order.

### Images and Vision

Pass image paths in `inputs.images`. Auto-handled for vision models.

## API Overview

- `aiTaskJSON(config)` — Structured JSON (most used)
- `aiTaskJSONLocal(role, task, inputs, outputs)` — Force Ollama
- `aiTask(config)` — Full control (text or JSON)
- `aiTaskText(role, task, inputs, outputs)` — Plain text (experimental)

Utilities: `createJSONSchema`, `dataCompressor`, `base64Image`, `buildPrompt`.

## Troubleshooting

- **JSON fails?** Switch to strict schema mode with `createJSONSchema`.
- **Gemini switches models?** Normal for rate limits — specify one model for consistency.
- **Caching not working?** Exact input match required (object order matters).
- **Images not loading?** Ensure file paths, not buffers.

## 📚 Additional Guides

For more details:

- [How to use aiTask with Gemini](HOWTOUSE_aiTask_gemini.md)
- [How to use createJSONSchema](HOWTOUSE_createJSONSchema.md)

## Contributing

Fork, branch, change, test, PR. Let's make AI cooking even better.

## License

ISC — see LICENSE for details.
