# Domain Model Implementation Plan

**Date**: 2025-01-27  
**Status**: Ready to Start  
**Estimated Duration**: 6 weeks (gradual migration)

---

## 🎯 Overview

This plan outlines the step-by-step implementation of first-class domain types for LiaiZen. The migration will be **gradual** and **backward-compatible** to avoid disrupting existing functionality.

---

## 📅 Phase 1: Foundation - Value Objects (Week 1)

### **Goal**

Create typed value objects for primitive domain concepts.

### **Tasks**

1. ✅ Create `src/domain/` directory structure
2. ⏳ Implement `Email` value object
3. ⏳ Implement `Username` value object
4. ⏳ Implement `RoomId` value object
5. ⏳ Implement `MessageId` value object
6. ⏳ Write tests for all value objects
7. ⏳ Document usage patterns

### **Success Criteria**

- ✅ All value objects implemented
- ✅ Tests passing (100% coverage)
- ✅ No breaking changes to existing code
- ✅ Documentation complete

### **Files to Create**

```
src/domain/
├── valueObjects/
│   ├── Email.js
│   ├── Username.js
│   ├── RoomId.js
│   ├── MessageId.js
│   ├── __tests__/
│   │   ├── Email.test.js
│   │   ├── Username.test.js
│   │   ├── RoomId.test.js
│   │   └── MessageId.test.js
│   └── index.js
└── README.md
```

### **Example Usage**

```javascript
// Before
const username = 'alice';
const email = 'alice@example.com';

// After
const username = new Username('alice');
const email = new Email('alice@example.com');
```

---

## 📅 Phase 2: Core Entities - User, Message, Room (Week 2-3)

### **Goal**

Implement the three most critical domain entities.

### **Tasks**

1. ⏳ Implement `User` entity
2. ⏳ Implement `Message` entity
3. ⏳ Implement `Room` entity
4. ⏳ Create factory methods (`fromDbRow`, `toDbRow`)
5. ⏳ Add domain validation methods
6. ⏳ Write tests for entities
7. ⏳ Create migration utilities

### **Success Criteria**

- ✅ Core entities implemented
- ✅ Factory methods working
- ✅ Domain validation in place
- ✅ Tests passing
- ✅ Can use alongside existing code

### **Files to Create**

```
src/domain/
├── entities/
│   ├── User.js
│   ├── Message.js
│   ├── Room.js
│   ├── __tests__/
│   │   ├── User.test.js
│   │   ├── Message.test.js
│   │   └── Room.test.js
│   └── index.js
```

### **Example Usage**

```javascript
// Create from database row
const user = User.fromDbRow(dbRow);

// Use domain methods
if (user.canAccessRoom(room)) {
  // ...
}

// Convert back to database format
const dbRow = user.toDbRow();
```

---

## 📅 Phase 3: Business Logic Migration (Week 4)

### **Goal**

Move business rules from service functions into entity methods.

### **Tasks**

1. ⏳ Identify business rules in service functions
2. ⏳ Move rules to entity methods
3. ⏳ Update service functions to use entities
4. ⏳ Refactor `server.js` message handling
5. ⏳ Refactor room access checks
6. ⏳ Update tests

### **Success Criteria**

- ✅ Business rules in entities
- ✅ Service functions refactored
- ✅ All tests passing
- ✅ 50% of code uses domain classes

### **Example Migration**

**Before:**

```javascript
// server.js
function canUserEditMessage(user, message) {
  return user.username === message.username && Date.now() - message.timestamp < 5 * 60 * 1000;
}
```

**After:**

```javascript
// Message.js
canBeEditedBy(user) {
  if (this.sender.value !== user.username.value) {
    return false;
  }
  const fiveMinutes = 5 * 60 * 1000;
  const timeSinceSent = Date.now() - this.timestamp.getTime();
  return timeSinceSent < fiveMinutes;
}

// server.js
if (message.canBeEditedBy(user)) {
  // ...
}
```

---

## 📅 Phase 4: Remaining Entities (Week 5)

### **Goal**

Implement remaining domain entities.

### **Tasks**

1. ⏳ Implement `Task` entity
2. ⏳ Implement `Contact` entity
3. ⏳ Implement `Child` entity
4. ⏳ Implement `CommunicationProfile` entity
5. ⏳ Implement `Intervention` entity
6. ⏳ Add relationship methods
7. ⏳ Write tests

### **Success Criteria**

- ✅ All entities implemented
- ✅ Relationship methods working
- ✅ Tests passing
- ✅ 80% of code uses domain classes

---

## 📅 Phase 5: Repository Pattern (Week 6)

### **Goal**

Abstract data access with repository pattern.

### **Tasks**

1. ⏳ Create repository interfaces
2. ⏳ Implement `UserRepository`
3. ⏳ Implement `RoomRepository`
4. ⏳ Implement `MessageRepository`
5. ⏳ Update service functions to use repositories
6. ⏳ Complete migration

### **Success Criteria**

- ✅ Repository pattern in place
- ✅ Data access abstracted
- ✅ 100% of new code uses domain classes
- ✅ Documentation complete

### **Example Usage**

```javascript
// Before
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];

// After
const user = await userRepository.findById(userId);
```

---

## 🔄 Migration Strategy

### **Principle: Gradual & Backward Compatible**

1. **Add, Don't Replace** - New code uses domain classes, old code still works
2. **Factory Methods** - Easy conversion between DB rows and entities
3. **Incremental Refactoring** - One module at a time
4. **Test Coverage** - Maintain 100% test coverage during migration

### **Migration Pattern**

```javascript
// Step 1: Add domain class (no breaking changes)
class User { ... }

// Step 2: Use in new code
const user = User.fromDbRow(dbRow);

// Step 3: Gradually refactor existing code
// Old: const user = dbRow;
// New: const user = User.fromDbRow(dbRow);

// Step 4: Remove old patterns (after all code migrated)
```

---

## 📊 Progress Tracking

### **Phase 1: Foundation**

- [ ] Directory structure created
- [ ] Email value object
- [ ] Username value object
- [ ] RoomId value object
- [ ] MessageId value object
- [ ] Tests written
- [ ] Documentation complete

### **Phase 2: Core Entities**

- [ ] User entity
- [ ] Message entity
- [ ] Room entity
- [ ] Factory methods
- [ ] Domain validation
- [ ] Tests written

### **Phase 3: Business Logic**

- [ ] Business rules identified
- [ ] Rules moved to entities
- [ ] Service functions refactored
- [ ] Tests updated

### **Phase 4: Remaining Entities**

- [ ] Task entity
- [ ] Contact entity
- [ ] Child entity
- [ ] CommunicationProfile entity
- [ ] Intervention entity
- [ ] Tests written

### **Phase 5: Repository Pattern**

- [ ] Repository interfaces
- [ ] UserRepository
- [ ] RoomRepository
- [ ] MessageRepository
- [ ] Migration complete

---

## 🎯 Success Metrics

### **Code Quality**

- ✅ 100% test coverage for domain classes
- ✅ All business rules in entities
- ✅ No plain objects for domain concepts
- ✅ Type safety throughout

### **Developer Experience**

- ✅ Domain concepts obvious in code
- ✅ Easy to find business rules
- ✅ Self-documenting code
- ✅ Reduced cognitive load

### **Maintainability**

- ✅ Single source of truth for entities
- ✅ Easy to change domain rules
- ✅ Clear separation of concerns
- ✅ Better code organization

---

## 📚 Resources

- **Domain-Driven Design** - Eric Evans
- **Anemic Domain Model** - Martin Fowler
- **Value Objects Pattern** - DDD
- **Repository Pattern** - DDD

---

**Status**: Ready to Start  
**Next Action**: Begin Phase 1 - Implement value objects
