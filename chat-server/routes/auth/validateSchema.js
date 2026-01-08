/**
 * Schema Validation Middleware
 * 
 * Validates request body against Zod schema and coerces/trims data.
 * Returns 400 with validation errors if invalid.
 */

function validateSchema(schema) {
  return (req, res, next) => {
    try {
      // Parse and validate request body
      const result = schema.safeParse(req.body);

      if (!result.success) {
        // Format Zod errors into user-friendly response
        const errors = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        // If it's a required field error, prioritize that message
        const requiredError = errors.find(e => e.message.includes('required'));
        if (requiredError) {
          return res.status(400).json({
            error: requiredError.message,
            code: 'VAL_001',
          });
        }

        // Otherwise return first error (most specific)
        return res.status(400).json({
          error: errors[0].message,
          code: 'VAL_002',
          details: errors.length > 1 ? errors : undefined,
        });
      }

      // Replace req.body with validated and coerced data
      req.body = result.data;
      next();
    } catch (error) {
      // Unexpected error during validation
      return res.status(500).json({
        error: 'Internal server error',
        code: 'GEN_500',
      });
    }
  };
}

module.exports = validateSchema;
