# LiaiZen Development Scripts Implementation Plan

**Status**: Planning Phase  
**Priority**: High Impact → Medium Impact → Nice-to-Have

---

## 🎯 **Phase 1: Critical Foundation (Week 1)**

These scripts provide immediate value and prevent common issues.

### ✅ **1. Database & Data Hygiene**

#### `npm run db:validate`

**Why**: Catches schema drift before it causes production issues  
**Implementation**: Check PostgreSQL schema matches expected structure

#### `npm run reset:data`

**Why**: Safe way to reset dev environment without losing schema  
**Implementation**: Delete user data, keep system tables intact

#### `npm run seed`

**Why**: Consistent baseline for testing mediation flows  
**Implementation**: Seed default communication rules, safety policies

---

### ✅ **2. AI Pipeline Quality**

#### `npm run prompts:lint`

**Why**: Prevents prompt drift that breaks mediation quality  
**Implementation**: Validate LiaiZen 1-2-3 structure, check for banned phrases

#### `npm run ai:test`

**Why**: Regression tests for mediation quality  
**Implementation**: Test toxic message rewrites, safety rule validation

---

### ✅ **3. Developer Productivity**

#### `npm run lint:fix`

**Why**: Catches errors before commit  
**Implementation**: ESLint + Prettier auto-fix

#### `npm run dev:stack`

**Why**: One command to start everything  
**Implementation**: Start API, frontend, WebSocket, PostgreSQL

---

## 🎯 **Phase 2: Quality & Safety (Week 2)**

These ensure LiaiZen maintains high quality as it scales.

### ✅ **4. Safety & Quality Scripts**

#### `npm run safety:check`

**Why**: Ensures safety policies match agent behavior  
**Implementation**: Validate safety policy JSON, check rule mappings

#### `npm run analyze:messages`

**Why**: Prevents language analyzer quality degradation  
**Implementation**: Run sample messages through analyzer, check scores

---

### ✅ **5. API & Backend**

#### `npm run docs:api`

**Why**: Auto-generate API docs from JSDoc  
**Implementation**: Extract JSDoc comments, generate OpenAPI spec

#### `npm run test:contracts`

**Why**: Ensure API contracts don't break  
**Implementation**: Test endpoint shapes, validate request/response schemas

---

## 🎯 **Phase 3: Advanced Features (Week 3+)**

These add polish and advanced capabilities.

### ✅ **6. Frontend/UI Scripts**

#### `npm run tokens:sync`

**Why**: Keep design tokens consistent  
**Implementation**: Sync Tailwind config with design system

#### `npm run audit:a11y`

**Why**: Ensure accessibility for stressed users  
**Implementation**: Run Lighthouse/axe audits

---

### ✅ **7. LiaiZen-Specific Scripts**

#### `npm run context:rebuild`

**Why**: Regenerate user context profiles  
**Implementation**: Rebuild sender/receiver profiles, relationship context

#### `npm run simulate:co-parenting`

**Why**: Test mediation quality at scale  
**Implementation**: Run synthetic co-parent exchanges, measure success rates

---

## 📋 **Implementation Priority Matrix**

| Script                  | Impact | Effort | Priority | Phase |
| ----------------------- | ------ | ------ | -------- | ----- |
| `db:validate`           | High   | Low    | 🔥 P0    | 1     |
| `reset:data`            | High   | Low    | 🔥 P0    | 1     |
| `prompts:lint`          | High   | Medium | 🔥 P0    | 1     |
| `ai:test`               | High   | Medium | 🔥 P0    | 1     |
| `dev:stack`             | High   | Low    | 🔥 P0    | 1     |
| `lint:fix`              | Medium | Low    | ⚡ P1    | 1     |
| `safety:check`          | High   | Medium | ⚡ P1    | 2     |
| `analyze:messages`      | Medium | Medium | ⚡ P1    | 2     |
| `docs:api`              | Medium | Low    | 📝 P2    | 2     |
| `test:contracts`        | Medium | Medium | 📝 P2    | 2     |
| `tokens:sync`           | Low    | Low    | 📝 P2    | 3     |
| `audit:a11y`            | Medium | Low    | 📝 P2    | 3     |
| `context:rebuild`       | Medium | High   | 📝 P2    | 3     |
| `simulate:co-parenting` | High   | High   | 📝 P2    | 3     |

---

## 🚀 **Quick Start: Phase 1 Implementation**

I can implement Phase 1 scripts immediately. They'll provide:

- ✅ Database safety checks
- ✅ AI quality validation
- ✅ Developer productivity boost

**Next Steps:**

1. Implement Phase 1 scripts (5 scripts)
2. Add to `package.json` and `chat-server/package.json`
3. Create script files in `scripts/` directory
4. Document usage in README

Would you like me to:

- ✅ **Implement Phase 1 scripts now** (recommended)
- ✅ **Create all scripts at once** (comprehensive but more work)
- ✅ **Prioritize specific scripts** (tell me which ones you need first)
