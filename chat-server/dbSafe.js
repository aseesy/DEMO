/**
 * Safe Database Query Builder Module - Modular Entry Point
 */
const { escapeIdentifier, parseResult } = require('./dbSafe/utils');
const { safeSelect } = require('./dbSafe/select');
const { safeInsert, safeInsertTx } = require('./dbSafe/insert');
const { safeUpdate, safeDelete } = require('./dbSafe/update');
const { withTransaction } = require('./dbSafe/transaction');

module.exports = {
  escapeIdentifier,
  parseResult,
  safeSelect,
  safeInsert,
  safeInsertTx,
  safeUpdate,
  safeDelete,
  withTransaction,
};
