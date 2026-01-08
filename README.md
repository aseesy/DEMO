# LiaiZen Co-Parenting Platform

> AI Powered Collaborative Co-Parenting Platform

LiaiZen is a PWA platform designed to reduce conflict between separated parents using AI to improve communication and assist with  task management.


🌐 **Live Platform**: https://app.coparentliaizen.com
**Marketing & Blog**: https://www.coparentliaizen.com

---

## Key Features

### Real-Time Communication
- Instant Message & Communication Alerts
- Search Message History
- Conversation Organization
- Smart Task and Contact Creation

### AI-Powered Message Mediation
- Blocks hostile or escalatory messages in real-time
- Explains why a message may escalate conflict
- Provides personalized communication insights
- Offers rewritten alternatives that preserve the core message
- Adaptive learning personalizes to each user's communication style

### Shared Coordination Tools
- **Tasks & Responsibilities**: Shared to-do lists with due dates and assignments
- **Contact Management**: Shared contacts for schools, doctors, and caregivers
- **Room Management**: Secure invitation system with member status tracking

### Design Principles
- **Conflict Reduction**: Reduce misunderstandings and tensions
- **Privacy-First**: Architecture designed for sensitive family communication
- **Mobile-First**: Accessible design for parents of all technical skill levels

---

## Repository Structure

```
.
├── chat-client-vite/    # Frontend (React + Vite)
├── chat-server/         # Backend (Node.js, Express, Socket.io)
├── marketing-site/      # Marketing & blog site (separate project)
├── docs/                # Project documentation
├── .specify/            # Specification-driven development framework
└── scripts/             # Development and deployment scripts
```

### Components

**Frontend** (`chat-client-vite/`)
- React 19, Vite, Tailwind CSS
- Socket.io client for real-time communication
- Deployed on Vercel

**Backend** (`chat-server/`)
- Node.js 20+, Express.js
- Socket.io for WebSocket server
- PostgreSQL (required in all environments)
- OpenAI API for AI mediation
- Deployed on Railway

**Marketing Site** (`marketing-site/`)
> **Note:** Intentionally excluded from the monorepo workspace. Requires separate `npm install` in `marketing-site/` directory. See `marketing-site/README.md` for setup.

- React 19+ with Vite
- Separate Vercel project
- Domain: `www.coparentliaizen.com`

**AI System** (`chat-server/src/liaizen/`)
- Mediation pipeline and AI client
- Communication analysis and rewriting
- User context and relationship insights

---

## Quick Start

### Prerequisites

- Node.js 20+ (required)
- npm
- PostgreSQL
- (Optional) Python 3.9+ for advanced framework tooling

### Installation

```bash
# Clone the repository (replace with actual repository URL)
git clone <repository-url>
cd chat
npm install
```

### Environment Variables

Create `.env` files in the respective directories:

**Backend** (`chat-server/.env`):

```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
DATABASE_URL=postgresql://user:password@localhost:5432/liaizen_dev
```

**Frontend** (`chat-client-vite/.env`):

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Run

```bash
# Start frontend + backend
npm run dev

# Or individually
npm run dev:backend    # Backend only (port 3000)
npm run dev:frontend   # Frontend only (port 5173)

# Other useful commands
npm run help           # Get help with commands
npm run doctor         # Validate your setup
npm stop               # Stop all servers
npm run restart        # Restart servers
```

### Development Scripts

```bash
# Database (run from chat-server directory)
cd chat-server && npm run migrate        # Run database migrations
cd chat-server && npm run db:validate    # Validate database schema

# Code quality (run from root)
npm run lint:fix       # Auto-fix code quality issues
npm run format         # Format code with Prettier
npm test               # Run all tests
```

See `chat-server/scripts/README.md` for detailed documentation on database scripts.

---

## Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Test with coverage
npm run test:coverage
```

---

## Documentation

Extended documentation lives in `/docs`:

**Start here:**
- `docs/architecture.md` — System overview & AI mediation flow
- `docs/auth-flow.md` — Authentication lifecycle (signup → login → WebSocket)
- `docs/deployment.md` — Vercel & Railway deployment guides
- `docs/security.md` — Security measures & privacy compliance
- `docs/sdd-framework.md` — SDD framework integration (optional)

**Additional references:**
- `chat-server/README.md` — API & WebSocket events
- `marketing-site/README.md` — Marketing site setup
- `CLAUDE.md` — AI assistant instructions and project guidelines
- `docs/deployment/` — Detailed deployment guides

---

## Deployment

**Main App (Vercel) - chat-client-vite ONLY**
- ⚠️ **CRITICAL**: Only deploy from `chat-client-vite/` directory
- ⚠️ **NEVER** deploy main app to any other Vercel project
- URL: https://chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app
- Production URL: https://app.coparentliaizen.com
- Automatic deployment on push to `main` (if Vercel is connected)
- Config: `chat-client-vite/vercel.json`
- **Safe deployment**: `./scripts/deploy-chat-client-vite.sh` or `cd chat-client-vite && npm run deploy`
- **See `DEPLOYMENT.md` for critical deployment instructions**

**Marketing Site (Vercel)**
- URL: https://www.coparentliaizen.com
- Automatic deployment on push to `main`
- **Separate Vercel project** - Never deploy main app here!

**Backend (Railway)**
- URL: https://demo-production-6dcd.up.railway.app
- Automatic deployment on push to `main`

**Database**
- PostgreSQL (required in all environments)
- Production: Managed PostgreSQL on Railway
- Development: Local PostgreSQL or Docker (see `docs/POSTGRESQL_SETUP.md`)

---

## Security & Privacy

- **Data Protection**: Passwords hashed with bcrypt, JWT authentication, secure connections (HTTPS/WSS)
- **Privacy Compliance**: COPPA and GDPR compliance planned (see `docs/prd/prd.md`)
- **Best Practices**: Input validation, XSS prevention (DOMPurify), rate limiting, CORS configured, security headers (Helmet.js)

---

## Specification-Driven Development (Optional)

This repository includes an agentic, specification-driven development framework used to:
- Define features before implementation
- Enforce architectural and domain constraints
- Maintain consistency in AI-mediated behavior

Framework usage is optional for contributors.

See `docs/INTEGRATION_GUIDE.md` for details.

---

## Project Status

**Version:** 1.0.0

**Features:**
- ✅ Real-time messaging with WebSocket
- ✅ AI-powered message mediation
- ✅ Tasks & contacts
- ✅ Room invitations and member management
- ✅ JWT authentication & Google OAuth
- ✅ Email notifications
- ✅ Mobile-responsive UI
- ✅ PostgreSQL database
- 🚧 Calendar integration (planned)
- 🚧 Document storage (planned)
- 🚧 Expense tracking (planned)

---

## License

Copyright © 2024 LiaiZen. All rights reserved.

## Acknowledgments

- **SDD Agentic Framework**: [kelleysd-apps/sdd-agentic-framework](https://github.com/kelleysd-apps/sdd-agentic-framework)
- **OpenAI**: AI-powered message mediation
- **Socket.io**: Real-time communication
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting

## Contact

- **Website**: [coparentliaizen.com](https://coparentliaizen.com)
- **Email**: info@liaizen.com

---

**For Mature Co-Parenting. For Easier Interactions. For The Sake Of The Kids.**
