import { createJSONSchema } from './createJSONSchema.js';
import { z } from 'zod';

function runSimpleTest(name, input, expectedSchema) {
  console.log(`\n--- Test Case: ${name} ---`);
  
  try {
    const generatedSchema = createJSONSchema(input);

    const passed = JSON.stringify(generatedSchema) === JSON.stringify(expectedSchema);
    if (expectedSchema === 'EXPECT_ERROR') {
      console.error('❌ Test Failed: Expected error but got schema');
      // console.error('Generated Schema:', JSON.stringify(generatedSchema, null, 2));
    } else if (passed) {
      console.log('✅ Test Passed');
    } else {
      console.error('❌ Test Failed');
      console.log('Input:', JSON.stringify(input, null, 2));
      console.log('Generated JSON Schema:', JSON.stringify(generatedSchema, null, 2));
      console.error('Expected Schema:', JSON.stringify(expectedSchema, null, 2));
    }
  } catch (e) {
    if (expectedSchema === 'EXPECT_ERROR') {
      console.log('✅ Test Passed (Error was expected)');
    } else {
      console.error('❌ Test Failed: Unexpected error occurred');
      console.error('Error:', e.message);
      console.log('Input:', JSON.stringify(input, null, 2));
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myString: {
        description: 'A simple string field',
        type: 'string',
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myNumber: {
        description: 'A numeric field',
        type: 'number',
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myBoolean: {
        description: 'A boolean field',
        type: 'boolean',
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myName: {
        description: 'A name field with max 80 chars',
        type: 'string',
        maxLength: 80,
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myParagraph: {
        description: 'A long text paragraph',
        type: 'string',
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myOptionalString: {
        description: 'An optional string field',
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
    },
  }
);

// Test 8: Optional Enum (no description)
runSimpleTest(
  'Optional Enum Type',
  { myOptionalEnum: 'Enum optional | ["apple", "banana"]' },
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      myOptionalEnum: {
        "anyOf": [
          {
            "type": "string",
            "enum": [
              "apple",
              "banana"
            ]
          },
          {
            "type": "null"
          }
        ]
      },
    },
  }
);

// Test 9: Mixed-Type Enum (numbers and strings, no description)
  // isnt supported by gemini
// runSimpleTest(
//   'Mixed-Type Enum (numbers and strings)',
//   { myMixedEnum: 'Enum | [1, 2, "three"]' },
//   {
//     "$schema": "https://json-schema.org/draft/2020-12/schema",
//     type: 'object',
//     properties: {
//       myMixedEnum: {
//         type: 'string',
//         enum: [1, 2, "three"],
//       },
//     },
//     required: ['myMixedEnum'],
//   }
// );

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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          firstName: {
            description: 'User first name',
            type: 'string',
          },
          lastName: {
            description: 'User last name',
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      optionalItems: {
        "anyOf": [
          {
            "type": "array",
            "items": {
              "description": "item description",
              "type": "string"
            }
          },
          {
            "type": "null"
          }
        ]
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              description: 'User ID',
              type: 'number',
            },
            name: {
              description: 'User name',
              type: 'string',
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "product": {
        "type": "object",
        "properties": {
          "id": {
            "description": "Unique product identifier",
            "type": "number"
          },
          "name": {
            "description": "Product name",
            "type": "string"
          },
          "description": {
            "description": "Detailed product description",
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ]
          },
          "tags": {
            "anyOf": [
              {
                "type": "array",
                "items": {
                  "description": "Product tag",
                  "type": "string"
                }
              },
              {
                "type": "null"
              }
            ]
          },
          "variants": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "sku": {
                  "description": "Stock Keeping Unit",
                  "type": "string"
                },
                "color": {
                  "type": "string",
                  "enum": ["red", "green", "blue"]
                },
                "size": {
                  "anyOf": [
                    {
                      "type": "string",
                      "enum": [
                        "S",
                        "M",
                        "L",
                        "XL"
                      ]
                    },
                    {
                      "type": "null"
                    }
                  ]
                },
                "price": {
                  "description": "Price of the variant",
                  "type": "number"
                }
              },
              "required": ["sku", "color", "price"]
            }
          },
          "isActive": {
            "description": "Is product active?",
            "type": "boolean"
          }
        },
        "required": ["id", "name", "variants", "isActive"]
      },
      "category": {
        "description": "Product category name",
        "type": "string",
        "maxLength": 80
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "attributes": {
        "type": "object",
        "propertyNames": {
          "description": "Name of the attribute",
          "type": "string"
        },
        "additionalProperties": {
          "type": "object",
          "properties": {
            "unit": {
              "description": "reference to _units.<key>",
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "null"
                }
              ]
            },
            "synonyms": {
              "type": "object",
              "propertyNames": {
                "description": "canonical form",
                "type": "string"
              },
              "additionalProperties": {
                "type": "array",
                "items": {
                  "description": "variant",
                  "type": "string"
                }
              }
            },
            "patterns": {
              "anyOf": [
                {
                  "type": "array",
                  "items": {
                    "description": "pattern to extract quantitative data",
                    "type": "string"
                  }
                },
                {
                  "type": "null"
                }
              ]
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
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      mixedArray: {
        type: "array",
        items: {
          anyOf: [
            {
              type: "object",
              properties: {
                a: { description: "a", type: "string" }
              },
              required: ["a"]
            },
            {
              type: "object",
              properties: {
                b: { description: "b", type: "number" }
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
  // not supported yet
// runSimpleTest(
//   'Array anyOf with Base Object',
//   {
//     items: [
//       [{ name: "String | name", data: "Number | data" }, { name: "String | name", data: "Number | data" }, { name: "String | name", asdf: "Number | asdf" }],
//       'anyOf'
//     ]
//   },
//   {
//     type: 'object',
//     properties: {
//       items: {
//         type: 'array',
//         items: {
//           $defs: {
//             BaseObject: {
//               type: 'object',
//               properties: { name: { const: 1 } },
//               required: ['name']
//             }
//           },
//           anyOf: [
//             {
//               allOf: [
//                 { $ref: '#/$defs/BaseObject' },
//                 { type: 'object', properties: { data: { const: 2 } }, required: ['data'] }
//               ]
//             },
//             {
//               allOf: [
//                 { $ref: '#/$defs/BaseObject' },
//                 { type: 'object', properties: { data: { const: 3 } }, required: ['data'] }
//               ]
//             },
//             {
//               allOf: [
//                 { $ref: '#/$defs/BaseObject' },
//                 { type: 'object', properties: { asdf: { const: 2 } }, required: ['asdf'] }
//               ]
//             }
//           ]
//         }
//       }
//     },
//     required: ['items']
//   }
// );
