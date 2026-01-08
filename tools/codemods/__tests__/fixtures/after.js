/**
 * Example file AFTER transformation
 * Console calls converted to logger
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');
const someModule = require('./someModule');

const logger = defaultLogger.child({ module: 'before' });

function processMessage(message, userId, email) {
  logger.debug('Processing message', { userId, hasEmail: !!email });

  try {
    const result = someModule.process(message);
    logger.debug('Message processed successfully', { result });
    return result;
  } catch (error) {
    logger.error('Error processing message', error, { errorCode: error.code });
    logger.warn('Retrying...');
    throw error;
  }
}

module.exports = { processMessage };
