/**
 * Rate Limiting
 *
 * Per-socket, per-event rate limiting for Socket.io.
 */

const { SocketErrorCodes, emitSocketError } = require('./errorCodes');

// Rate limit config per event type (requests per second)
const RATE_LIMITS = {
  join: { max: 2, windowMs: 1000 }, // 2 joins/sec (prevent DDoS via room join spam)
  send_message: { max: 5, windowMs: 1000 }, // 5 msgs/sec
  typing: { max: 10, windowMs: 1000 }, // 10 typing events/sec
  add_reaction: { max: 10, windowMs: 1000 }, // 10 reactions/sec
  get_threads: { max: 5, windowMs: 1000 }, // 5 thread fetches/sec
  create_thread: { max: 2, windowMs: 1000 }, // 2 thread creates/sec
  edit_message: { max: 5, windowMs: 1000 }, // 5 edits/sec
  delete_message: { max: 5, windowMs: 1000 }, // 5 deletes/sec
  default: { max: 20, windowMs: 1000 }, // Default: 20 req/sec
};

// Store rate limit state per socket
const rateLimitState = new WeakMap();

/**
 * Get rate limit state for a socket
 * @param {Object} socket - Socket.io socket
 * @returns {Map} Event -> state map
 */
function getRateLimitState(socket) {
  if (!rateLimitState.has(socket)) {
    rateLimitState.set(socket, new Map());
  }
  return rateLimitState.get(socket);
}

/**
 * Check if request should be rate limited
 * @param {Object} socket - Socket.io socket
 * @param {string} eventName - Event name
 * @returns {boolean} true if rate limited
 */
function isRateLimited(socket, eventName) {
  const state = getRateLimitState(socket);
  const config = RATE_LIMITS[eventName] || RATE_LIMITS.default;
  const now = Date.now();
  const key = eventName;

  if (!state.has(key)) {
    state.set(key, { count: 1, windowStart: now });
    return false;
  }

  const eventState = state.get(key);

  // Reset window if expired
  if (now - eventState.windowStart > config.windowMs) {
    eventState.count = 1;
    eventState.windowStart = now;
    return false;
  }

  // Increment and check
  eventState.count++;
  if (eventState.count > config.max) {
    return true;
  }

  return false;
}

/**
 * Socket.io rate limiting middleware
 * Applied per-event using socket.use()
 * @param {Object} socket - Socket.io socket
 */
function rateLimitMiddleware(socket) {
  socket.use(([event, ...args], next) => {
    // Skip internal events
    if (event.startsWith('internal:') || event === 'error') {
      return next();
    }

    if (isRateLimited(socket, event)) {
      console.warn(`[Rate Limit] Socket ${socket.id} rate limited on event: ${event}`);
      emitSocketError(
        socket,
        SocketErrorCodes.RATE_LIMITED,
        'Too many requests. Please slow down.',
        {
          event,
          retryAfter: 1000,
        }
      );
      // Don't call next() - drop the event
      return;
    }

    next();
  });
}

module.exports = {
  RATE_LIMITS,
  getRateLimitState,
  isRateLimited,
  rateLimitMiddleware,
};
