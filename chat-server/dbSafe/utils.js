/**
 * Safe Database Utilities
 */

function escapeIdentifier(identifier) {
  if (typeof identifier !== 'string') throw new Error('Identifier must be a string');
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(identifier))
    throw new Error(`Invalid identifier: ${identifier}`);
  return `"${identifier}"`;
}

function parseResult(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.rows) return result.rows;
  return [];
}

module.exports = { escapeIdentifier, parseResult };
