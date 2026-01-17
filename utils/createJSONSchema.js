import { z } from 'zod';

/**
 * Checks if the input is already a Zod schema.
 * A simple heuristic check - might need refinement for complex cases.
 * @param {*} input - The input to check.
 * @returns {boolean} - True if likely a Zod schema, false otherwise.
 */
function isZodSchema(input) {
  return typeof input === 'object' && input !== null && typeof input.safeParse === 'function';
}

/**
 * Finds common key-value pairs across all objects in the array.
 * @param {Array} objects - Array of objects to analyze.
 * @returns {object} - Object with common properties.
 */
function findCommonProperties(objects) {
  if (!Array.isArray(objects) || objects.length === 0) return {};
  const common = {};
  const first = objects[0];
  for (const key in first) {
    if (first.hasOwnProperty(key)) {
      const value = first[key];
      const allSame = objects.every(obj => obj.hasOwnProperty(key) && JSON.stringify(obj[key]) === JSON.stringify(value));
      if (allSame) {
        common[key] = value;
      }
    }
  }
  return common;
}

/**
 * Converts a descriptive string into a Zod schema with description.
 * @param {string} descriptionString - String that may contain type info and description separated by '|'.
 * @returns {z.ZodString} - Zod string schema with description.
 */
function parseStringDescription(descriptionString) {
  let type = 'string'; // Default type if not specified explicitly
  let description = descriptionString;
  let zType = z.string();

  if (descriptionString.includes('|')) {
    const parts = descriptionString.split('|').map(part => part.trim());
    let isOptional = false;

    type = parts[0]?.toLowerCase() || 'string'; // Type is before '|', default to string
    description = parts[1] || parts[0]; // Description is after '|', or whole string if no '|'
    
    if (type.includes(' optional')) {
      isOptional = true;
      type = type.replace(' optional', '').trim();
    }

    switch (type.toLowerCase()) {
      case 'number':
        zType = z.number();
        break;
      case 'boolean':
        zType = z.boolean();
        break;
      case 'naming':
        zType = z.string().max(80);
        break;
      case 'paragraph':
        zType = z.string()//.min(750)
        break
      case 'enum':
        try {
          const enumValues = JSON.parse(description);
          description = null

          if (!Array.isArray(enumValues)) {
            throw new Error("Enum values must be a JSON array.");
          }

          zType = z.nativeEnum(enumValues);
        } catch (e) {
          throw new Error(`Malformed Enum: ${e.message}`);
        }
        break;
      case 'string':
      default:
        zType = z.string();
        break;
    }

    if (isOptional) {
      zType = zType.optional().nullable();
    }
  }

  if (description) {
    return zType.describe(description);
  }
  return zType
}

/**
 * Handles conversion for objects marked as records (`__is_record: true`).
 * @param {object} input - The record object to convert.
 * @returns {z.ZodRecord<z.ZodString, any>} - Zod record schema.
 */
function handleRecordConversion(input) {
  const recordKeys = Object.keys(input).filter(key => key !== '__is_record');
  if (recordKeys.length === 0) {
    // If __is_record is true but no sample key, assume a record of strings to any
    return z.record(z.string(), z.any());
  }
  // Take the first key as a sample to derive the value schema
  const sampleKey = recordKeys[0];
  const sampleValue = input[sampleKey];
  let a = z.record(convertToZod(sampleKey), convertToZod(sampleValue));
  return a
}

/**
 * Converts a JavaScript object or array into a Zod schema object.
 * @param {object|array} input - The input object or array to convert.
 * @returns {z.ZodObject<any>|z.ZodArray<any>|z.ZodString} - Zod schema object or array.
 */
function convertToZod(input) {
  if (typeof input === 'object' && !Array.isArray(input) && input !== null) {
    if (input.__is_record) {
      return handleRecordConversion(input);
    }

    const zodObject = {};
    for (const key in input) {
      if (Object.hasOwnProperty.call(input, key)) {
        const value = input[key];
        if (typeof value === 'string') {
          zodObject[key] = parseStringDescription(value);
        } else if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            zodObject[key] = z.array(convertToZod(value[0]));
            // Check for optional array type, e.g., ['type', 'optional']
            if (value[1] && value[1] === 'optional') {
              zodObject[key] = zodObject[key].optional().nullable();
            } else if (Array.isArray(value[0]) && value[1] === 'anyOf') {
              const schemas = value[0].map(convertToZod);
              zodObject[key] = z.array(z.union(schemas));
            }
          } else {
            zodObject[key] = convertToZod(value);
          }
        } else {
          // Handle other types if necessary, for now default to any() if not string or object/array
          zodObject[key] = z.any().describe(`Type of ${typeof value}`);
        }
      }
    }
    return z.object(zodObject);
  } else if (Array.isArray(input)) {
    if (Array.isArray(input[0]) && input[1] === 'anyOf') {
      const schemas = input[0].map(convertToZod);
      return z.array(z.union(schemas));
    } else if (input.length > 0) {
      return z.array(convertToZod(input[0])); // Homogeneous array assumption
    } else {
      return z.array(z.any()); // Empty array case
    }
  } else if (typeof input === 'string') {
    return parseStringDescription(input);
  } else {
    // For non-object and non-array inputs, return z.any() with description
    return z.any().describe(`Type of ${typeof input}`);
  }
}


/**
 * Creates a JSON schema from the given input, converting to Zod schema if necessary.
 * @param {*} input - The input object, array, or Zod schema.
 * @returns {object} - JSON schema representation of the input.
 */
export function createJSONSchema(input) {
  const zodSchema = isZodSchema(input) ? input : convertToZod(input);

  const schema = z.toJSONSchema(zodSchema, {
    io: "input",
  })

  delete schema.$schema // GEMINI whines about unknown props

  return schema
}
