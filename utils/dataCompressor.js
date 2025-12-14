/**
 * dataCompressor.js
 * 
 * Core Concept:
 * --------------
 * The `dataCompressor` utility provides lossless structural compression of JSON-like data.
 * It aims to reduce redundancy and improve readability by collapsing or flattening nested structures intelligently,
 * while preserving all information.
 * 
 * Design Notes:
 * -------------
 * - Works on deeply nested objects and arrays.
 * - Extensible: new compression methods can be added easily.
 * - Configurable: users can enable/disable specific compression methods.
 * - Smart defaults ensure intuitive behavior without configuration.
 * 
 * Example:
 * --------
 * Input:
 *   [ {name: "a", data: 1, sata: 3}, {name: "b", data: 2, sata: 4} ]
 * Output:
 *   { a: {data: 1, sata: 3}, b: {data: 2, sata: 4} }
 * 
 * Input:
 *   [ {name: "a", data: [1,4,8,2]}, {name: "b", data: [2,3,7,5]} ]
 * Output:
 *   { a: [1,4,8,2], b: [2,3,7,5] }
 * 
 * Main Conceptual Decisions:
 * --------------------------
 * - Single entry point: `dataCompressor(data, options)`
 * - Modular internal methods (e.g. collapseArrayToObject)
 * - Recursive and consistent behavior across nested structures
 * - Configurable schema for future extensibility
 */

export function dataCompressor(data, options = {}) {
  const {
    methods = ['collapseArrayToObject'],
    collapseOptions = {},
    omit // Destructure omit from options
  } = options;

  let result = data;

  if (methods.includes('collapseArrayToObject')) {
    result = collapseArrayToObject(result, collapseOptions);
  }

  // Apply omit functionality if configured
  if (omit) {
    result = omitAttributes(result, omit);
  }

  // Future methods can be chained here
  // if (methods.includes('flattenNestedObjects')) result = flattenNestedObjects(result, flattenOptions);

  return result;
}

function omitAttributes(data, omitConfig) {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  const omitPatterns = Array.isArray(omitConfig) ? omitConfig : [omitConfig];

  if (Array.isArray(data)) {
    return data.map(item => omitAttributes(item, omitConfig));
  }

  let newData = { ...data };

  for (let pattern of omitPatterns) {
    if (!pattern || !(typeof pattern === 'string' || Array.isArray(pattern))) {
      continue; // Skip invalid patterns
    }

    let testFunc = () => true
    if (Array.isArray(pattern)) {
      testFunc = pattern[1]
      pattern = pattern[0]
    }

    const parts = pattern.split('.');
    const isWildcard = parts[0] === '*';

    if (isWildcard) {
      const deepKey = parts.slice(1).join('.');
      for (const key in newData) {
        if (Object.prototype.hasOwnProperty.call(newData, key)) {
          if (typeof newData[key] === 'object' && newData[key] !== null) {
            newData[key] = omitAttributes(newData[key], deepKey);
          } else if (key === deepKey) {
            if (testFunc(newData[key])) {
              delete newData[key];
            }
          }
        }
      }
    } else if (parts.length === 1) {
      // Shallow omit
      if (testFunc(newData[pattern])) {
        delete newData[pattern];
      }
    } else {
      // Nested path omit
      let current = newData;
      let i = 0;
      for (; i < parts.length - 1; i++) {
        const part = parts[i];
        if (typeof current[part] === 'object' && current[part] !== null) {
          current = current[part];
        } else {
          current = null;
          break;
        }
      }
      if (current) {
        if (testFunc(current[parts[i]])) {
          delete current[parts[i]];
        }
      }
    }
  }
  return newData;
}

function collapseArrayToObject(data, options = {}) {
  const {
    keyAttr = 'name',
    collapseSingleAttr = true,
    deep = true
  } = options;

  if (!Array.isArray(data)) {
    if (deep && typeof data === 'object' && data !== null) {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, collapseArrayToObject(v, options)])
      );
    }
    return data;
  }

  if (!data.every(item => typeof item === 'object' && item !== null && keyAttr in item)) {
    return data;
  }

  const collapsed = {};
  for (const item of data) {
    const { [keyAttr]: key, ...rest } = item;
    collapsed[key] = rest;
  }

  if (collapseSingleAttr) {
    const allSingle = Object.values(collapsed).every(
      v => typeof v === 'object' && v !== null && Object.keys(v).length === 1
    );
    if (allSingle) {
      for (const k in collapsed) {
        const onlyKey = Object.keys(collapsed[k])[0];
        collapsed[k] = collapsed[k][onlyKey];
      }
    }
  }

  if (deep) {
    for (const k in collapsed) {
      collapsed[k] = collapseArrayToObject(collapsed[k], options);
    }
  }

  return collapsed;
}

/**
 * Extensibility Ideas:
 * --------------------
 * - flattenNestedObjects: merge nested keys into dot notation
 * - deduplicateArrays: remove duplicate entries in arrays
 * - mergeSimilarKeys: unify keys with similar names (e.g. "data" and "Data")
 * - compactPrimitives: replace verbose structures with primitives where possible
 * - schema-based compression: apply transformations based on a provided schema
 */
