# How to Use `createJSONSchema`

The `createJSONSchema(input)` function automatically generates a JSON Schema from a structured JavaScript object. This input object encodes type, optionality, and description information in a compact, human-readable format, optimized for LLM comprehension and code generation.

## Core Concept

Each property in the input object is a key-value pair where:
- The **key** is the field name.
- The **value** is a string or nested structure describing the type, optionality, and description.

**Format:**
```
"Type [optional] | Description or Enum JSON"
```

## Supported Types

| Type Keyword | JSON Schema Type | Notes |
|---------------|------------------|-------|
| `String` | `"string"` | Basic text field |
| `Number` | `"number"` | Numeric field |
| `Boolean` | `"boolean"` | True/false |
| `Naming` | `"string"` | Adds `maxLength: 80` |
| `Paragraph` | `"string"` | Long text |
| `Enum` | `"string"` | Must be followed by a valid JSON array of allowed values |

## Optional Fields

Add `"optional"` after the type keyword to make the field non-required:
```js
{
  myOptionalString: "String optional | An optional string field"
}
```

## Nested Objects

Objects can contain other objects:
```js
{
  user: {
    firstName: "String | User first name",
    lastName: "String optional | User last name"
  }
}
```

## Arrays

Arrays are represented as:
```js
{
  tags: ["String | Tag description"]
}
```
To make the array optional:
```js
{
  tags: ["String | Tag description", "optional"]
}
```

## Enums

Enums must use valid JSON arrays:
```js
{
  color: 'Enum | ["red", "green", "blue"]'
}
```
If the array is malformed (not valid JSON), an error is thrown.

## Error Handling

- Invalid enum JSON → throws error.
- Unexpected type keyword → throws error.
- Optionality and nested structures are validated recursively.

## Example

```javascript
import { createJSONSchema } from './utils/createJSONSchema.js';

const input = {
  product: {
    id: "Number | Product ID",
    name: "String | Product name",
    description: "Paragraph optional | Detailed product description",
    tags: ["String | Product tag", "optional"],
    variants: [
      {
        sku: "String | SKU",
        color: 'Enum | ["red", "green", "blue"]',
        size: 'Enum optional | ["S", "M", "L"]',
        price: "Number | Price of the variant"
      }
    ],
    isActive: "Boolean | Is product active?"
  },
  category: "Naming | Product category name"
};

const schema = createJSONSchema(input);
```