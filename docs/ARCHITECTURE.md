# System Architecture

## Overview

LiaiZen is a real-time co-parenting communication platform built with React (frontend), Node.js/Express (backend), and PostgreSQL (database). The platform combines AI-powered message mediation, shared coordination tools, and secure communication to help separated parents reduce conflict and focus on their children's wellbeing.

## High-Level Architecture

```
┌─────────────┐
│   Browser   │ (PWA - Progressive Web App)
└──────┬──────┘
       │ HTTPS/WSS
       │
┌──────▼──────────────────────────────────────┐
│         Vercel (Frontend CDN)                │
│    React App (Static Assets)                 │
└──────┬──────────────────────────────────────┘
       │
       │ REST API / WebSocket
       │
┌──────▼──────────────────────────────────────┐
│      Railway (Backend Server)                │
│  ┌──────────────────────────────────────┐   │
│  │  Express.js (REST API)               │   │
│  │  Socket.io (WebSocket Server)        │   │
│  │  OpenAI API (AI Mediation)           │   │
│  └──────────┬───────────────────────────┘   │
└─────────────┼───────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌──────▼──────┐
│PostgreSQL│    │   Redis     │ (Optional)
│Database  │    │(Caching,    │
│          │    │ Rate Limit) │
└──────────┘    └─────────────┘
```

## Components

### Frontend (`chat-client-vite/`)

**Technology Stack:**
- React 19 with functional components and hooks
- Vite for build tooling and hot module replacement
- Tailwind CSS for styling (mobile-first approach)
- Socket.io-client for WebSocket communication
- React Router for client-side routing
- PWA capabilities (service worker, offline support)

**Key Features:**
- Real-time messaging interface
- AI message mediation UI
- Task and contact management
- Responsive design (mobile, tablet, desktop)
- Offline support via service workers

**Deployment:** Vercel (automatic on push to `main`)

### Backend (`chat-server/`)

**Technology Stack:**
- Node.js 20+ with Express.js
- Socket.io for WebSocket server
- PostgreSQL for data persistence
- Redis (optional) for caching and distributed locking
- OpenAI API for AI-powered message mediation
- Nodemailer for email notifications
- JWT for authentication
- bcrypt for password hashing

**Key Features:**
- RESTful API for CRUD operations
- WebSocket server for real-time communication
- AI mediation pipeline (`src/liaizen/`)
- Authentication and authorization
- Rate limiting and spam protection
- Message persistence and history

**Deployment:** Railway (automatic on push to `main`)

### AI Mediation System (`chat-server/src/liaizen/`)

The LiaiZen AI system provides intelligent message mediation to reduce conflict between co-parents.

**Pipeline:**
1. **Message Analysis** (`core/analysis/`) - Language analysis and sentiment detection
2. **Mediation Engine** (`core/mediator.js`) - Determines if message needs intervention
3. **Rewrite Generation** (`core/client.js`) - Uses OpenAI to generate alternatives
4. **User Feedback** (`agents/feedbackLearner.js`) - Learns from user choices
5. **Context Management** (`context/`) - Tracks communication patterns

**Key Components:**
- `core/mediator.js` - Main mediation pipeline
- `core/client.js` - OpenAI API client
- `agents/` - Specialized AI agents for coaching and feedback
- `policies/` - Safety controls and rules
- `context/` - User communication profiles
- `analysis/` - Language and sentiment analysis

### Marketing Site (`marketing-site/`)

**Technology Stack:**
- React 19+ with Vite
- Separate Vercel project
- Domain: `www.coparentliaizen.com`

**Note:** Intentionally excluded from monorepo workspace. See `marketing-site/README.md` for setup.

## Data Flow

### Message Sending Flow

```
1. User types message in frontend
   ↓
2. Frontend validates input (length, format)
   ↓
3. Socket.io emits 'sendMessage' event
   ↓
4. Backend receives event, validates again
   ↓
5. AI mediation checks message (if enabled)
   ↓
6. If flagged, returns mediation suggestions
   ↓
7. User reviews options, selects rewrite or original
   ↓
8. Message saved to PostgreSQL
   ↓
9. Broadcast to all room members via WebSocket
   ↓
10. Frontend receives message, updates UI
```

### Authentication Flow

```
1. User submits credentials (email/password or OAuth)
   ↓
2. Backend validates credentials
   ↓
3. bcrypt compares password hash (if email/password)
   ↓
4. JWT token generated
   ↓
5. Token sent to client (httpOnly cookie)
   ↓
6. Client stores token, includes in subsequent requests
   ↓
7. Middleware validates token on protected routes
   ↓
8. Request proceeds if valid, rejected if invalid
```

### AI Mediation Flow

```
1. User attempts to send message
   ↓
2. Message sent to AI mediation pipeline
   ↓
3. AI analyzes message for:
   - Hostile language
   - Escalation risk
   - Communication pattern
   ↓
4. If risky, AI generates:
   - Explanation of why message is risky
   - Personalized communication tip
   - 2 alternative rewrites
   ↓
5. User sees suggestions, can:
   - Select a rewrite
   - Edit and resubmit
   - Send original (with confirmation)
   ↓
6. User choice logged for learning
```

## Database Schema

### Core Tables

**Users**
- Authentication and profile information
- Communication preferences
- Privacy settings

**Rooms**
- Co-parent communication spaces
- Member relationships
- Invitation system

**Messages**
- Message content and metadata
- AI mediation results
- Thread organization

**Tasks**
- Shared responsibilities
- Assignments and due dates
- Completion tracking

**Contacts**
- Shared contact information
- Relationship types
- Emergency protocols

### Relationships

- Users ↔ Rooms (many-to-many via memberships)
- Rooms ↔ Messages (one-to-many)
- Rooms ↔ Tasks (one-to-many)
- Rooms ↔ Contacts (one-to-many)
- Messages ↔ Threads (hierarchical threading)

## Security Architecture

### Authentication
- JWT tokens with 24-hour expiration
- Google OAuth integration
- Secure password hashing (bcrypt)
- Session management

### Authorization
- Role-based access control (RBAC)
- Room-level permissions
- Message-level access control

### Data Protection
- HTTPS/WSS for all communications
- Input validation and sanitization
- XSS prevention (DOMPurify)
- SQL injection prevention (parameterized queries)
- Rate limiting (per-user and per-IP)

### Privacy
- Encryption at rest (PostgreSQL)
- Encryption in transit (TLS 1.3)
- Audit logging
- Data retention policies

## Scalability Considerations

### Current Scale
- Designed for 10-1,000 concurrent users
- Single server instance
- PostgreSQL with connection pooling

### Scaling Path

**Horizontal Scaling (1,000+ users):**
- Multiple server instances
- Redis for shared state
- Load balancer (Railway handles this)
- PostgreSQL read replicas

**Vertical Scaling:**
- Database query optimization
- Caching layer (Redis)
- CDN for static assets (Vercel provides)
- Message queue for async operations

### Performance Optimizations

- Connection pooling (PostgreSQL)
- Redis caching for frequently accessed data
- WebSocket connection management
- Efficient database queries with indexes
- Frontend code splitting and lazy loading

## Development Architecture

### Monorepo Structure

```
.
├── chat-client-vite/     # Frontend application
├── chat-server/          # Backend application
├── marketing-site/       # Marketing site (separate)
├── docs/                 # Documentation
├── .specify/             # SDD framework
└── scripts/              # Development scripts
```

### Build System

- **Frontend:** Vite with HMR, code splitting
- **Backend:** Node.js with nodemon for development
- **Database:** Migration scripts in `chat-server/migrations/`

### Testing Strategy

- **Unit Tests:** Jest (backend), Vitest (frontend)
- **Integration Tests:** API and WebSocket testing
- **E2E Tests:** User flow validation
- **Coverage Target:** >80% for critical paths

## Monitoring & Observability

### Logging
- Structured logging with levels
- Request/response logging
- Error tracking
- Performance metrics

### Health Checks
- `/health` endpoint for monitoring
- Database connection status
- External service availability (OpenAI, email)

### Metrics
- Response times
- Error rates
- Database query performance
- WebSocket connection counts

## External Integrations

### OpenAI API
- GPT-3.5 Turbo for tone analysis
- GPT-4 Turbo for message rewriting
- Rate limiting and error handling

### Google OAuth
- User authentication
- Profile information retrieval
- Secure token exchange

### Email (Nodemailer)
- Invitation emails
- Notification emails
- Transactional communications

## Future Architecture Considerations

- **Microservices:** Separate services for AI, notifications, analytics
- **Message Queue:** Async processing for AI mediation
- **CDN:** Enhanced static asset delivery
- **Search:** Full-text search for message history
- **Analytics:** User behavior and communication insights

---

For deployment details, see [deployment.md](./deployment.md)  
For security information, see [security.md](./security.md)
