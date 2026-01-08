# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LiaiZen** (coparentliaizen.com) is a communication platform with context aware AI-powered message mediation. The platform helps separated parents communicate better through real-time messaging, conflict reduction via AI coaching, shared task management, and contact sharing.

**Live**: https://coparentliaizen.com

## Security: Secret Protection

**CRITICAL**: Never expose secrets in code, configs, logs, or outputs.

### Rules

1. **Never hardcode** API keys, passwords, tokens, or connection strings
2. **Never commit** `.env` files or real credentials to git
3. **Never include** real secrets in examples, comments, or error messages
4. **Never log** secrets to console, files, or external services
5. **Always use** environment variables: `process.env.SECRET_NAME`
6. **Always use** placeholders in examples: `your-api-key-here`, `<REDACTED>`

### Protected File Types

These files may contain secrets - handle with care:

- `.env`, `.env.*` (except `.env.example`)
- `.claude/settings.local.json`
- `.mcp*.json`
- Any file with `secret`, `key`, `token`, `password`, `credential` in name

### Secret Patterns to Detect

```
sk-ant-api...     # Anthropic API keys
sk-...            # OpenAI API keys
postgresql://...  # Database URLs with passwords
Bearer eyJ...     # JWT tokens
ghp_...           # GitHub tokens
PGPASSWORD=...    # Database passwords
```

### If You Encounter a Secret

1. **Stop** - Do not proceed with the current action
2. **Alert** - Warn the user immediately
3. **Remove** - Help remove the secret from code/config
4. **Rotate** - Remind user to rotate the exposed credential

### Pre-commit Protection

Secretlint runs automatically on commit. Run manually:

```bash
npm run secrets:scan        # Scan entire project
npm run secrets:scan:staged # Scan staged files only
```

## Architecture

### Core Domain

**What this system does:**

1. **Message Mediation** - Intercepts hostile messages before they reach the recipient
2. **Sender-First Coaching** - Helps senders communicate better (not punishment, education)
3. **Communication Learning** - Adapts to each user's patterns and triggers over time
4. **Co-Parent Pairing** - Connects two parents in a private communication space
5. **Shared Context** - Contacts, tasks, and children info both parents can access

### Entities

| Entity                   | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| **User**                 | A co-parent with communication profile and learned patterns |
| **Room**                 | Private space between paired co-parents                     |
| **Message**              | Unit of communication, may trigger intervention             |
| **Intervention**         | AI coaching moment (tip + rewrites)                         |
| **CommunicationProfile** | Learned patterns, triggers, voice signature per user        |
| **Contact**              | Shared person (child, teacher, doctor)                      |
| **Task**                 | Shared responsibility with assignment and status            |

### Use Cases

```
User drafts message
    → Mediator analyzes (pre-filters → axiom detection → AI analysis)
    → If hostile: Intervention with tip + 2 rewrites
    → User accepts/edits/ignores
    → Message delivered to room
    → System learns from user's choice

Co-parents pair
    → Invitation sent → Accepted → Room created
    → Contacts and tasks become shared
    → Communication history maintained for accountability
```

### Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN CORE                            │
│  Mediator • CommunicationProfile • Intervention • Message   │
│  (knows nothing about HTTP, WebSocket, or database)         │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    INTERFACE ADAPTERS                        │
│  socketHandlers/* • routes/* • roomManager • dbSafe         │
│  (translate between domain and infrastructure)              │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    INFRASTRUCTURE                            │
│  Express • Socket.io • PostgreSQL • OpenAI • Neo4j          │
│  (delivery mechanisms and external services)                │
└─────────────────────────────────────────────────────────────┘
```

### Implementation (Deferred Details)

| Concern     | Current Choice   | Could Be Swapped         |
| ----------- | ---------------- | ------------------------ |
| Delivery    | Socket.io + REST | WebSocket, SSE, GraphQL  |
| Persistence | PostgreSQL       | Any SQL, MongoDB         |
| AI Provider | OpenAI           | Anthropic, local LLM     |
| Graph       | Neo4j            | PostgreSQL JSONB, Dgraph |
| Frontend    | React            | Vue, Svelte, native apps |

**Directory mapping:**

- Domain core: `chat-server/src/liaizen/`
- Interface adapters: `chat-server/routes/`, `chat-server/socketHandlers/`
- Infrastructure: `chat-server/server.js`, `chat-server/dbSafe.js`
- Delivery: `chat-client-vite/`

## Essential Commands

### Development

```bash
# Start all services (frontend + backend)
npm run dev

# Frontend only (port 5173)
cd chat-client-vite && npm run dev

# Backend only (port 3000)
cd chat-server && node server.js

## ⚠️ CRITICAL: Verification Before Configuration Changes

**When reviewing or changing configuration values (ports, URLs, etc.):**

1. **ALWAYS verify actual state first:**
   ```bash
   # Check actual .env files (source of truth)
   cat chat-server/.env | grep PORT
   cat chat-client-vite/.env | grep VITE_API_URL
   
   # Check what scripts actually use
   grep "BACKEND_PORT\|PORT" scripts/dev.mjs
   
   # Check config files
   grep "DEFAULT.*PORT" chat-server/config.js
   ```

2. **If documentation and code conflict:**
   - ❌ DON'T assume documentation is wrong
   - ❌ DON'T assume code is wrong
   - ✅ **ASK THE USER** which is correct
   - ✅ Check git history to understand why

3. **Rule: Code > Documentation**
   - Running code is always the source of truth
   - Documentation can be outdated
   - When they conflict, code wins

4. **Test assumptions:**
   - Never change based on assumptions
   - Always verify against actual .env files
   - Check what scripts actually use

**See `docs/VERIFICATION_PROCESS.md` for detailed verification checklist.**

# Restart services
npm run restart
```

### Testing

```bash
# Backend tests (Jest, 60% coverage threshold)
cd chat-server && npm test
npm run test:coverage

# Run specific test
cd chat-server && npm test -- auth.routes.test.js
```

### Code Quality

```bash
# Lint and auto-fix
npm run lint:fix

# Backend-specific
cd chat-server
npm run db:validate          # Validate PostgreSQL schema
npm run prompts:lint         # Validate AI mediation prompts
npm run ai:test              # AI regression tests
npm run validate:naming      # Check naming conventions
npm run scan:all             # Duplication + dependency analysis
```

### Database Migrations

```bash
cd chat-server
npm run migrate              # Run pending migrations
npm run start:with-migrate   # Migrate then start server
```

## AI Mediation Constitution

**Full spec**: `chat-server/ai-mediation-constitution.md`

**Key rules**: Language not emotions • No psychological labels • 1-2-3 framework (address + tip + 2 rewrites) • Use "you/your" only

## Design System

**Full spec**: `.cursorrules`, `prompts/design_system.md`, `prompts/design_critic.md`

**Key tokens**: `bg-teal-dark`, `bg-teal-medium`, `bg-teal-light` • 8px spacing unit • 44px touch targets • z-nav (50), z-modal (100)

## Key Patterns

### Socket Events (Real-time)

Client events: `send_message`, `join_room`, `typing`
Server events: `new_message`, `ai_intervention`, `room_update`

### AI Mediation Flow

1. User drafts message → `send_message` event
2. Backend runs through mediator pipeline (pre-filters, axiom detection, AI analysis)
3. If flagged → `ai_intervention` with tip + 2 rewrites
4. User accepts rewrite or edits → message broadcasts to room

### Authentication

- JWT tokens stored in localStorage
- Refresh via httpOnly cookies
- Google OAuth callback at `/auth/google/callback`

### 🔒 SEALED AUTH FILES - DO NOT MODIFY

**⚠️ CRITICAL: The authentication flow is SEALED and SET IN STONE.**

**DO NOT modify these files without explicit approval:**
- `chat-client-vite/src/context/AuthContext.jsx` - FSM state management (SEALED)
- `chat-client-vite/src/utils/tokenManager.js` - Token storage (single source of truth)
- `chat-client-vite/src/utils/authQueries.js` - API command functions (CQS pattern)
- `chat-client-vite/src/utils/validators.js` - Validation logic (must match server)
- `chat-client-vite/src/features/auth/model/useAuth.js` - Auth hook interface
- `chat-client-vite/src/features/auth/model/useAuthRedirect.js` - Redirect logic

**Rules for AI assistants:**
1. ❌ **NEVER modify** authentication state management logic
2. ❌ **NEVER change** token storage patterns
3. ❌ **NEVER alter** FSM (Finite State Machine) auth status flow
4. ❌ **NEVER modify** validation logic without coordinating with backend
5. ❌ **NEVER change** API request/response contracts without backend coordination
6. ✅ **CAN modify** UI/styling in `LoginSignup.jsx` (presentation layer)
7. ✅ **CAN modify** error messages (user-facing text only)

**Before modifying ANY auth file:**
- Check `docs/AUTH_FLOW_SEALED.md` for complete guidelines
- Verify if the change breaks API contracts
- Test all state transitions if modifying FSM
- Coordinate with backend team if changing validation

**These files are production-ready, battle-tested, and locked down.**
**See `docs/AUTH_FLOW_SEALED.md` for the full sealing document.**

## Environment Variables

### Backend (`chat-server/.env`)

```
PORT=3000
JWT_SECRET=
OPENAI_API_KEY=
DATABASE_URL=postgresql://...
GMAIL_USER=
GMAIL_APP_PASSWORD=
NEO4J_URI=
NEO4J_USER=
NEO4J_PASSWORD=
```

### Frontend (`chat-client-vite/.env`)

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Deployment

| Service  | Platform           | URL                                 |
| -------- | ------------------ | ----------------------------------- |
| Frontend | Vercel             | coparentliaizen.com                 |
| Backend  | Railway            | demo-production-6dcd.up.railway.app |
| Database | Railway PostgreSQL | (internal)                          |

Auto-deploy on push to `main` branch for both platforms.

### ⚠️ CRITICAL: Vercel Deployment Rules for AI

**When deploying to Vercel, AI assistants MUST follow these rules:**

#### Correct Deployment Target
- **ONLY deploy** `chat-client-vite/` to Vercel project: `chat-client-vite`
- **Project ID**: `prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
- **Vercel URL**: `chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app`

#### NEVER Deploy To
- ❌ `marketing-site` project (separate project for marketing site only)
- ❌ Root directory deployments
- ❌ Any other Vercel project

#### Required Steps Before Deployment

**AI MUST do ALL of these before deploying:**

1. **Validate project configuration:**
   ```bash
   ./scripts/validate-vercel-project.sh
   ```
   - Must show: `Project Name: chat-client-vite`
   - Must show: `Project ID: prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
   - Must pass all validation checks

2. **Verify correct directory:**
   - Must be in `chat-client-vite/` directory
   - ❌ NEVER deploy from project root
   - ❌ NEVER deploy from `marketing-site/` directory

3. **Use safe deployment method:**
   ```bash
   # Method 1: AI wrapper script (RECOMMENDED FOR AI ASSISTANTS)
   ./scripts/ai-deploy.sh
   # This automatically runs validation and deploys safely
   
   # Method 2: Safe script (RECOMMENDED FOR HUMANS)
   ./scripts/deploy-chat-client-vite.sh
   
   # Method 3: npm script (includes validation)
   cd chat-client-vite && npm run deploy
   
   # Method 4: Manual (with validation first)
   cd chat-client-vite
   ../scripts/validate-vercel-project.sh  # REQUIRED
   vercel --prod --yes
   ```

#### If Deployment Validation Fails
- **STOP immediately** - Do not proceed with deployment
- **Report error** to user
- **Fix configuration** before retrying
- **Verify** correct project is linked: `cd chat-client-vite && vercel link`

#### Deployment Checklist for AI
When user asks to deploy, AI MUST:
- [ ] Check if we're deploying to Vercel
- [ ] If yes, verify target is `chat-client-vite` project
- [ ] Run `scripts/validate-vercel-project.sh`
- [ ] Verify we're in `chat-client-vite/` directory
- [ ] Use `scripts/deploy-chat-client-vite.sh` or validated npm script
- [ ] Confirm deployment succeeded
- [ ] Abort if any validation fails

**Reference files:**
- `DEPLOYMENT.md` - Complete deployment guide
- `chat-client-vite/VERCEL_PROJECT_LOCK.md` - Project configuration reference
- `scripts/validate-vercel-project.sh` - Validation script

## SDD Framework

**LiaiZen uses the SDD Agentic Framework** integrated directly with project-specific extensions.

### Framework Architecture

```
.specify/                        ← SDD framework code (integrated)
├── memory/                      ← Constitutional governance
├── scripts/bash/                ← Automation scripts
├── src/sdd/                     ← DS-STAR quality gates (Python)
├── config/                      ← Framework configuration
└── specs/                       ← Feature specifications

.claude/                         ← LiaiZen extensions (this project)
├── agents/                      ← 3 co-parenting domain agents
├── commands/                    ← MCP-integrated command wrappers
└── settings.local.json          ← Project permissions
```

### How It Works

1. **Framework provides** (in `.specify/`): General SDD methodology, constitutional principles, quality gates, automation scripts
2. **LiaiZen adds** (in `.claude/`): Co-parenting domain expertise (product-manager), MCP server integration, domain validation

### Available Commands

**Core SDD Workflow:**

- `/create-prd` - Create Product Requirements Document
- `/specify` - Create feature specification (with LiaiZen MCP context)
- `/plan` - Create implementation plan (with MCP-aware architecture queries)
- `/tasks` - Generate dependency-ordered task list
- `/validate-domain` - **LiaiZen-specific** co-parenting domain validation
- `/create-agent` - Create new specialized agent
- `/create-skill` - Create new skill

**Documentation:**

- SDD Framework: `.specify/` directory
- SDD Agents Reference: `docs/AGENTS.md`
- LiaiZen extensions: `.claude/README.md`

### LiaiZen-Specific Agents

Located in `.claude/agents/`:

- **product-manager** - Product strategy for co-parenting platform
- **ui-designer** - UI/UX design specialist
- **engineering-diagnostic-agent** - Error diagnosis and root cause analysis

For general SDD agent patterns and workflows, refer to `docs/AGENTS.md` and the SDD framework code in `.specify/`.

## Co-Parenting Domain Principles

When working on features, prioritize:

1. **Win/Win Outcomes**: Features should benefit everyone involved's wellbeing
2. **Conflict Reduction**: Improve understanding of both sides
3. **Privacy & Security**: Family data is sensitive (COPPA, GDPR compliant)
4. **Accessibility**: Work for parents with varying technical skills

---

## Code Style & Conventions

### Frontend (React)

```javascript
// Named exports preferred
export function ContactsPanel({ contacts, onSelect }) { ... }

// Hooks for all logic extraction
const { user, login, logout } = useAuth();

// API calls via apiClient.js - never raw fetch
import { apiGet, apiPost } from '../apiClient.js';
const data = await apiGet('/api/contacts');

// Context for shared state (not prop drilling)
<AuthProvider>
  <ChatContext.Provider value={{ room, messages }}>
```

### Backend (Express)

```javascript
// Routes organized by feature in routes/
// Sub-routes in routes/auth/, routes/user/ for complex features

// Modular managers export from index files
const { createPrivateRoom, getUserRoom } = require('./roomManager');

// Async/await with try-catch, errors to middleware
router.post('/endpoint', async (req, res, next) => {
  try { ... } catch (error) { next(error); }
});

// Database queries via dbSafe.js (parameterized)
const { query } = require('./dbSafe');
await query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Naming Conventions

| Type             | Convention                  | Example                            |
| ---------------- | --------------------------- | ---------------------------------- |
| React components | PascalCase                  | `ContactsPanel.jsx`                |
| Hooks            | camelCase with `use` prefix | `useInviteManagement.js`           |
| Backend routes   | kebab-case endpoints        | `/api/auth/forgot-password`        |
| Socket events    | snake_case                  | `send_message`, `ai_intervention`  |
| Database tables  | snake_case                  | `pairing_sessions`, `room_members` |

### Function Naming Standards

**Data Retrieval** - Always use `get*`:

| ✅ Do            | ❌ Don't                              |
| ---------------- | ------------------------------------- |
| `getUserById`    | `fetchUser`, `findUser`, `lookupUser` |
| `getContacts`    | `fetchContacts`, `loadContacts`       |
| `getRoomMembers` | `findRoomMembers`, `queryMembers`     |

**Other Operations**:

| Pattern      | Use Case          | Example                          |
| ------------ | ----------------- | -------------------------------- |
| `get*`       | Retrieve data     | `getUserById`, `getActiveRoom`   |
| `create*`    | Create new entity | `createUser`, `createInvitation` |
| `update*`    | Modify existing   | `updateProfile`, `updateTask`    |
| `delete*`    | Remove entity     | `deleteContact`, `deleteMessage` |
| `is*`/`has*` | Boolean checks    | `isAuthenticated`, `hasAccess`   |
| `validate*`  | Validation        | `validateEmail`, `validateToken` |
| `parse*`     | Transform data    | `parseResult`, `parseReactions`  |
| `build*`     | Construct objects | `buildContext`, `buildPrompt`    |
| `handle*`    | Event handlers    | `handleSubmit`, `handleError`    |
| `on*`        | Callbacks         | `onSuccess`, `onClose`           |

**Error Messages** - Use "getting" not "fetching":

```javascript
// ✅ GOOD
console.error('Error getting user:', error);

// ❌ BAD
console.error('Error fetching user:', error);
```

**Comments** - Match function names:

```javascript
// ✅ GOOD
// Get user profile data
const profile = await getUserProfile(userId);

// ❌ BAD
// Fetch user profile data
const profile = await getUserProfile(userId);
```

---

## Key Design Principles

### 1. Sender-First Moderation

AI mediation happens BEFORE messages are sent, not after. The sender sees coaching; the recipient never sees hostile messages.

### 2. Context Providers Stack

```jsx
<ErrorBoundary>
  <AuthProvider>           {/* Auth state, login/logout */}
    <InvitationProvider>   {/* Invitation flow state */}
      <MediatorProvider>   {/* AI mediation state */}
        <BrowserRouter>
```

### 3. Socket + REST Hybrid

- **REST API**: Auth, CRUD operations, initial data fetches
- **Socket.io**: Real-time messages, typing indicators, presence, AI interventions

### 4. Modular Backend Managers

Large features split into manager modules with sub-files:

```
roomManager.js          → Entry point (re-exports)
roomManager/
  ├── room.js           → Core room CRUD
  ├── member.js         → Member management
  ├── contact.js        → Contact syncing
  ├── coParent.js       → Co-parent specific logic
  └── utils.js          → Shared utilities
```

### 5. LiaiZen AI Pipeline

```
Message → Pre-filters → Axiom Detection → AI Analysis → Response Building
              ↓              ↓                 ↓              ↓
         Quick reject   Code-based       OpenAI call    Tip + 2 rewrites
                        hostile detect
```

### 6. Single Responsibility by Actor

Code should be separated by **who requests changes**, not just "what it does."

| Actor                | Their Concerns                                    | Code They "Own"                                     |
| -------------------- | ------------------------------------------------- | --------------------------------------------------- |
| **Product/UX**       | UI flows, presentation, user experience           | `components/`, `views/`, `hooks/`                   |
| **AI/Coaching Team** | What's hostile, intervention tone, coaching rules | `src/liaizen/core/`, `ai-mediation-constitution.md` |
| **Domain Experts**   | Child-centric rules, conflict patterns            | `src/liaizen/policies/`, `src/liaizen/context/`     |
| **Operations**       | Delivery, persistence, monitoring                 | `server.js`, `dbSafe.js`, `sockets.js`              |
| **Compliance**       | Audit trails, data retention, privacy             | `src/liaizen/metrics/`, database migrations         |

**Why this matters:**

- If Product wants a new UI for interventions → only `components/` changes
- If AI team tweaks hostility detection → only `src/liaizen/core/` changes
- If Compliance needs audit logging → only persistence layer changes

**God Objects to avoid:**

```
❌ ChatRoom.jsx that handles auth + chat + contacts + tasks + AI display
❌ Route handlers with validation + business logic + persistence
❌ Socket handlers with embedded domain rules

✅ Extract: useAuth, useChat, useContacts, useTasks (done)
✅ Extract: validation → middleware, business logic → services
✅ Extract: domain rules → src/liaizen/, transport → socketHandlers/
```

---

## Folder Structure Explanation

### Frontend (`chat-client-vite/src/`)

```
components/
  ├── blog/              # SEO content pages (15+ articles)
  ├── chat/              # Chat-specific components
  ├── landing/           # Landing page sections
  ├── profile/           # Profile wizard, settings
  ├── quizzes/           # Interactive quizzes
  ├── showcase/          # UI component demos
  └── ui/                # Reusable UI primitives (Modal, Card)

context/
  ├── AuthContext.jsx    # User auth state + methods
  ├── ChatContext.jsx    # Active room, messages
  ├── MediatorContext.jsx # AI intervention state
  └── InvitationContext.jsx # Invitation flow

hooks/
  ├── useAuth.js         # Auth operations
  ├── useChat.js         # Chat operations
  ├── useChatSocket.js   # Socket connection management
  ├── useContacts.js     # Contact CRUD
  ├── useTasks.js        # Task management
  ├── useInviteManagement.js # Invitation flow logic
  └── usePWA.js          # Service worker, push notifications

views/
  ├── ChatView.jsx       # Main chat interface
  ├── DashboardView.jsx  # Dashboard/home
  └── SettingsView.jsx   # User settings
```

### Backend (`chat-server/`)

```
routes/
  ├── auth.js            # Main auth router
  ├── auth/              # Sub-routes: login, signup, oauth, password
  ├── user.js            # User operations
  ├── user/              # Sub-routes: profile, onboarding
  ├── rooms.js           # Room CRUD
  ├── contacts.js        # Contact management
  ├── invitations.js     # Invitation system
  ├── pairing.js         # Co-parent pairing
  └── ai.js              # AI endpoints

socketHandlers/
  ├── connectionHandler.js  # Connect/disconnect
  ├── messageHandler.js     # Message routing
  ├── aiHelper.js           # AI mediation pipeline
  ├── aiContextHelper.js    # Context enrichment
  ├── feedbackHandler.js    # User feedback on AI
  └── contactHandler.js     # Real-time contact updates

src/liaizen/             # AI mediation system
  ├── core/
  │   ├── mediator.js       # Main orchestrator
  │   ├── client.js         # OpenAI client
  │   ├── codeLayer/        # Axiom-based detection
  │   ├── contexts/         # Context builders
  │   └── response/         # Response processing
  ├── context/
  │   └── communication-profile/  # Per-user learning
  ├── agents/               # Proactive coaching, feedback
  ├── analysis/             # Language analysis
  └── policies/             # Safety rules

libs/
  ├── invitation-manager/   # Invitation validation
  ├── pairing-manager/      # Mutual pairing detection
  └── password-validator.js # Password strength
```

---

## Common Tasks & How-To

### Add a New API Endpoint

```bash
# 1. Create route file or add to existing
chat-server/routes/myfeature.js

# 2. Register in routeManager.js
app.use('/api/myfeature', require('./routes/myfeature'));

# 3. Add auth middleware if needed
router.get('/', authMiddleware, async (req, res) => { ... });
```

### Add a New Socket Event

```javascript
// Backend: socketHandlers/myHandler.js
module.exports = function setupMyHandler(socket, io) {
  socket.on('my_event', async (data) => {
    // Handle event
    socket.emit('my_response', result);
  });
};

// Register in sockets.js
const setupMyHandler = require('./socketHandlers/myHandler');
setupMyHandler(socket, io);

// Frontend: hooks/useChatSocket.js
socket.on('my_response', (data) => { ... });
socket.emit('my_event', payload);
```

### Add a New React Hook

```javascript
// chat-client-vite/src/hooks/useMyFeature.js
import { apiGet, apiPost } from '../apiClient.js';

export function useMyFeature() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await apiGet('/api/myfeature');
    setData(result);
    setLoading(false);
  };

  return { data, loading, fetchData };
}
```

### Create a Database Migration

```bash
# Create new migration file
chat-server/migrations/020_my_feature.sql

# Run migration
cd chat-server && npm run migrate
```

### Debug Socket Issues

```javascript
// Enable Socket.io debug logging
localStorage.debug = 'socket.io-client:*';

// Check connection in browser console
window.socket.connected; // true/false
window.socket.id; // socket ID
```

### Check Railway Logs

```bash
railway logs --tail
railway logs -n 100  # Last 100 lines
```

---

## Known Pitfalls & Anti-Patterns

### ❌ DON'T: Use raw fetch() in frontend

```javascript
// BAD - loses auth headers, no error tracking
const res = await fetch('/api/contacts');

// GOOD - uses apiClient with auth + analytics
import { apiGet } from '../apiClient.js';
const contacts = await apiGet('/api/contacts');
```

### ❌ DON'T: Hardcode Tailwind colors

```javascript
// BAD - not in design system
<div className="bg-[#275559]">

// GOOD - uses design tokens
<div className="bg-teal-dark">
```

### ❌ DON'T: Create new Context without need

```javascript
// BAD - unnecessary context for local state
const MyContext = createContext();

// GOOD - use existing contexts or local state
const { user } = useAuth(); // From AuthContext
const [localState, setLocalState] = useState();
```

### ❌ DON'T: Skip the mediator for AI features

```javascript
// BAD - direct OpenAI call bypasses safety
const response = await openai.chat.completions.create(...);

// GOOD - use liaizen mediator (has constitution, safety)
const { mediator } = require('./src/liaizen');
const result = await mediator.analyze(message, context);
```

### ❌ DON'T: Use psychological labels in AI responses

```javascript
// BAD - violates AI constitution
'You seem angry and defensive';
'This is manipulative behavior';

// GOOD - describe phrasing mechanics
'This phrasing implies blame';
'This approach may not achieve your goal';
```

### ⚠️ WATCH: Safari localStorage Issues

Safari's ITP can clear localStorage. The codebase uses backup keys:

```javascript
// Token stored in both keys for Safari compatibility
STORAGE_KEYS.AUTH_TOKEN; // Primary
('auth_token_backup'); // Fallback
```

### ⚠️ WATCH: Tailwind v4 PostCSS Plugin

If you see PostCSS errors, the plugin moved:

```javascript
// postcss.config.js - use new package
plugins: {
  '@tailwindcss/postcss': {},  // NOT 'tailwindcss'
  autoprefixer: {},
}
```

### ⚠️ WATCH: Socket Reconnection

Socket.io handles reconnection automatically, but state may be stale. Always re-fetch on reconnect:

```javascript
socket.on('connect', () => {
  // Re-join rooms, re-fetch messages
  socket.emit('join_room', roomId);
});
```
