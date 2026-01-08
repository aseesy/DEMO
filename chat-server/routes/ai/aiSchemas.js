/**
 * AI Schema Validation
 *
 * Uses Zod for type-safe validation of AI-related requests.
 */

const { z } = require('zod');

/**
 * Generate task schema
 */
const generateTaskSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
    })
    .trim()
    .min(1, 'Username is required'),
  taskDetails: z
    .string({
      required_error: 'Task details are required',
    })
    .trim()
    .min(1, 'Task details are required')
    .max(1000, 'Task details must be at most 1000 characters'),
});

/**
 * Mediate/analyze message schema
 * Note: Uses 'text' instead of 'message', and senderProfile/receiverProfile are optional objects
 */
const mediateAnalyzeSchema = z.object({
  text: z
    .string({
      required_error: 'Message text is required',
    })
    .trim()
    .min(1, 'Message text is required')
    .max(5000, 'Message text must be at most 5000 characters'),
  senderProfile: z.record(z.unknown()).optional(),
  receiverProfile: z.record(z.unknown()).optional(),
});

module.exports = {
  generateTaskSchema,
  mediateAnalyzeSchema,
};
