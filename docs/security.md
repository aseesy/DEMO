# Security & Privacy

## Overview

LiaiZen implements multiple layers of security to protect user data and ensure safe communication between co-parents. This document outlines the security measures, privacy compliance, and best practices implemented in the platform.

## Data Protection

### Authentication

- **Password Hashing**: bcrypt with 10 salt rounds (verified in `chat-server/auth/utils.js`)
- **JWT Authentication**: Secure token-based authentication with 24-hour expiration
- **Google OAuth**: Integrated OAuth 2.0 flow for secure third-party authentication
- **Session Management**: HttpOnly cookies for web, secure token storage for mobile

### Encryption

- **At Rest**: PostgreSQL native encryption for database storage
- **In Transit**: TLS 1.3 for all API calls, WSS (WebSocket Secure) for real-time messaging
- **Note**: NOT end-to-end encrypted (AI mediation requires server-side message access)

### Secure Connections

- **HTTPS**: All frontend connections use HTTPS (Vercel automatic SSL)
- **WSS**: WebSocket connections use WSS in production (Railway automatic SSL)
- **TLS**: Backend API uses TLS 1.3 for all communications

## Privacy Compliance

### COPPA Compliance (Planned)

**Note**: COPPA compliance is planned but not fully implemented. See `docs/prd/prd.md` for requirements.

**Planned Measures:**
- No tracking of children under 13
- Parental consent mechanisms
- Age verification for child-related features
- No behavioral tracking of minors

**Current Status**: The platform does not currently collect children's data, but full COPPA compliance features are planned.

### GDPR Compliance (Planned)

**Note**: GDPR compliance is planned but not fully implemented. See `docs/prd/prd.md` for requirements.

**Planned Measures:**
- Data portability (export user data)
- Right to erasure (with legal retention exceptions)
- Data processing agreements
- Consent management
- Privacy policy enforcement

**Current Status**: Basic data protection measures in place, but full GDPR features are planned.

## Security Best Practices

### Input Validation

- **Frontend Validation**: Client-side validation for immediate feedback
- **Backend Validation**: Server-side validation (never trust client input)
- **Password Requirements**: Strong password requirements enforced
- **Email Validation**: Email format validation
- **Message Length**: Message length limits enforced

### XSS Prevention

- **DOMPurify**: Client-side sanitization using `isomorphic-dompurify`
- **Output Encoding**: Server-side output encoding
- **CSP Headers**: Content Security Policy headers via Helmet.js
- **Sanitization**: Input sanitization before storage

### SQL Injection Prevention

- **Parameterized Queries**: All database queries use parameterized statements
- **Query Builders**: Safe query builders in `dbSafe.js`
- **Input Escaping**: User input properly escaped before database operations

### Rate Limiting

- **API Rate Limiting**: Express rate limiting on all API endpoints
- **Authentication Rate Limiting**: Stricter limits on login/signup endpoints
- **Socket.io Rate Limiting**: Per-socket, per-event rate limiting
- **Redis-Based Rate Limiting**: Distributed rate limiting using Redis (optional)

**Rate Limits:**
- General API: 100 requests per 15 minutes per IP
- Authentication: 5 attempts per 15 minutes per IP
- WebSocket events: Per-event limits (e.g., 5 messages/second)

### CORS Configuration

- **Allowed Origins**: Whitelist of allowed frontend domains
- **Production Domains**: `app.coparentliaizen.com`, `www.coparentliaizen.com`
- **Development**: All localhost origins allowed
- **Credential Support**: Credentials allowed for authenticated requests

**Configuration Location**: `chat-server/middleware.js`, `chat-server/server.js`

### Security Headers (Helmet.js)

- **Content Security Policy**: Restricts resource loading
- **XSS Protection**: XSS filter enabled
- **No Sniff**: Prevents MIME type sniffing
- **HSTS**: HTTP Strict Transport Security (in production)
- **Frame Options**: Prevents clickjacking

**Configuration Location**: `chat-server/middleware.js`

## Access Control

### Role-Based Access Control (RBAC)

- **User Roles**: User, Co-Parent, Attorney (observer), Admin
- **Room Permissions**: Room-level access control
- **Message Permissions**: Message-level access control
- **API Authorization**: Authorization checks before database queries

### Row-Level Security (RLS)

- **PostgreSQL RLS**: Data isolation between rooms
- **User Context**: User context enforced at database level
- **Room Membership**: Only room members can access room data

## Audit Logging

### What's Logged

- **Authentication Events**: Login attempts, successful logins, failures
- **Authorization Failures**: Access denied events
- **Data Access**: Database queries (metadata only)
- **Message Operations**: Message sends/receives (metadata, not content)
- **AI Mediation**: AI mediation requests and outcomes
- **System Events**: Errors, warnings, critical operations

### Log Format

- Structured logging with levels (info, warn, error)
- Timestamp included
- User context (hashed user ID)
- IP address for security monitoring
- Action and resource identifiers

### Log Retention

- **Planned**: 7 years for GDPR compliance
- **Current**: Retained per deployment platform policies

## Security Monitoring

### Health Checks

- **Health Endpoint**: `/health` endpoint for monitoring
- **Database Status**: PostgreSQL connection status checked
- **External Services**: OpenAI API, email service availability

### Error Tracking

- **Error Logging**: All errors logged with context
- **Production**: Errors sanitized (no stack traces exposed)
- **Development**: Full error details for debugging

### Rate Limit Monitoring

- **Redis Metrics**: Rate limit counters tracked
- **Alerting**: Rate limit violations logged
- **Adaptive Limits**: Potential for dynamic rate limit adjustment

## Dependency Security

### Package Management

- **Regular Audits**: `npm audit` run regularly
- **Dependency Updates**: Automated dependency updates via Dependabot
- **Vulnerability Scanning**: Pre-commit hooks scan for secrets
- **Pinned Versions**: Dependency versions pinned for stability

### Security Scanning

- **Secret Scanning**: Pre-commit hooks scan for exposed secrets
- **Dependency Audits**: Regular npm audit checks
- **Code Scanning**: ESLint security plugins

## Privacy Best Practices

### Data Minimization

- **Required Data Only**: Only collect necessary user data
- **No Tracking**: No behavioral tracking or analytics on user actions
- **Message Content**: Message content stored only for communication history
- **No Third-Party Data Sharing**: No data sold or shared with third parties

### Data Retention

- **Message History**: Retained for legal purposes (co-parenting agreements)
- **User Accounts**: Retained until account deletion
- **Audit Logs**: 7 years (planned for GDPR compliance)
- **Deleted Data**: Soft deletion for recovery, hard deletion after retention period

### User Rights (Planned)

- **Data Export**: Export user data (planned)
- **Data Deletion**: Request account deletion (planned)
- **Data Portability**: Export in standard format (planned)
- **Consent Management**: Manage privacy preferences (planned)

## Security Configuration

### Environment Variables

**Required for Security:**
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
DATABASE_URL=postgresql://...
```

**Recommended:**
```env
REDIS_URL=redis://... (for distributed rate limiting)
FRONTEND_URL=https://app.coparentliaizen.com,...
```

### Production Checklist

- [ ] Strong JWT secret (32+ characters, random)
- [ ] HTTPS/WSS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Database credentials secure
- [ ] Environment variables not in code
- [ ] Error messages sanitized in production
- [ ] Logging configured (no sensitive data)
- [ ] Dependencies up to date

## Known Limitations

### Current Limitations

1. **COPPA Compliance**: Planned but not fully implemented
2. **GDPR Compliance**: Planned but not fully implemented
3. **End-to-End Encryption**: Not implemented (required for AI mediation)
4. **2FA**: Not yet implemented (planned)
5. **Audit Log UI**: No user-facing audit log viewer yet

### Planned Improvements

- Full COPPA/GDPR compliance features
- Two-factor authentication (TOTP)
- User-facing privacy controls
- Data export/deletion endpoints
- Enhanced audit logging
- Security incident response procedures

## Incident Response

### Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Email: info@liaizen.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact

### Response Process

1. Acknowledge receipt within 48 hours
2. Assess severity
3. Develop fix
4. Deploy fix
5. Disclose (if necessary) after fix deployed

## Compliance Roadmap

### Short Term (0-3 months)

- [ ] Implement basic data export
- [ ] Add consent management UI
- [ ] Complete GDPR data deletion endpoint
- [ ] Implement audit log viewer

### Medium Term (3-6 months)

- [ ] Full COPPA compliance features
- [ ] Two-factor authentication
- [ ] Enhanced privacy controls
- [ ] Security monitoring dashboard

### Long Term (6-12 months)

- [ ] SOC 2 Type II certification (target)
- [ ] Third-party security audit
- [ ] Bug bounty program
- [ ] Regular security assessments

## Additional Resources

- **Security Policy**: See `docs/policies/security-policy.md`
- **PRD Security Requirements**: See `docs/prd/prd.md` (Security & Compliance section)
- **Backend Security Review**: See `BACKEND_CODE_REVIEW.md` (Security Review section)

---

For architecture details, see [architecture.md](./architecture.md)  
For deployment information, see [deployment.md](./deployment.md)

