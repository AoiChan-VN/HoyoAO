/**
 * Schema Validator (§83, §58, §81)
 *
 * Pure, side-effect-free validation engine. Validates data against a schema
 * node and returns structured errors/warnings. Testable in isolation (§81).
 *
 * Unknown fields produce WARNINGS, never silent discard (§58).
 */

function matchesType(type, value) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'any':
      return true;
    default:
      return true;
  }
}

function describeType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validate data against a schema.
 * @param {object} schema - schema node ({ type, fields, required, ... })
 * @param {*} data
 * @returns {{valid:boolean, errors:Array<{path:string,message:string}>, warnings:Array<{path:string,message:string}>}}
 */
export function validateData(schema, data) {
  const errors = [];
  const warnings = [];

  if (!schema || typeof schema !== 'object') {
    return {
      valid: false,
      errors: [{ path: '(root)', message: 'Schema is missing or invalid' }],
      warnings,
    };
  }

  validateNode(schema, data, '', errors, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

/* ---- private recursive walker ---- */

function validateNode(node, value, path, errors, warnings) {
  const type = node.type || 'any';
  const isAbsent = value === undefined || value === null;

  if (isAbsent) {
    if (node.required) {
      errors.push({ path: path || '(root)', message: 'required value is missing' });
    }
    return;
  }

  if (type !== 'any' && !matchesType(type, value)) {
    errors.push({
      path: path || '(root)',
      message: `expected type "${type}" but got "${describeType(value)}"`,
    });
    return;
  }

  // enum
  if (Array.isArray(node.enum) && !node.enum.includes(value)) {
    errors.push({ path: path || '(root)', message: `must be one of: ${node.enum.join(', ')}` });
  }

  // number constraints
  if (type === 'number') {
    if (typeof node.min === 'number' && value < node.min) {
      errors.push({ path, message: `must be >= ${node.min}` });
    }
    if (typeof node.max === 'number' && value > node.max) {
      errors.push({ path, message: `must be <= ${node.max}` });
    }
  }

  // string constraints
  if (type === 'string') {
    if (typeof node.minLength === 'number' && value.length < node.minLength) {
      errors.push({ path, message: `length must be >= ${node.minLength}` });
    }
    if (typeof node.maxLength === 'number' && value.length > node.maxLength) {
      errors.push({ path, message: `length must be <= ${node.maxLength}` });
    }
    if (typeof node.pattern === 'string') {
      let re = null;
      try {
        re = new RegExp(node.pattern);
      } catch {
        warnings.push({ path, message: `invalid pattern "${node.pattern}" in schema` });
      }
      if (re && !re.test(value)) {
        errors.push({ path, message: `must match pattern ${node.pattern}` });
      }
    }
  }

  // array constraints + items
  if (type === 'array') {
    if (typeof node.minItems === 'number' && value.length < node.minItems) {
      errors.push({ path, message: `must have >= ${node.minItems} item(s)` });
    }
    if (typeof node.maxItems === 'number' && value.length > node.maxItems) {
      errors.push({ path, message: `must have <= ${node.maxItems} item(s)` });
    }
    if (node.items) {
      value.forEach((item, i) => {
        validateNode(node.items, item, `${path}[${i}]`, errors, warnings);
      });
    }
  }

  // object fields + unknown-field detection (§58)
  if (type === 'object') {
    const fields = node.fields || {};

    for (const [key, fieldDef] of Object.entries(fields)) {
      const fieldPath = path ? `${path}.${key}` : key;
      validateNode(fieldDef, value[key], fieldPath, errors, warnings);
    }

    if (!node.allowUnknown) {
      for (const key of Object.keys(value)) {
        if (!(key in fields)) {
          warnings.push({
            path: path ? `${path}.${key}` : key,
            message: 'unknown field (not in schema)',
          });
        }
      }
    }
  }
} 
