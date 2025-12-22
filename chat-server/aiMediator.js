/**
 * Backward compatibility shim for aiMediator.js
 *
 * This file provides backward compatibility for code that imports:
 *   const aiMediator = require('./aiMediator');
 *
 * After the core restructuring, the actual mediator code
 * is located at: src/core/core/mediator.js
 *
 * This shim re-exports the mediator from the core namespace location.
 */

module.exports = require('./src/core').mediator;
