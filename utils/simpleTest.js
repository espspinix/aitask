import { createJSONSchema } from './createJSONSchema.js';
import { z } from 'zod';

function runSimpleTest(name, input, expectedSchema) {
  console.log(`\n--- Test Case: ${name} ---`);
  console.log('Input:', JSON.stringify(input, null, 2));
  try {
    const generatedSchema = createJSONSchema(input);
    console.log('Generated JSON Schema:', JSON.stringify(generatedSchema, null, 2));

    const passed = JSON.stringify(generatedSchema) === JSON.stringify(expectedSchema);
    if (expectedSchema === 'EXPECT_ERROR') {
      console.error('❌ Test Failed: Expected error but got schema');
      console.error('Generated Schema:', JSON.stringify(generatedSchema, null, 2));
    } else if (passed) {
      console.log('✅ Test Passed');
    } else {
      console.error('❌ Test Failed');
      console.error('Expected Schema:', JSON.stringify(expectedSchema, null, 2));
    }
  } catch (e) {
    if (expectedSchema === 'EXPECT_ERROR') {
      console.log('✅ Test Passed (Error was expected)');
    } else {
      console.error('❌ Test Failed: Unexpected error occurred');
      console.error('Error:', e.message);
      console.error('Expected Schema:', JSON.stringify(expectedSchema, null, 2));
    }
  }
  console.log('----------------------------------');
}

// Test 1: Basic String
runSimpleTest(
  'Basic String',
  { myString: 'String | A simple string field' },
  {
    type: 'object',
    properties: {
      myString: {
        type: 'string',
        description: 'A simple string field',
      },
    },
    required: ['myString'],
  }
);

// Test 2: Number
runSimpleTest(
  'Number Type',
  { myNumber: 'Number | A numeric field' },
  {
    type: 'object',
    properties: {
      myNumber: {
        type: 'number',
        description: 'A numeric field',
      },
    },
    required: ['myNumber'],
  }
);

// Test 3: Boolean
runSimpleTest(
  'Boolean Type',
  { myBoolean: 'Boolean | A boolean field' },
  {
    type: 'object',
    properties: {
      myBoolean: {
        type: 'boolean',
        description: 'A boolean field',
      },
    },
    required: ['myBoolean'],
  }
);

// Test 4: Naming
runSimpleTest(
  'Naming Type',
  { myName: 'Naming | A name field with max 80 chars' },
  {
    type: 'object',
    properties: {
      myName: {
        type: 'string',
        maxLength: 80,
        description: 'A name field with max 80 chars',
      },
    },
    required: ['myName'],
  }
);

// Test 5: Paragraph
runSimpleTest(
  'Paragraph Type',
  { myParagraph: 'Paragraph | A long text paragraph' },
  {
    type: 'object',
    properties: {
      myParagraph: {
        type: 'string',
        description: 'A long text paragraph',
      },
    },
    required: ['myParagraph'],
  }
);

// Test 6: Valid Enum (no description)
runSimpleTest(
  'Valid Enum Type',
  { myEnum: 'Enum | ["red", "green", "blue"]' },
  {
    type: 'object',
    properties: {
      myEnum: {
        type: 'string',
        enum: ['red', 'green', 'blue'],
      },
    },
    required: ['myEnum'],
  }
);

// Test 7: Optional String
runSimpleTest(
  'Optional String Type',
  { myOptionalString: 'String optional | An optional string field' },
  {
    type: 'object',
    properties: {
      myOptionalString: {
        type: 'string',
        description: 'An optional string field',
      },
    },
  }
);

// Test 8: Optional Enum (no description)
runSimpleTest(
  'Optional Enum Type',
  { myOptionalEnum: 'Enum optional | ["apple", "banana"]' },
  {
    type: 'object',
    properties: {
      myOptionalEnum: {
        type: 'string',
        enum: ['apple', 'banana'],
      },
    },
  }
);

// Test 9: Mixed-Type Enum (numbers and strings, no description)
runSimpleTest(
  'Mixed-Type Enum (numbers and strings)',
  { myMixedEnum: 'Enum | [1, 2, "three"]' },
  {
    type: 'object',
    properties: {
      myMixedEnum: {
        type: 'string',
        enum: [1, 2, "three"],
      },
    },
    required: ['myMixedEnum'],
  }
);

// Test 10: Malformed Enum (not JSON) - Expects error
// This test case will be handled separately in runSimpleTest
// to catch the expected error.
runSimpleTest(
  'Malformed Enum (not JSON)',
  { myMalformedEnum: 'Enum | not-a-json-array' },
  'EXPECT_ERROR' // Special indicator for error expectation
);

// Test 11: Nested Object
runSimpleTest(
  'Nested Object',
  {
    user: {
      firstName: 'String | User first name',
      lastName: 'String optional | User last name',
    },
  },
  {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            description: 'User first name',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
          },
        },
        required: ['firstName'],
      },
    },
    required: ['user'],
  }
);


// Test 13: Optional Array of Strings (item description, optional array)
runSimpleTest(
  'Optional Array of Strings',
  {
    optionalItems: ['String | item description', 'optional'],
  },
  {
    type: 'object',
    properties: {
      optionalItems: {
        type: 'array',
        items: {
          type: 'string',
          description: 'item description',
        },
      },
    },
  }
);

// Test 14: Array of Objects
runSimpleTest(
  'Array of Objects',
  {
    users: [
      {
        id: 'Number | User ID',
        name: 'String | User name',
      },
    ],
  },
  {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
          },
          required: ['id', 'name'],
        },
      },
    },
    required: ['users'],
  }
);


// Test 15: Complicated Nested Structure
runSimpleTest(
  'Complicated Nested Structure',
  {
    "product": {
      "id": "Number | Unique product identifier",
      "name": "String | Product name",
      "description": "Paragraph optional | Detailed product description",
      "tags": ["String | Product tag", "optional"],
      "variants": [
        {
          "sku": "String | Stock Keeping Unit",
          "color": "Enum | [\"red\", \"green\", \"blue\"]",
          "size": "Enum optional | [\"S\", \"M\", \"L\", \"XL\"]",
          "price": "Number | Price of the variant"
        }
      ],
      "isActive": "Boolean | Is product active?"
    },
    "category": "Naming | Product category name"
  },
  {
    "type": "object",
    "properties": {
      "product": {
        "type": "object",
        "properties": {
          "id": {
            "type": "number",
            "description": "Unique product identifier"
          },
          "name": {
            "type": "string",
            "description": "Product name"
          },
          "description": {
            "type": "string",
            "description": "Detailed product description"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string",
              "description": "Product tag"
            }
          },
          "variants": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "sku": {
                  "type": "string",
                  "description": "Stock Keeping Unit"
                },
                "color": {
                  "type": "string",
                  "enum": ["red", "green", "blue"]
                },
                "size": {
                  "type": "string",
                  "enum": ["S", "M", "L", "XL"]
                },
                "price": {
                  "type": "number",
                  "description": "Price of the variant"
                }
              },
              "required": ["sku", "color", "price"]
            }
          },
          "isActive": {
            "type": "boolean",
            "description": "Is product active?"
          }
        },
        "required": ["id", "name", "variants", "isActive"]
      },
      "category": {
        "type": "string",
        "maxLength": 80,
        "description": "Product category name"
      }
    },
    "required": ["product", "category"]
  }
);

// Test 16: Record Attributes Structure
runSimpleTest(
  'Record Attributes Structure',
  {
    attributes: {
      'String | Name of the attribute': {
        unit: 'String optional | reference to _units.<key>',
        synonyms: {
          'String | canonical form': ['String | variant'],
          '__is_record': true
        },
        patterns: [
          'String | pattern to extract quantitative data',
          'optional'
        ]
      },
      '__is_record': true
    }
  },
  {
    "type": "object",
    "properties": {
      "attributes": {
        "type": "object",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "unit": {
              "type": "string",
              "description": "reference to _units.<key>"
            },
            "synonyms": {
              "type": "object",
              "additionalProperties": {
                "type": "array",
                "items": {
                  "type": "string",
                  "description": "variant"
                }
              }
            },
            "patterns": {
              "type": "array",
              "items": {
                "type": "string",
                "description": "pattern to extract quantitative data"
              }
            }
          },
          "required": [
            "synonyms"
          ]
        }
      }
    },
    "required": [
      "attributes"
    ]
  }
);

// Test 17: Array anyOf Type
runSimpleTest(
  'Array anyOf Type',
  {
    mixedArray: [
      [
        { a: "String | a" },
        { b: "Number | b" }
      ],
      "anyOf"
    ]
  },
  {
    type: "object",
    properties: {
      mixedArray: {
        type: "array",
        items: {
          anyOf: [
            {
              type: "object",
              properties: {
                a: { type: "string", description: "a" }
              },
              required: ["a"]
            },
            {
              type: "object",
              properties: {
                b: { type: "number", description: "b" }
              },
              required: ["b"]
            }
          ]
        }
      }
    },
    required: ["mixedArray"]
  }
);

// Test 18: Array anyOf with Base Object
runSimpleTest(
  'Array anyOf with Base Object',
  {
    items: [
      [{ name: 1, data: 2 }, { name: 1, data: 3 }, { name: 1, asdf: 2 }],
      'anyOf'
    ]
  },
  {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          $defs: {
            BaseObject: {
              type: 'object',
              properties: { name: { const: 1 } },
              required: ['name']
            }
          },
          anyOf: [
            {
              allOf: [
                { $ref: '#/$defs/BaseObject' },
                { type: 'object', properties: { data: { const: 2 } }, required: ['data'] }
              ]
            },
            {
              allOf: [
                { $ref: '#/$defs/BaseObject' },
                { type: 'object', properties: { data: { const: 3 } }, required: ['data'] }
              ]
            },
            {
              allOf: [
                { $ref: '#/$defs/BaseObject' },
                { type: 'object', properties: { asdf: { const: 2 } }, required: ['asdf'] }
              ]
            }
          ]
        }
      }
    },
    required: ['items']
  }
);
