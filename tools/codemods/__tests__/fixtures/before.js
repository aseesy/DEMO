/**
 * Example file BEFORE transformation
 * This file has console.* calls that should be converted to logger
 */

const someModule = require('./someModule');

function processMessage(message, userId, email) {
  console.log('Processing message', { userId, email });

  try {
    const result = someModule.process(message);
    console.log('Message processed successfully', result);
    return result;
  } catch (error) {
    console.error('Error processing message', error);
    console.warn('Retrying...');
    throw error;
  }
}

module.exports = { processMessage };
