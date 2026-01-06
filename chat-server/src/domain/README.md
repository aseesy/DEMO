# Domain Model Layer

**Status**: ✅ Phase 1 Complete (Value Objects + Core Entities)

This directory contains first-class domain types for LiaiZen's core domain concepts.

---

## 📋 Current Structure

```
domain/
├── entities/          # Core domain entities ✅
│   ├── User.js       ✅
│   ├── Room.js       ✅
│   ├── Message.js    ✅
│   ├── Task.js       ✅
│   └── Contact.js    ✅
├── valueObjects/     # Typed value objects ✅
│   ├── Email.js      ✅
│   ├── Username.js   ✅
│   ├── RoomId.js     ✅
│   └── MessageId.js  ✅
└── index.js          # Public API ✅
```

---

## 🎯 Goals

1. **Type Safety** - ✅ Value objects provide validation
2. **Encapsulation** - ✅ Business rules in entities
3. **Discoverability** - ✅ Domain concepts obvious in code
4. **Maintainability** - ✅ Single source of truth

---

## 📦 Usage

### Value Objects

```javascript
const { Email, Username, RoomId, MessageId } = require('./src/domain');

// Create validated value objects
const email = new Email('user@example.com');
const username = new Username('alice123');
const roomId = new RoomId('room-123');
const messageId = new MessageId('msg-456');
```

### Entities

```javascript
const { User, Room, Message, Task, Contact } = require('./src/domain');

// Create domain entities
const user = User.fromDatabaseRow(dbRow);
const room = Room.fromApiData(apiData);
const message = Message.fromDatabaseRow(dbRow);

// Use entity methods
if (room.isMember(userId)) {
  // Business logic
}

if (task.isOverdue()) {
  // Handle overdue task
}
```

---

## 🏗️ Entity Features

### User
- Email and username validation via value objects
- Full name calculation
- OAuth detection
- Last login tracking

### Room
- Member management (add/remove)
- Co-parent validation (exactly 2 members)
- Creator checks
- Completion status

### Message
- Content validation
- Type checking (system, AI intervention)
- Mediation tracking
- Thread support

### Task
- Status validation (open, completed, cancelled)
- Priority validation (low, medium, high)
- Overdue detection
- Completion tracking

### Contact
- Name validation
- Relationship tracking
- Contact info validation (email/phone)

---

## 🔄 Migration Path

Entities can be gradually adopted:

1. **Start with new code**: Use entities in new features
2. **Refactor services**: Update services to use entities
3. **Update repositories**: Return entities instead of plain objects
4. **Update API layer**: Convert entities to DTOs at boundaries

---

## 📖 See Also

- `/DOMAIN_MODEL_PROPOSAL.md` - Full proposal document
- `/CODEBASE_SCAN_RECOMMENDATIONS.md` - Codebase analysis
- `/docs/deployment/DOMAIN_MODEL_USAGE_GUIDE.md` - Usage guide

---

## ✅ Completed

- ✅ Value Objects (Email, Username, RoomId, MessageId)
- ✅ Core Entities (User, Room, Message, Task, Contact)
- ✅ Business rules encapsulated in entities
- ✅ Immutability enforced
- ✅ Factory methods (fromDatabaseRow, fromApiData)
- ✅ Type validation

## 🚧 Future Enhancements

- [ ] CommunicationProfile entity
- [ ] Intervention entity
- [ ] Child entity (if needed separately from Contact)
- [ ] Repository interfaces in domain layer
- [ ] Domain events
