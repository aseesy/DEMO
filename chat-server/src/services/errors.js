/**
 * Custom Error Classes for Services
 *
 * These errors provide semantic meaning and can be caught
 * by route handlers to return appropriate HTTP status codes.
 */

class ServiceError extends Error {
  constructor(message, code = 'SERVICE_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

// 400 Bad Request
class ValidationError extends ServiceError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

// 401 Unauthorized
class AuthenticationError extends ServiceError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

// 403 Forbidden
class AuthorizationError extends ServiceError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

// 404 Not Found
class NotFoundError extends ServiceError {
  constructor(resource = 'Resource', identifier = null) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.resource = resource;
    this.identifier = identifier;
  }
}

// 409 Conflict
class ConflictError extends ServiceError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
  }
}

// 410 Gone (expired)
class ExpiredError extends ServiceError {
  constructor(resource = 'Resource') {
    super(`${resource} has expired`, 'EXPIRED', 410);
    this.resource = resource;
  }
}

// 422 Unprocessable Entity (business logic failure)
class BusinessRuleError extends ServiceError {
  constructor(message, rule = null) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
    this.rule = rule;
  }
}

// 429 Too Many Requests
class RateLimitError extends ServiceError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.retryAfter = retryAfter;
  }
}

// 503 Service Unavailable (external service down)
class ExternalServiceError extends ServiceError {
  constructor(service, message = null) {
    super(message || `${service} is unavailable`, 'EXTERNAL_SERVICE_ERROR', 503);
    this.service = service;
  }
}

module.exports = {
  ServiceError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ExpiredError,
  BusinessRuleError,
  RateLimitError,
  ExternalServiceError,
};
