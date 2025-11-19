# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the coparentliaizen.com codebase.

## Project Overview

**LiaiZen** (coparentliaizen.com) is a co-parenting communication platform that helps separated parents communicate better for their children's wellbeing. The platform provides:

- **Real-time messaging** between co-parents via WebSocket
- **AI-powered message mediation** to reduce conflict and improve communication quality
- **Contact management** for co-parents, children, and related parties
- **Task management** for shared parenting responsibilities
- **Room-based communication** for private co-parent conversations
- **Mobile/PWA support** for accessibility on all devices

## Architecture

### Frontend (`chat-client-vite/`)
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io-client
- **State**: React hooks and context
- **Deployment**: Vercel

### Backend (`chat-server/`)
- **Framework**: Node.js 18+ with Express.js
- **Real-time**: Socket.io
- **Database**: SQLite (with migration path to PostgreSQL)
- **AI Services**: OpenAI API for message mediation
- **Email**: Nodemailer (Gmail integration)
- **Deployment**: Railway

### Key Features
- User authentication (JWT, Google OAuth)
- Real-time chat rooms
- AI message mediation and rewriting
- Contact management (co-parents, children, professionals)
- Task management
- Room invitations and member management
- Email notifications

## Commands

### Domain Validation

**`/validate-domain`** - Validate features against co-parenting domain requirements

- **PURPOSE**: Ensure features align with LiaiZen's mission and co-parenting best practices
- **Script**: `.specify/scripts/bash/validate-domain.sh`
- **Domain Requirements Checked**:
  - ✅ Child-centered outcomes focus
  - ✅ Conflict reduction mechanisms
  - ✅ Privacy and security for family data
  - ✅ Accessibility for varying technical skills
  - ✅ Asynchronous communication support
  - ✅ Audit trail for legal/custody purposes
  - ✅ Conflict resolution resources
  - ✅ Privacy regulation compliance (COPPA, GDPR)
  - ✅ Selective information sharing
  - ✅ Invitation state handling
  - ✅ AI mediation integration
  - ✅ Real-time communication support
  - ✅ Mobile/PWA compatibility
  - ✅ Backward compatibility

- **Usage Examples**:
  ```bash
  # Validate a specification file
  /validate-domain --spec specs/001-feature-name/spec.md

  # Validate entire feature directory
  /validate-domain --directory specs/001-feature-name/

  # Validate a component
  /validate-domain --component chat-client-vite/src/components/ContactsPanel.jsx

  # Validate a file directly
  /validate-domain chat-client-vite/src/components/ChatRoom.jsx
  ```

- **Output**: Validation report with:
  - Pass/fail status for each requirement
  - Overall score (0-100%)
  - Specific recommendations for improvements
  - Domain alignment percentage

- **Note**: This command does NOT modify files - it only validates and reports recommendations

## Co-Parenting Domain Principles

When working on LiaiZen features, always consider:

1. **Child-Centered Outcomes**: Every feature should ultimately benefit children's wellbeing
2. **Conflict Reduction**: Features should help reduce misunderstandings and tensions between co-parents
3. **Privacy & Security**: Co-parenting data is sensitive and must be protected
4. **Accessibility**: Features must work for parents with varying technical skills
5. **Asynchronous Communication**: Support parents in different time zones
6. **Legal Compliance**: Maintain audit trails and comply with privacy regulations
7. **Conflict Resources**: Provide tools and resources for conflict resolution

## Development Guidelines

### Code Style
- **Frontend**: Functional React components with hooks, Tailwind CSS, mobile-first design
- **Backend**: Express.js routes, async/await, error handling middleware
- **Database**: Parameterized queries, migrations for schema changes
- **Testing**: Unit tests for components/modules, integration tests for workflows

### Security
- Never log sensitive family information
- Encrypt sensitive data at rest and in transit
- Validate all user input (frontend and backend)
- Use parameterized queries to prevent SQL injection
- Rate limit API endpoints

### Real-Time Communication
- Use Socket.io for real-time updates
- Handle reconnection gracefully
- Prevent duplicate message delivery
- Maintain message order

### Mobile/PWA
- Test on mobile devices, not just desktop
- Ensure touch targets are 44px minimum
- Support offline functionality where possible
- Optimize for mobile data usage

## File Structure

```
chat-client-vite/          # React frontend
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── apiClient.js      # API client
│   └── config.js         # Configuration

chat-server/              # Node.js backend
├── server.js             # Express + Socket.io server
├── db.js                 # Database (SQLite)
├── auth.js               # Authentication
├── roomManager.js        # Room management
├── aiMediator.js         # AI message mediation
└── emailService.js       # Email notifications

.specify/                 # SDD framework templates
├── templates/            # Feature templates
└── scripts/bash/         # Validation scripts

.claude/                  # Claude configuration
└── commands/             # Command documentation
```

## Key Dependencies

### Frontend
- React 18+
- Tailwind CSS
- Socket.io-client
- Vite

### Backend
- Express.js
- Socket.io
- sql.js (SQLite)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- openai (AI mediation)
- nodemailer (email)

## Deployment

- **Frontend**: Vercel (coparentliaizen.com)
- **Backend**: Railway (demo-production-6dcd.up.railway.app)
- **Database**: SQLite (local), PostgreSQL (production migration path)
- **Environment Variables**: Managed via Railway and Vercel dashboards

---

*For coparentliaizen.com - Better Co-Parenting Through Better Communication*

