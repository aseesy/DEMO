/**
 * Semantic Index Factory
 *
 * Creates the appropriate semantic index implementation based on availability.
 * Checks Neo4j availability once at startup and injects the appropriate implementation.
 */

const { Neo4jSemanticIndex } = require('./Neo4jSemanticIndex');
const { NoOpSemanticIndex } = require('./NoOpSemanticIndex');

/**
 * Factory for creating semantic index instances
 * Singleton pattern - checks availability once and reuses the instance
 */
class SemanticIndexFactory {
  constructor() {
    this._semanticIndex = null;
    this._initialized = false;
  }

  /**
   * Get semantic index instance
   * Checks Neo4j availability once at first call, then reuses the instance
   * @returns {ISemanticIndex} Semantic index implementation
   */
  getSemanticIndex() {
    if (this._initialized) {
      return this._semanticIndex;
    }

    // Check Neo4j availability once at wiring time
    const neo4jIndex = new Neo4jSemanticIndex();
    
    if (neo4jIndex.isAvailable()) {
      console.log('✅ Using Neo4j semantic index');
      this._semanticIndex = neo4jIndex;
    } else {
      console.log('⚠️  Neo4j not available, using NoOp semantic index (fail-open)');
      this._semanticIndex = new NoOpSemanticIndex();
    }

    this._initialized = true;
    return this._semanticIndex;
  }
}

// Export singleton instance
const factory = new SemanticIndexFactory();
module.exports = { SemanticIndexFactory, factory };

