/**
 * Admin Authentication Middleware
 * 
 * Validates admin secret for protected admin endpoints
 */

/**
 * Verify admin secret from request body
 */
function verifyAdminSecret(req, res, next) {
  const { secret } = req.body;
  const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET || 'liaizen-test-cleanup-2024';

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = { verifyAdminSecret };

