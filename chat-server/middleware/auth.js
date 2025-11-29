const jwt = require('jsonwebtoken');

/**
 * Express middleware to verify JWT token from cookie or Authorization header.
 * If valid, it attaches the user payload to req.user.
 *
 * This is the standard authentication middleware for all secure API routes.
 */
function authenticate(req, res, next) {
  try {
    // Check for token in cookie or Authorization header
    const token = req.cookies.auth_token ||
      (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Attach user payload to the request object.
    // The JWT payload may contain either 'id' or 'userId' depending on where it was generated.
    // We normalize to always have 'userId' for compatibility.
    const userId = decoded.userId || decoded.id;
    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
    };

    next();
  } catch (err) {
    // Handle specific JWT errors
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired.' });
    }
    // For other errors, return a generic 401
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = {
  authenticate,
};
