# LiaiZen Backend

Node.js + Express backend server for the LiaiZen co-parenting platform with WebSocket support.

## Overview

The backend provides RESTful API endpoints and WebSocket real-time communication for the LiaiZen platform. It includes AI-powered message mediation, authentication, room management, and task coordination features.

## Tech Stack

- **Node.js 20+** - Runtime
- **Express.js** - Web framework
- **Socket.io** - WebSocket server
- **PostgreSQL** - Database (required)
- **Redis** - Caching and distributed locking (optional)
- **OpenAI API** - AI message mediation
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email notifications

## Quick Start

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- PostgreSQL 12+
- (Optional) Redis for production features
- npm

### Installation

```bash
cd chat-server
npm install
```

### Environment Variables

Create a `.env` file in the `chat-server/` directory:

```env
PORT=3000
NODE_ENV=development

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/liaizen_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OpenAI API (for AI mediation)
OPENAI_API_KEY=sk-your-openai-api-key

# Email (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Database Setup

The server requires PostgreSQL. See `docs/POSTGRESQL_SETUP.md` for detailed setup instructions.

**Quick setup with Docker:**
```bash
docker run --name postgres-liaizen \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=liaizen_dev \
  -p 5432:5432 \
  -d postgres:15
```

Then set `DATABASE_URL=postgresql://postgres:devpass@localhost:5432/liaizen_dev`

### Run Database Migrations

```bash
npm run migrate
```

This creates all necessary database tables.

### Development

```bash
npm run dev
```

Starts server with nodemon at `http://localhost:3000`

### Production

```bash
npm start
```

Starts server with `node server.js`

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/oauth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/password/reset` - Request password reset
- `POST /api/auth/password/verify` - Verify password reset token

### User (`/api/user`)

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/context` - Get user context

### Rooms (`/api/room`)

- `GET /api/room` - List user's rooms
- `GET /api/room/:roomId` - Get room details
- `POST /api/room` - Create new room
- `PUT /api/room/:roomId` - Update room
- `DELETE /api/room/:roomId` - Delete room

### Messages (`/api/messages`)

- `GET /api/messages/:roomId` - Get room messages
- `POST /api/messages/:roomId` - Send message (also via WebSocket)
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message

### Tasks (`/api/tasks`)

- `GET /api/tasks/:roomId` - Get room tasks
- `POST /api/tasks/:roomId` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task
- `POST /api/tasks/:taskId/complete` - Mark task complete

### Contacts (`/api/contacts`)

- `GET /api/contacts/:roomId` - Get room contacts
- `POST /api/contacts/:roomId` - Add contact
- `PUT /api/contacts/:contactId` - Update contact
- `DELETE /api/contacts/:contactId` - Delete contact

### Invitations (`/api/invitations`)

- `POST /api/invitations` - Send invitation
- `GET /api/invitations/:token` - Get invitation details
- `POST /api/invitations/:token/accept` - Accept invitation
- `POST /api/invitations/:token/reject` - Reject invitation

### AI Mediation (`/api/ai`)

- `POST /api/ai/mediate` - Analyze message for mediation
- `POST /api/ai/rewrite` - Generate message rewrites
- `POST /api/ai/feedback` - Submit feedback on mediation

### Dashboard (`/api/dashboard`)

- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/stats` - Get user statistics

### Notifications (`/api/notifications`)

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Health & Status

- `GET /health` - Health check endpoint
- `GET /api/stats/user-count` - User count statistics

## WebSocket Events

### Client → Server Events

#### Connection
- `connect` - Connect to server (authentication via token)

#### Messages
- `send_message` - Send a message to a room
  ```javascript
  socket.emit('send_message', {
    roomId: 'room-id',
    text: 'Message text',
    type: 'user_message'
  });
  ```
- `edit_message` - Edit an existing message
- `delete_message` - Delete a message
- `add_reaction` - Add reaction to message

#### Rooms
- `join_room` - Join a room
  ```javascript
  socket.emit('join_room', { roomId: 'room-id' });
  ```
- `leave_room` - Leave a room

#### Threads
- `create_thread` - Create a new thread
- `reply_in_thread` - Reply to a thread
- `archive_thread` - Archive a thread
- `move_message_to_thread` - Move message to thread

#### Contacts
- `add_contact` - Add contact to room
- `update_contact` - Update contact
- `delete_contact` - Delete contact

#### Tasks
- `create_task` - Create task
- `update_task` - Update task
- `complete_task` - Mark task complete
- `delete_task` - Delete task

#### Feedback
- `submit_feedback` - Submit feedback on AI mediation

#### Topics (AI Thread Summaries)
- `topics:subscribe` - Subscribe to topic updates
- `topics:unsubscribe` - Unsubscribe from topics
- `topics:detect` - Request topic detection
- `topics:regenerate` - Regenerate topic summary

### Server → Client Events

#### Messages
- `message` - New message received
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `reaction_added` - Reaction was added

#### Rooms
- `room_joined` - Successfully joined room
- `room_left` - Left room
- `room_updated` - Room was updated

#### Threads
- `thread_created` - New thread created
- `reply_in_thread_success` - Reply successful
- `thread_archived` - Thread archived

#### System
- `error` - Error occurred
- `connected` - Connection established
- `disconnect` - Connection closed

#### AI Mediation
- `mediation_suggestion` - AI mediation suggestion available
- `mediation_feedback` - Feedback on mediation received

#### Topics
- `topics:list` - List of topics for room
- `topics:created` - New topic created
- `topics:updated` - Topic updated
- `topics:error` - Error with topics

## Development Scripts

```bash
npm start              # Start production server
npm run dev            # Start dev server with nodemon
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate test coverage
npm run migrate        # Run database migrations
npm run migrate:status # Check migration status
npm run db:validate    # Validate database schema
npm run db:backup      # Backup database
npm run lint:fix       # Fix linting issues
```

## Project Structure

```
chat-server/
├── routes/            # Express route handlers
│   ├── auth/         # Authentication routes
│   ├── user/         # User routes
│   └── ...
├── socketHandlers/   # WebSocket event handlers
│   ├── messageHandlers/
│   ├── connectionHandlers/
│   └── ...
├── src/
│   ├── core/         # Core business logic
│   ├── services/     # Service layer
│   ├── infrastructure/ # Database, Redis, etc.
│   └── ...
├── migrations/       # Database migrations
├── middleware/       # Express middleware
├── scripts/          # Utility scripts
└── server.js         # Entry point
```

## Database

### PostgreSQL (Required)

- **Connection**: Via `DATABASE_URL` environment variable
- **Migrations**: Located in `migrations/` directory
- **Schema**: Managed through migration files
- **Setup**: See `docs/POSTGRESQL_SETUP.md`

### Redis (Optional)

- **Purpose**: Caching, distributed locking, rate limiting
- **Connection**: Via `REDIS_URL` environment variable
- **Features**: Fails gracefully if not available
- **Setup**: See `docs/deployment/RAILWAY_REDIS_SETUP.md` for Railway setup, or see `chat-server/src/infrastructure/database/redisClient.js` for local development

## Security

### Authentication

- JWT tokens with 24-hour expiration
- HttpOnly cookies for web clients
- Google OAuth integration
- Password hashing with bcrypt

### Rate Limiting

- API endpoints: 100 requests/15min per IP
- Authentication: 5 attempts/15min per IP
- WebSocket: Per-event rate limits
- Redis-based distributed rate limiting (if available)

### CORS

- Configurable allowed origins
- Production domains whitelisted
- Localhost allowed in development

### Input Validation

- Server-side validation on all inputs
- XSS prevention
- SQL injection prevention (parameterized queries)

See `docs/security.md` for comprehensive security documentation.

## AI Mediation

The backend integrates with OpenAI API to provide message mediation:

- **Analysis**: Detects hostile or escalatory language
- **Suggestions**: Provides communication tips and rewrites
- **Learning**: Adapts to user communication patterns

Configuration via `OPENAI_API_KEY` environment variable.

## Email Notifications

Email notifications sent via Nodemailer with Gmail:

- Invitation emails
- Task reminders
- Notification emails

Configure via `GMAIL_USER` and `GMAIL_APP_PASSWORD`.

## Testing

Tests use Jest:

```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:integration # Integration tests only
```

## Deployment

The backend is deployed to Railway. See `docs/deployment.md` for details.

**Production URL**: https://demo-production-6dcd.up.railway.app

### Railway Configuration

- **Root Directory**: `chat-server`
- **Build Command**: (auto-detected)
- **Start Command**: `npm start`
- **Node Version**: 20+

## Monitoring

### Health Checks

- `GET /health` - Server health status
- Database connection status
- External service availability

### Logging

- Structured logging with levels
- Request/response logging
- Error tracking
- Performance metrics

## Additional Resources

- **Main README**: See `/README.md` for project overview
- **Architecture**: See `docs/architecture.md` for system design
- **Authentication**: See `docs/auth-flow.md` for authentication lifecycle
- **API Routes**: See `routes/README.md` for route structure
- **Database**: See `docs/POSTGRESQL_SETUP.md` for database setup
- **Database Constraints**: See `docs/db-constraints.md` for all database constraints
- **Room Membership**: See `docs/room-membership.md` for membership rules and constraints
- **Deployment**: See `docs/deployment.md` for deployment guides
- **Security**: See `docs/security.md` for security documentation

---

For questions or issues, see the main project README or open an issue on GitHub.

