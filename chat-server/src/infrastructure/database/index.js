/**
 * Database Infrastructure - Database clients and utilities
 * @module infrastructure/database
 */

const neo4jClient = require('./neo4jClient');
const schema = require('./schema');

module.exports = {
  neo4jClient,
  ...schema,
};
