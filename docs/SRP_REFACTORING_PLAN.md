# SRP Refactoring Plan

## Overview

This plan addresses Single Responsibility Principle violations identified in the chat-server backend. The goal is to separate code by **actor** (who requests changes) rather than just by function.

**Actors:**

- Product/UX → UI, presentation
- AI/Coaching Team → Mediation logic, hostility detection
- Domain Experts → Child-centric rules, conflict patterns
- Operations → Delivery, persistence, monitoring
- Compliance → Audit trails, data retention

---

## Phase 1: Service Layer Foundation

**Goal:** Create the service directory structure and base patterns before extracting code.

### Step 1.1: Create Directory Structure

```bash
mkdir -p chat-server/src/services/{connection,pairing,room,message,profile,task,admin,email}
```

### Step 1.2: Create Base Service Pattern

```javascript
// chat-server/src/services/baseService.js
class BaseService {
  constructor(db) {
    this.db = db;
  }

  async query(sql, params) {
    return this.db.query(sql, params);
  }
}

module.exports = { BaseService };
```

### Step 1.3: Create Service Index

```javascript
// chat-server/src/services/index.js
module.exports = {
  // Will export all services as they're created
};
```

**Estimated effort:** 1 hour

---

## Phase 2: High-Priority Route Extractions

### 2.1: Extract `routes/admin.js` (767 lines → 3 services)

**Current state:** Debug + stats + cleanup all mixed

**Extract to:**

| New File                              | Responsibility       | Methods                                                                              |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `services/admin/debugService.js`      | Debug data retrieval | `getUsers()`, `getRooms()`, `getTasks()`, `getMessages()`, `getPendingConnections()` |
| `services/admin/statisticsService.js` | Stats calculation    | `getUserCount()`, `getMessageStats()`, `getRoomStats()`                              |
| `services/admin/cleanupService.js`    | Data cleanup         | `deleteOrphanedData()`, `cleanupExpiredTokens()`                                     |

**Refactored route:**

```javascript
// routes/admin.js (after)
const { debugService, statisticsService, cleanupService } = require('../src/services/admin');

router.get('/debug/users', async (req, res) => {
  const users = await debugService.getUsers();
  res.json(users);
});

router.get('/stats/user-count', async (req, res) => {
  const count = await statisticsService.getUserCount();
  res.json({ count });
});

router.post('/cleanup/orphaned', async (req, res) => {
  const result = await cleanupService.deleteOrphanedData();
  res.json(result);
});
```

**Estimated effort:** 3 hours

---

### 2.2: Extract `routes/invitations.js` (507 lines → 2 services)

**Current state:** Token validation + email sending + state management mixed

**Extract to:**

| New File                                        | Responsibility       | Methods                                                                         |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `services/invitation/invitationService.js`      | Invitation lifecycle | `create()`, `validate()`, `accept()`, `reject()`, `getByToken()`, `getByCode()` |
| `services/invitation/invitationEmailService.js` | Email coordination   | `sendInvitation()`, `sendReminder()`, `sendAcceptedNotification()`              |

**Key extraction:**

```javascript
// services/invitation/invitationService.js
class InvitationService extends BaseService {
  async create(inviterId, inviteeEmail, type) {
    const token = this.generateToken();
    const shortCode = this.generateShortCode();

    await this.query(
      'INSERT INTO invitations (inviter_id, invitee_email, token, short_code, type, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [inviterId, inviteeEmail, token, shortCode, type, 'pending']
    );

    return { token, shortCode };
  }

  async validate(token) {
    const invitation = await this.query(
      'SELECT * FROM invitations WHERE token = $1 AND status = $2',
      [token, 'pending']
    );

    if (!invitation) throw new InvalidTokenError();
    if (this.isExpired(invitation)) throw new ExpiredTokenError();

    return invitation;
  }

  // ... other methods
}
```

**Estimated effort:** 4 hours

---

### 2.3: Extract `routes/rooms.js` (414 lines → 3 services)

**Current state:** Room CRUD + contact backfill + invite codes mixed

**Extract to:**

| New File                                  | Responsibility | Methods                                                |
| ----------------------------------------- | -------------- | ------------------------------------------------------ |
| `services/room/roomService.js`            | Room CRUD      | `create()`, `get()`, `getSharedRoom()`, `getMembers()` |
| `services/room/contactBackfillService.js` | Contact sync   | `backfillContacts()`, `syncRoomContacts()`             |
| `services/room/inviteCodeService.js`      | Invite codes   | `generate()`, `validate()`, `consume()`                |

**Estimated effort:** 3 hours

---

### 2.4: Extract `routes/profile.js` (387 lines → 3 services)

**Current state:** Dynamic schema + calculations + privacy mixed

**Extract to:**

| New File                                       | Responsibility     | Methods                                                  |
| ---------------------------------------------- | ------------------ | -------------------------------------------------------- |
| `services/profile/profileService.js`           | Profile CRUD       | `get()`, `update()`, `getColumns()`                      |
| `services/profile/profileCompletionService.js` | Completion metrics | `calculateCompletion()`, `getMissingFields()`            |
| `services/profile/privacyService.js`           | Privacy settings   | `getSettings()`, `updateSettings()`, `checkVisibility()` |

**Estimated effort:** 3 hours

---

### 2.5: Extract `routes/tasks.js` (342 lines → 3 services)

**Current state:** Task CRUD + onboarding + search mixed

**Extract to:**

| New File                                 | Responsibility        | Methods                                            |
| ---------------------------------------- | --------------------- | -------------------------------------------------- |
| `services/task/taskService.js`           | Task CRUD             | `create()`, `update()`, `delete()`, `getByRoom()`  |
| `services/task/taskSearchService.js`     | Search/filter         | `search()`, `filter()`, `getOverdue()`             |
| `services/task/onboardingTaskService.js` | Onboarding automation | `createWelcomeTasks()`, `autoCompleteOnboarding()` |

**Estimated effort:** 2 hours

---

### 2.6: Extract `routes/pairing.js` (344 lines → 2 services)

**Current state:** Multiple pairing types + mutual detection mixed

**Extract to:**

| New File                                   | Responsibility   | Methods                                                  |
| ------------------------------------------ | ---------------- | -------------------------------------------------------- |
| `services/pairing/pairingService.js`       | Pairing creation | `createByEmail()`, `createByLink()`, `createByCode()`    |
| `services/pairing/mutualPairingService.js` | Mutual detection | `detectMutual()`, `completePairing()`, `provisionRoom()` |

**Estimated effort:** 3 hours

---

## Phase 3: Socket Handler Extractions

**Goal:** Make socket handlers pure event dispatchers that delegate to services.

### 3.1: Extract `socketHandlers/connectionHandler.js` (203 lines)

**Current state:** Room resolution + history + members + contacts

**Extract to:**

| New File                                            | Responsibility                               |
| --------------------------------------------------- | -------------------------------------------- |
| `services/room/roomJoinService.js`                  | `resolveUserRoom()`, `joinRoom()`            |
| `services/message/messageHistoryService.js`         | `getRecentMessages()`, `loadOlderMessages()` |
| `services/connection/duplicateConnectionService.js` | `detectDuplicate()`, `handleDuplicate()`     |

**Refactored handler:**

```javascript
// socketHandlers/connectionHandler.js (after)
const { roomJoinService } = require('../src/services/room');
const { messageHistoryService } = require('../src/services/message');

module.exports = function (socket, io) {
  socket.on('join', async data => {
    try {
      const room = await roomJoinService.resolveUserRoom(data.userId);
      const messages = await messageHistoryService.getRecent(room.id, 50);

      socket.join(room.id);
      socket.emit('room_joined', { room, messages });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
```

**Estimated effort:** 2 hours

---

### 3.2: Extract `socketHandlers/messageHandler.js` (201 lines)

**Current state:** Validation + AI + persistence + editing

**Extract to:**

| New File                                        | Responsibility                   |
| ----------------------------------------------- | -------------------------------- |
| `services/message/messageValidator.js`          | `validate()`, `sanitize()`       |
| `services/message/messagePersistenceService.js` | `save()`, `update()`, `delete()` |

**Note:** AI mediation already in `src/liaizen/` - just needs cleaner integration.

**Estimated effort:** 2 hours

---

### 3.3: Extract `socketHandlers/navigationHandler.js` (165 lines)

**Current state:** Load older + search + jump mixed with DB queries

**Extract to:**

| New File                                       | Responsibility                   |
| ---------------------------------------------- | -------------------------------- |
| `services/message/messageNavigationService.js` | `loadOlder()`, `jumpToMessage()` |
| `services/message/messageSearchService.js`     | `search()`, `searchByKeyword()`  |

**Estimated effort:** 1.5 hours

---

### 3.4: Consolidate AI Handlers (3 files → 1 orchestrator)

**Current:** `aiHelper.js` + `aiContextHelper.js` + `aiActionHelper.js`

**Consolidate to:**

```javascript
// socketHandlers/aiMediationHandler.js
const { mediator } = require('../src/liaizen');

module.exports = function (socket, io) {
  socket.on('analyze_message', async data => {
    const result = await mediator.analyze(data.message, data.context);
    socket.emit('analysis_result', result);
  });
};
```

**Move logic to:** `src/liaizen/core/` (where it belongs by actor)

**Estimated effort:** 2 hours

---

## Phase 4: Libs Consolidation

### 4.1: Refactor `libs/pairing-manager/` (1161 lines total)

**Current files:**

- `pairingValidator.js` (623 lines) - validation + contacts + state
- `pairingCreator.js` (538 lines) - creation + detection + rooms

**Refactor to:**

| New File                    | Responsibility        | Lines (est.) |
| --------------------------- | --------------------- | ------------ |
| `pairingTokenValidator.js`  | Token validation only | ~80          |
| `pairingCodeValidator.js`   | Code validation only  | ~60          |
| `pairingStateManager.js`    | State transitions     | ~100         |
| `pairingCreator.js`         | Creation only         | ~120         |
| `mutualPairingDetector.js`  | Detection only        | ~80          |
| `pairingRoomProvisioner.js` | Room creation         | ~100         |

**Estimated effort:** 4 hours

---

### 4.2: Refactor `connectionManager.js` (404 lines)

**Extract to:**

| New File                                          | Responsibility              |
| ------------------------------------------------- | --------------------------- |
| `services/connection/connectionTokenService.js`   | Token generation/validation |
| `services/connection/pendingConnectionService.js` | Pending connection CRUD     |
| `services/connection/coParentContactService.js`   | Contact creation            |

**Estimated effort:** 3 hours

---

## Phase 5: DRY Up Duplicates

### 5.1: Email Validation (appears in 3+ files)

**Create:**

```javascript
// src/utils/emailValidator.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

module.exports = { validateEmail, normalizeEmail };
```

**Replace in:** `connectionManager.js`, `connections.js`, `invitations.js`

**Estimated effort:** 1 hour

---

### 5.2: Room Member Detection (appears in 3+ files)

**Create:**

```javascript
// services/room/roomMembershipService.js
class RoomMembershipService extends BaseService {
  async isMember(userId, roomId) { ... }
  async getMembers(roomId) { ... }
  async addMember(userId, roomId) { ... }
  async removeMember(userId, roomId) { ... }
}
```

**Replace in:** `connectionHandler.js`, `rooms.js`, `roomManager/`

**Estimated effort:** 2 hours

---

### 5.3: Message History Queries (duplicated in multiple handlers)

**Create:**

```javascript
// services/message/messageHistoryService.js
class MessageHistoryService extends BaseService {
  async getRecent(roomId, limit = 50) { ... }
  async getOlder(roomId, beforeId, limit = 50) { ... }
  async getAround(roomId, messageId, context = 10) { ... }
}
```

**Replace in:** `connectionHandler.js`, `navigationHandler.js`

**Estimated effort:** 1.5 hours

---

## Execution Timeline

| Phase                        | Effort  | Priority | Dependencies |
| ---------------------------- | ------- | -------- | ------------ |
| Phase 1: Foundation          | 1 hr    | P0       | None         |
| Phase 2.1: admin.js          | 3 hrs   | P1       | Phase 1      |
| Phase 2.2: invitations.js    | 4 hrs   | P1       | Phase 1      |
| Phase 2.3: rooms.js          | 3 hrs   | P1       | Phase 1      |
| Phase 2.4: profile.js        | 3 hrs   | P2       | Phase 1      |
| Phase 2.5: tasks.js          | 2 hrs   | P2       | Phase 1      |
| Phase 2.6: pairing.js        | 3 hrs   | P1       | Phase 1      |
| Phase 3.1: connectionHandler | 2 hrs   | P1       | Phase 2.3    |
| Phase 3.2: messageHandler    | 2 hrs   | P2       | Phase 1      |
| Phase 3.3: navigationHandler | 1.5 hrs | P2       | Phase 1      |
| Phase 3.4: AI handlers       | 2 hrs   | P2       | Phase 1      |
| Phase 4.1: pairing-manager   | 4 hrs   | P1       | Phase 2.6    |
| Phase 4.2: connectionManager | 3 hrs   | P1       | Phase 1      |
| Phase 5: DRY duplicates      | 4.5 hrs | P2       | Phases 2-4   |

**Total estimated effort:** ~38 hours

---

## Testing Strategy

### Unit Tests for Each Service

```javascript
// services/invitation/__tests__/invitationService.test.js
describe('InvitationService', () => {
  describe('create', () => {
    it('generates unique token and short code', async () => { ... });
    it('persists invitation to database', async () => { ... });
    it('throws on duplicate email for same inviter', async () => { ... });
  });

  describe('validate', () => {
    it('returns invitation for valid token', async () => { ... });
    it('throws InvalidTokenError for unknown token', async () => { ... });
    it('throws ExpiredTokenError for expired invitation', async () => { ... });
  });
});
```

### Integration Tests for Routes

```javascript
// routes/__tests__/invitations.test.js
describe('POST /api/invitations', () => {
  it('creates invitation and sends email', async () => {
    // Uses real services, mocked email
  });
});
```

---

## Success Criteria

1. **No route handler > 100 lines**
2. **No socket handler > 50 lines**
3. **Each service has single actor ownership**
4. **No duplicate business logic across files**
5. **All services have unit tests with >80% coverage**
6. **Route handlers only: validate input, call service, format response**
7. **Socket handlers only: parse event, call service, emit result**

---

## Rollback Strategy

Each phase is independent. If issues arise:

1. Services are additive - old code still works
2. Routes/handlers can be reverted individually
3. Feature flags can disable new service paths
4. Database schema unchanged - no migration risk

---

## Next Steps

1. Review and approve this plan
2. Create branch: `refactor/srp-service-layer`
3. Start with Phase 1 (foundation)
4. Complete Phase 2.1 (admin.js) as proof of concept
5. Review results, adjust estimates
6. Continue with remaining phases
