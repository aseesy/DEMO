/**
 * Backward compatibility shim for aiMediator.js
 *
 * This file provides backward compatibility for code that imports:
 *   const aiMediator = require('./aiMediator');
 *
 * After the LiaiZen namespace restructuring, the actual mediator code
 * is located at: src/liaizen/core/mediator.js
 *
 * This shim re-exports the mediator from the new namespace location.
 */

module.exports = require('./src/liaizen').mediator;
