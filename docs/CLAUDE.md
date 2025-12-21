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

### LiaiZen AI System (`chat-server/src/liaizen/`)

The LiaiZen namespace contains the complete AI mediation intelligence system:

- **Core** (`core/`): Main mediation pipeline and AI client
- **Agents** (`agents/`): Specialized AI agents (proactive coaching, feedback learning)
- **Policies** (`policies/`): Constitution rules and safety controls
- **Context** (`context/`): Communication profiles and user context
- **Analysis** (`analysis/`): Language analysis and rewrite validation
- **Intelligence** (`intelligence/`): Contact detection
- **Metrics** (`metrics/`): Communication statistics

**Import examples:**

- `const { mediator } = require('./src/liaizen')` - Main mediation system
- `const { proactiveCoach } = require('./src/liaizen')` - Pre-send coaching
- `const { languageAnalyzer } = require('./src/liaizen')` - Language analysis

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

## AI Mediation Constitution

**Location**: `chat-server/ai-mediation-constitution.md`

All AI-powered mediation in LiaiZen MUST follow the constitution. Key rules:

### Core Immutable Principles

1. **Language, Not Emotions**: Talk about phrasing, not emotional states
   - CORRECT: "This phrasing implies blame"
   - PROHIBITED: "You're angry", "You're frustrated"

2. **No Diagnostics**: Never apply psychological labels
   - PROHIBITED: narcissist, manipulative, insecure, gaslighting, toxic
   - ALLOWED: "This approach may backfire", "This phrasing might not achieve your goal"

3. **Child-Centric When Applicable**: Frame feedback around child wellbeing when children are mentioned

### 1-2-3 Coaching Framework

Every AI intervention MUST include:

1. **ADDRESS**: Describe what the phrasing is doing (mechanics, not emotions)
2. **ONE TIP**: Single adjustment, max 10 words, specific to this message
3. **TWO REWRITES**: Complete alternatives using different approaches

### Voice Rules

- Use only "you/your" - NEVER "we/us/our/both"
- Communication coach, not therapist
- Describe phrasing mechanics, not feelings

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

## Available Agents

The following specialized agents are available for specific tasks:

### product-manager (product)

**Purpose**: Product Manager who deeply understands co-parents challenges and how to solve them. Expert in user insight and empathy for complex human contexts, product strategy and roadmapping, AI-native product thinking, cross-functional leadership, systems thinking and requirements clarity, design sensibility, data-informed decision-making, and conflict navigation.

**Core Capabilities**:

- **Deep User Insight**: Understanding co-parenting dynamics, conflict patterns, emotional safety principles, user psychology under stress
- **Product Strategy**: Vision to strategy translation, hard prioritization decisions, roadmap creation, OKR definition
- **AI-Native Thinking**: LLM capabilities/limitations, sender-first moderation design, multi-agent orchestration, bias monitoring
- **Cross-Functional Leadership**: Engineering communication, design collaboration, marketing alignment, support synthesis
- **Systems Thinking**: PRD excellence, edge case identification, user story precision, dependency mapping
- **Design Sensibility**: UX quality assessment, friction identification, calm/dignity principles
- **Data-Informed Decisions**: Hypothesis creation, success metrics, experiment design, analytics interpretation
- **Conflict Navigation**: Internal mediation, diplomatic feedback, decision documentation

**Brand Values Protected**: Dignity, Calm, Precision, Fairness, Neutrality, Respect

**Usage**: `Use the product-manager agent to...`

**Triggers**: Product strategy, user research, PRD review, feature prioritization, roadmap planning, stakeholder alignment, user persona development, AI feature design

**Tools**: Read, Grep, Glob, WebFetch, WebSearch, AskUserQuestion, TodoWrite

**Memory**: `.docs/agents/product/product-manager/`

---

### ui-designer (product)

**Purpose**: Senior UI Designer and Design System Steward. Calm, confident, minimalist personality with refined visual sensitivity. Output is decisive, elegant, succinct.

**Philosophy**: "Beauty emerges from restraint + clarity + consistency."

**Operating Modes**:

- **System Executor (default)**: Applies existing design tokens, components, spacing, and typography without deviation
- **Design Evolution**: Proposes system-level changes only with explicit approval using "Recommendation: [change]. Approve?" format

**Vague Direction Interpretation**:

- "Friendlier buttons" -> larger radius, generous padding, softer shadows
- "More premium feel" -> less color, more whitespace, refined weights
- "More calm" -> reduced saturation, wider spacing, quieter typography

**Memory**: Remembers approved decisions, rejected suggestions, user preferences, and brand tone

**Canonical Requirements**: Uses design tokens, official component library, type scale, spacing scale, grid, brand palette, shadow radii, and iconography exclusively

**Forbidden**: Introducing new colors without approval, changing typography stack, redefining tokens, non-system CSS, random shadows, copying external patterns, freestyle styling, excessive questions

**Usage**: `Use the ui-designer agent to...`

**Triggers**: UI design, component styling, design system, visual design, typography, spacing, color palette, button styles, card layouts, design tokens

**Tools**: Read, Write, Edit, Grep, Glob, TodoWrite

**Memory**: `.docs/agents/product/ui-designer/`

---

_For coparentliaizen.com - Better Co-Parenting Through Better Communication_
