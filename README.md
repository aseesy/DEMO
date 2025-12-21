# LiaiZen Co-Parenting Platform

**Better Co-Parenting Through Better Communication**

LiaiZen is a real-time communication platform designed to help separated parents communicate effectively for their children's wellbeing. The platform combines AI-powered message mediation, task management, and secure contact sharing to reduce conflict and improve co-parenting collaboration.

🌐 **Live Platform**: [coparentliaizen.com](https://coparentliaizen.com)

---

## 🎯 **Mission**

Transform high-tension co-parenting exchanges into respectful, child-centered dialogue through intelligent mediation technology.

### **Core Focus**

- **Child-Centered Outcomes**: Every feature prioritizes children's wellbeing
- **Conflict Reduction**: AI-powered mediation reduces misunderstandings
- **Privacy & Security**: SOC 2 Type II compliant, COPPA/GDPR adherent
- **Accessibility**: Mobile-first design for parents of all technical skill levels

---

## 🏗️ **Architecture**

### **Frontend** (`chat-client-vite/`)

- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS (mobile-first)
- **Real-time**: Socket.io-client for WebSocket communication
- **State**: React hooks and context
- **Deployment**: Vercel

### **Backend** (`chat-server/`)

- **Framework**: Node.js 18+ with Express.js
- **Real-time**: Socket.io for WebSocket server
- **Database**: SQLite (local) / PostgreSQL (production migration path)
- **AI Services**: OpenAI API for message mediation
- **Email**: Nodemailer with Gmail integration
- **Deployment**: Railway

### **LiaiZen AI System** (`chat-server/src/liaizen/`)

- **Core**: Main mediation pipeline (`core/mediator.js`) and AI client (`core/client.js`)
- **Agents**: Specialized AI agents for proactive coaching and feedback learning
- **Policies**: Constitution rules and safety controls
- **Context**: Communication profiles and user context management
- **Analysis**: Language analysis and rewrite validation
- **Intelligence**: Contact detection and relationship insights
- **Metrics**: Communication statistics and tracking

### **Development Framework** (NEW)

- **SDD Agentic Framework v2.0.0**: Specification-driven development with constitutional AI
- **DS-STAR Multi-Agent System**: Quality gates, intelligent routing, self-healing
- **14 Specialized Agents**: Automatic delegation across 6 departments
- **17 Constitutional Principles**: Enforceable development standards

---

## ✨ **Key Features**

### **Real-Time Communication**

- Private room-based messaging between co-parents
- WebSocket-powered instant message delivery
- Message history and search
- Typing indicators (no read receipts to prevent conflict)

### **AI-Powered Message Mediation**

- Real-time message blocking prevents hostile communication
- AI conversationally explains why you wouldn't want to send that message
- Provides 1 personalized communication tip relative to your situation
- Offers 2 rewrite options preserving your core message
- Users can select a rewrite or write a new message from scratch
- Adaptive learning personalizes to each user's communication style
- Feels like a supportive friend, not clinical therapy

### **Contact Management**

- Shared contact lists for co-parents, children, and professionals
- Comprehensive relationship context tracking for AI personalization
- Role-based contact types (teacher, doctor, family, partner)
- Emergency contact protocols

### **Task Management**

- Shared to-do lists for parenting responsibilities
- Task assignments with due dates
- Completion tracking and notifications
- Recurring task support

### **Room Management**

- Secure invitation system for co-parents
- Member status tracking (pending, accepted, rejected)
- Privacy controls and access management
- Message history maintained for reference and accountability

---

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- Python 3.9+ (for DS-STAR features)
- SQLite (included) or PostgreSQL

### **Installation**

```bash
# Clone repository
git clone https://github.com/yourusername/chat.git
cd chat

# Install dependencies
npm install

# Initialize SDD framework (optional)
# See INTEGRATION_GUIDE.md for full framework setup
```

### **Development**

```bash
# Start all services (frontend + backend)
npm run dev
# Or use the new dev stack command:
npm run dev:stack

# Frontend only (port 5173)
cd chat-client-vite && npm run dev

# Backend only (port 8080)
cd chat-server && node server.js

# Run tests
npm test
```

### **Development Scripts** (Phase 1)

LiaiZen includes development scripts for maintaining code quality:

```bash
# Database & Data Hygiene
cd chat-server
npm run db:validate      # Validate PostgreSQL schema
npm run reset:data       # Safe data reset (dev only)

# AI Pipeline Quality
npm run prompts:lint     # Validate mediation prompts
npm run ai:test          # AI regression tests

# Developer Productivity
npm run lint:fix         # Auto-fix code quality issues
npm run dev:stack        # Start all dev services
```

See `chat-server/scripts/README.md` for detailed documentation.

### **Environment Variables**

Create `.env` files:

**Backend** (`chat-server/.env`):

```env
PORT=8080
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
DATABASE_URL=sqlite:./chat.db
```

**Frontend** (`chat-client-vite/.env`):

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

---

## 📚 **Documentation**

### **Project Documentation**

- **CLAUDE.md**: AI assistant instructions and project guidelines
- **INTEGRATION_GUIDE.md**: SDD framework integration guide
- **START_HERE.md**: Framework overview and quick start
- **AGENTS.md**: Agent reference and capabilities

### **Framework Documentation**

- **.specify/memory/constitution.md**: 14 development principles
- **.docs/policies/**: Governance policies (testing, security, deployment)
- **FRAMEWORK_CHANGELOG.md**: Framework version history

### **API Documentation**

See `chat-server/README.md` for API endpoints and WebSocket events.

---

## 🛠️ **Development Workflow**

### **Standard Development**

1. Make changes to code
2. Test locally
3. Commit and push
4. Deploy via Vercel (frontend) and Railway (backend)

### **Specification-Driven Development** (NEW)

Using the SDD Agentic Framework:

```bash
# 1. Create feature specification with auto-refinement
/specify "Feature description"

# 2. Generate implementation plan with quality gates
/plan

# 3. Break into atomic tasks with dependencies
/tasks

# 4. Validate co-parenting domain requirements
/validate-domain --spec specs/###-feature-name/spec.md

# 5. Implement with specialized agent support
# (Agents auto-delegate based on task domain)

# 6. Pre-commit compliance validation
/finalize
```

See `INTEGRATION_GUIDE.md` for complete framework usage.

---

## 🧪 **Testing**

### **Backend Tests**

```bash
cd chat-server
npm test
```

### **Frontend Tests**

```bash
cd chat-client-vite
npm test
```

### **Constitutional Compliance Check**

```bash
./.specify/scripts/bash/constitutional-check.sh
```

### **Framework Integrity Audit**

```bash
./.specify/scripts/bash/sanitization-audit.sh
```

---

## 🚢 **Deployment**

### **Frontend (Vercel)**

- **URL**: https://coparentliaizen.com
- **Deployment**: Automatic on push to `main`
- **Config**: `vercel.json`

### **Backend (Railway)**

- **Project**: LiaiZen Demo
- **Service**: positive-recreation
- **URL**: https://demo-production-6dcd.up.railway.app
- **Deployment**: Automatic on push to `main`
- **Config**: Railway dashboard

### **Database**

- **Development**: SQLite (`chat-server/chat.db`)
- **Production**: PostgreSQL (migration in progress)

---

## 🔐 **Security & Privacy**

### **Data Protection**

- All passwords hashed with bcrypt
- JWT-based authentication
- Secure WebSocket connections
- Environment variable secret management

### **Privacy Compliance**

- COPPA compliant (children's data protection)
- GDPR adherent (EU privacy regulations)
- Communication history for accountability and reference
- Selective information sharing controls

### **Best Practices**

- Input validation on all user inputs
- Output sanitization for XSS prevention
- Rate limiting on API endpoints
- CORS properly configured

---

## 🧑‍💻 **Tech Stack**

### **Frontend**

- React 18+ (functional components, hooks)
- Vite (build tool)
- Tailwind CSS (styling)
- Socket.io-client (WebSocket)
- React Router (routing)

### **Backend**

- Node.js 18+
- Express.js (REST API)
- Socket.io (WebSocket server)
- SQLite/PostgreSQL (database)
- bcrypt (password hashing)
- jsonwebtoken (JWT auth)
- OpenAI API (AI mediation)
- Nodemailer (email)

### **Development**

- SDD Agentic Framework v2.0.0
- DS-STAR Multi-Agent System
- Python 3.13 (for DS-STAR)
- Constitutional AI governance

---

## 🤝 **Contributing**

### **Development Principles**

This project follows **17 constitutional principles** enforced by the SDD framework:

1. **Library-First Architecture**: Features as standalone libraries
2. **Test-First Development**: TDD with >80% coverage
3. **Contract-First Design**: API contracts before implementation
4. **Idempotent Operations**: Repeatable without side effects
5. **Progressive Enhancement**: Gradual feature rollout
6. **Git Operation Approval**: No automatic git commands
7. **Observability**: Structured logging for debugging
8. **Documentation Sync**: Docs stay current with code
9. **Dependency Management**: Careful external dependency control
10. **Agent Delegation**: Specialized work to specialized agents
11. **Input Validation**: All inputs/outputs validated
12. **Design System**: Consistent design patterns
13. **Access Control**: Role-based permissions
14. **AI Model Selection**: Appropriate model for task

### **Co-Parenting Domain Principles** (Additional)

15. **Child-Centered Outcomes**: Features benefit children's wellbeing
16. **Conflict Reduction First**: Reduce misunderstandings and tensions
17. **Privacy by Default**: Family data protection at every layer

### **Contribution Workflow**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Use SDD workflow: `/specify` → `/plan` → `/tasks`
4. Follow constitutional principles (run `./.specify/scripts/bash/constitutional-check.sh`)
5. Write tests (TDD with >80% coverage)
6. Validate domain requirements (run `/validate-domain`)
7. Commit with conventional commits: `feat:`, `fix:`, `docs:`, etc.
8. Push to branch: `git push origin feature/your-feature`
9. Create Pull Request

---

## 📊 **Project Status**

### **Current Version**: 1.0.0

### **Framework Version**: SDD v2.0.0 with DS-STAR

### **Features**

- ✅ Real-time messaging with WebSocket
- ✅ AI-powered message mediation
- ✅ Contact management
- ✅ Task management
- ✅ Room invitations and member management
- ✅ JWT authentication
- ✅ Google OAuth integration
- ✅ Email notifications
- ✅ Mobile-responsive UI
- ✅ SDD framework with 14 specialized agents
- 🚧 PostgreSQL migration (in progress)
- 🚧 Calendar integration (planned)
- 🚧 Document storage (planned)
- 🚧 Expense tracking (planned)

---

## 📝 **License**

Copyright © 2024 LiaiZen. All rights reserved.

---

## 🙏 **Acknowledgments**

- **SDD Agentic Framework**: [kelleysd-apps/sdd-agentic-framework](https://github.com/kelleysd-apps/sdd-agentic-framework)
- **OpenAI**: AI-powered message mediation
- **Socket.io**: Real-time communication
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting

---

## 📧 **Contact**

- **Website**: [coparentliaizen.com](https://coparentliaizen.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/chat/issues)
- **Email**: support@coparentliaizen.com

---

**For Better Co-Parenting. For Better Outcomes. For The Kids.**
