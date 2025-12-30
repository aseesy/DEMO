# Domain Model Proposal: First-Class Domain Types

**Date**: 2025-01-27  
**Status**: Proposal  
**Priority**: High (Architectural Improvement)

---

## 📋 Executive Summary

This proposal introduces **first-class domain types** for LiaiZen's core domain concepts. Currently, domain entities exist only as database tables and plain JavaScript objects. This proposal creates a domain model layer with classes/interfaces that encapsulate business logic, validation, and type safety.

**Goal**: Transform anemic domain model into rich domain model with encapsulated business logic.

---

## 🎯 Core Domain Concepts

### **Primary Entities** (Must Have)

1. **User** - Parent/co-parent using the platform
2. **Room** - Private communication space between two co-parents
3. **Message** - Communication between co-parents
4. **Task** - Shared parenting responsibility
5. **Contact** - Shared directory entry
6. **Child** - Child in co-parenting relationship

### **AI/Mediation Concepts** (Should Have)

7. **CommunicationProfile** - User communication patterns
8. **Intervention** - AI mediation action
9. **MediationContext** - Context for AI decisions
10. **RelationshipInsights** - Learned relationship dynamics

### **Value Objects** (Nice to Have)

11. **Email** - Typed email value
12. **Username** - Typed username value
13. **RoomId** - Typed room identifier
14. **MessageId** - Typed message identifier

---

## 📊 Current State Analysis

### **What Exists**

✅ **Database Schema** - Well-defined PostgreSQL tables
✅ **Business Logic** - Implemented in service functions
✅ **JSDoc Types** - Code Layer has typedefs (`ParsedMessage`, etc.)
✅ **Context Modules** - Functional modules for context building

### **What's Missing**

❌ **Domain Classes** - No `User`, `Message`, `Room` classes
❌ **Type Safety** - Plain objects, no compile-time validation
❌ **Encapsulation** - Business rules scattered across functions
❌ **Domain Validation** - Validation in service layer, not entities
❌ **Discoverability** - Domain concepts not obvious in code structure

### **Current Pattern**

```javascript
// Current: Plain objects
const user = { id: 1, username: 'alice', email: 'alice@example.com' };
const message = { id: 'msg-123', text: 'Hello', roomId: 'room-1', username: 'alice' };

// Business logic in service functions
function canUserEditMessage(user, message) {
  return user.username === message.username && Date.now() - message.timestamp < 5 * 60 * 1000;
}
```

---

## 🏗️ Proposed Domain Model Structure

### **Directory Structure**

```
chat-server/src/domain/
├── entities/
│   ├── User.js
│   ├── Room.js
│   ├── Message.js
│   ├── Task.js
│   ├── Contact.js
│   ├── Child.js
│   ├── CommunicationProfile.js
│   ├── Intervention.js
│   └── index.js
├── valueObjects/
│   ├── Email.js
│   ├── Username.js
│   ├── RoomId.js
│   ├── MessageId.js
│   └── index.js
├── repositories/
│   ├── UserRepository.js
│   ├── RoomRepository.js
│   ├── MessageRepository.js
│   └── index.js
└── index.js
```

---

## 📝 Proposed Domain Classes

### **1. User Entity**

```javascript
/**
 * User - Represents a parent/co-parent using the platform
 *
 * Encapsulates:
 * - User identity and authentication
 * - Profile information
 * - Access control rules
 * - Co-parenting relationships
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.username = new Username(data.username);
    this.email = new Email(data.email);
    this.displayName = data.display_name || data.displayName;
    this.createdAt = new Date(data.created_at || data.createdAt);
    this.lastLogin = data.last_login ? new Date(data.last_login) : null;
    this.accessTier = data.access_tier || 'free';
  }

  /**
   * Check if user can access a room
   */
  canAccessRoom(room) {
    return room.isMember(this);
  }

  /**
   * Check if user is co-parent of another user
   */
  isCoParentOf(otherUser) {
    // Business logic: check if they share a room
    // This would need room context
    return false; // Placeholder
  }

  /**
   * Validate user data
   */
  static validate(data) {
    if (!data.username || data.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!data.email || !Email.isValid(data.email)) {
      throw new Error('Invalid email address');
    }
    return true;
  }

  /**
   * Create from database row
   */
  static fromDbRow(row) {
    return new User({
      id: row.id,
      username: row.username,
      email: row.email,
      display_name: row.display_name,
      created_at: row.created_at,
      last_login: row.last_login,
      access_tier: row.access_tier,
    });
  }

  /**
   * Convert to database format
   */
  toDbRow() {
    return {
      id: this.id,
      username: this.username.value,
      email: this.email.value,
      display_name: this.displayName,
      created_at: this.createdAt.toISOString(),
      last_login: this.lastLogin?.toISOString(),
      access_tier: this.accessTier,
    };
  }
}
```

### **2. Message Entity**

```javascript
/**
 * Message - Communication between co-parents
 *
 * Encapsulates:
 * - Message content and metadata
 * - Edit permissions (5-minute window)
 * - Mediation status
 * - Access control
 */
class Message {
  constructor(data) {
    this.id = new MessageId(data.id);
    this.roomId = new RoomId(data.room_id || data.roomId);
    this.sender = new Username(data.username || data.sender);
    this.text = data.text || data.content;
    this.originalText = data.original_text || data.originalText || this.text;
    this.timestamp = new Date(data.timestamp);
    this.editedAt = data.edited_at ? new Date(data.edited_at) : null;
    this.wasMediated = data.was_mediated || data.wasMediated || false;
    this.type = data.type || 'user';
  }

  /**
   * Check if message can be edited by user
   * Business rule: 5-minute window, only by sender
   */
  canBeEditedBy(user) {
    if (this.sender.value !== user.username.value) {
      return false;
    }
    const fiveMinutes = 5 * 60 * 1000;
    const timeSinceSent = Date.now() - this.timestamp.getTime();
    return timeSinceSent < fiveMinutes;
  }

  /**
   * Check if message requires mediation
   */
  requiresMediation() {
    // This would integrate with AI mediator
    return false; // Placeholder
  }

  /**
   * Edit message (with validation)
   */
  edit(newText, user) {
    if (!this.canBeEditedBy(user)) {
      throw new Error('Message cannot be edited');
    }
    if (!newText || newText.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    if (newText.length > 1000) {
      throw new Error('Message exceeds maximum length');
    }

    this.originalText = this.text;
    this.text = newText.trim();
    this.editedAt = new Date();
  }

  /**
   * Create from database row
   */
  static fromDbRow(row) {
    return new Message({
      id: row.id,
      room_id: row.room_id,
      username: row.username,
      text: row.text,
      original_text: row.original_content,
      timestamp: row.timestamp,
      edited_at: row.edited_at,
      was_mediated: row.was_mediated,
      type: row.type,
    });
  }

  /**
   * Convert to database format
   */
  toDbRow() {
    return {
      id: this.id.value,
      room_id: this.roomId.value,
      username: this.sender.value,
      text: this.text,
      original_content: this.originalText,
      timestamp: this.timestamp.toISOString(),
      edited_at: this.editedAt?.toISOString(),
      was_mediated: this.wasMediated,
      type: this.type,
    };
  }
}
```

### **3. Room Entity**

```javascript
/**
 * Room - Private communication space between two co-parents
 *
 * Encapsulates:
 * - Room membership (exactly 2 co-parents)
 * - Access control
 * - Invitation status
 * - Children information (COPPA-protected)
 */
class Room {
  constructor(data) {
    this.id = new RoomId(data.id);
    this.name = data.name;
    this.createdBy = data.created_by || data.createdBy;
    this.createdAt = new Date(data.created_at || data.createdAt);
    this.isPrivate = data.is_private !== undefined ? data.is_private : true;
    this.members = data.members || [];
    this.children = (data.children || []).map(c => new Child(c));
  }

  /**
   * Check if user is a member
   */
  isMember(user) {
    return this.members.some(m => m.userId === user.id || m.username === user.username.value);
  }

  /**
   * Add member (with validation)
   */
  addMember(user) {
    if (this.members.length >= 2) {
      throw new Error('Room can only have 2 members');
    }
    if (this.isMember(user)) {
      throw new Error('User is already a member');
    }
    this.members.push({
      userId: user.id,
      username: user.username.value,
      role: 'member',
      joinedAt: new Date(),
    });
  }

  /**
   * Check if room can be deleted
   * Business rule: Requires both co-parent approval
   */
  canBeDeletedBy(user) {
    // This would check approval status
    return this.isMember(user);
  }

  /**
   * Create from database row
   */
  static fromDbRow(row, members = [], children = []) {
    return new Room({
      id: row.id,
      name: row.name,
      created_by: row.created_by,
      created_at: row.created_at,
      is_private: row.is_private,
      members: members,
      children: children,
    });
  }
}
```

### **4. Task Entity**

```javascript
/**
 * Task - Shared parenting responsibility
 *
 * Encapsulates:
 * - Task assignment and completion
 * - Due dates and recurrence
 * - Access control
 */
class Task {
  constructor(data) {
    this.id = data.id;
    this.roomId = new RoomId(data.room_id || data.roomId);
    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status || 'open';
    this.priority = data.priority || 'medium';
    this.dueDate = data.due_date ? new Date(data.due_date) : null;
    this.completedAt = data.completed_at ? new Date(data.completed_at) : null;
    this.assignedTo = data.assigned_to || data.assignedTo;
    this.createdBy = data.created_by || data.createdBy;
    this.recurrencePattern = data.recurrence_pattern || null;
  }

  /**
   * Check if task can be completed by user
   */
  canBeCompletedBy(user) {
    if (this.status === 'completed') {
      return false;
    }
    // Both room members can complete tasks
    return true; // Would need room context
  }

  /**
   * Complete task
   */
  complete(user) {
    if (!this.canBeCompletedBy(user)) {
      throw new Error('Task cannot be completed');
    }
    this.status = 'completed';
    this.completedAt = new Date();
  }

  /**
   * Check if task is overdue
   */
  isOverdue() {
    if (!this.dueDate || this.status === 'completed') {
      return false;
    }
    return new Date() > this.dueDate;
  }

  /**
   * Create from database row
   */
  static fromDbRow(row) {
    return new Task({
      id: row.id,
      room_id: row.room_id || row.roomId,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date,
      completed_at: row.completed_at,
      assigned_to: row.assigned_to,
      created_by: row.user_id,
      recurrence_pattern: row.recurrence_pattern,
    });
  }
}
```

### **5. Contact Entity**

```javascript
/**
 * Contact - Shared directory entry
 *
 * Encapsulates:
 * - Contact information
 * - Role and relationship
 * - Access control
 */
class Contact {
  constructor(data) {
    this.id = data.id;
    this.roomId = new RoomId(data.room_id || data.roomId);
    this.name = data.contact_name || data.name;
    this.email = data.contact_email || data.email;
    this.phone = data.phone;
    this.relationship = data.relationship;
    this.role = data.role || 'general';
    this.notes = data.notes || '';
    this.addedBy = data.added_by || data.addedBy;
    this.addedAt = new Date(data.created_at || data.addedAt);
  }

  /**
   * Check if contact can be edited by user
   * Business rule: Both room members can edit
   */
  canBeEditedBy(user) {
    // Would need room context
    return true; // Placeholder
  }

  /**
   * Validate contact data
   */
  static validate(data) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Contact name is required');
    }
    if (data.email && !Email.isValid(data.email)) {
      throw new Error('Invalid email address');
    }
    return true;
  }

  /**
   * Create from database row
   */
  static fromDbRow(row) {
    return new Contact({
      id: row.id,
      room_id: row.room_id,
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      phone: row.phone,
      relationship: row.relationship,
      notes: row.notes,
      added_by: row.user_id,
      created_at: row.created_at,
    });
  }
}
```

### **6. CommunicationProfile Entity**

```javascript
/**
 * CommunicationProfile - User communication patterns and history
 *
 * Encapsulates:
 * - Communication patterns (accusatory, collaborative, etc.)
 * - Emotional triggers
 * - Intervention outcomes
 * - Temporal decay
 */
class CommunicationProfile {
  constructor(data) {
    this.userId = data.user_id || data.userId;
    this.communicationPatterns = data.communication_patterns || {};
    this.emotionalTriggers = data.emotional_triggers || [];
    this.stressHistory = data.stress_history || [];
    this.interventionOutcomes = data.intervention_outcomes || [];
    this.communicationPreferences = data.communication_preferences || {};
    this.lastUpdated = data.profile_last_updated ? new Date(data.profile_last_updated) : new Date();
  }

  /**
   * Record intervention outcome
   */
  recordIntervention(intervention, wasHelpful) {
    this.interventionOutcomes.push({
      timestamp: new Date(),
      intervention: intervention,
      wasHelpful: wasHelpful,
    });
    this.lastUpdated = new Date();
  }

  /**
   * Get adaptation recommendations
   */
  getAdaptationRecommendations() {
    // Business logic from feedbackLearner
    const negativeRatio = this.calculateNegativeRatio();
    return {
      interventionFrequency: negativeRatio > 0.5 ? 'minimal' : 'moderate',
      interventionStyle: negativeRatio > 0.5 ? 'gentle' : 'moderate',
      preferredTone: 'warm',
      confidence: Math.min(100, this.interventionOutcomes.length * 10),
    };
  }

  /**
   * Calculate negative feedback ratio
   */
  calculateNegativeRatio() {
    if (this.interventionOutcomes.length === 0) return 0;
    const negative = this.interventionOutcomes.filter(o => !o.wasHelpful).length;
    return negative / this.interventionOutcomes.length;
  }

  /**
   * Apply temporal decay
   */
  applyTemporalDecay() {
    // Business logic from temporalDecay.js
    // Decay old patterns over time
  }
}
```

### **7. Value Objects**

```javascript
/**
 * Email - Typed email value object
 */
class Email {
  constructor(value) {
    if (!Email.isValid(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = value.toLowerCase().trim();
  }

  static isValid(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other) {
    return other instanceof Email && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

/**
 * Username - Typed username value object
 */
class Username {
  constructor(value) {
    if (!value || value.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (value.length > 50) {
      throw new Error('Username must be less than 50 characters');
    }
    this.value = value.toLowerCase().trim();
  }

  equals(other) {
    return other instanceof Username && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

/**
 * RoomId - Typed room identifier
 */
class RoomId {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('RoomId must be a non-empty string');
    }
    this.value = value;
  }

  equals(other) {
    return other instanceof RoomId && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}

/**
 * MessageId - Typed message identifier
 */
class MessageId {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('MessageId must be a non-empty string');
    }
    this.value = value;
  }

  equals(other) {
    return other instanceof MessageId && this.value === other.value;
  }

  toString() {
    return this.value;
  }
}
```

---

## 🔄 Migration Strategy

### **Phase 1: Foundation** (Week 1)

1. Create `src/domain/` directory structure
2. Implement value objects (`Email`, `Username`, `RoomId`, `MessageId`)
3. Add tests for value objects
4. **No breaking changes** - keep existing code working

### **Phase 2: Core Entities** (Week 2-3)

1. Implement `User`, `Message`, `Room` classes
2. Create factory methods (`fromDbRow`, `toDbRow`)
3. Add domain validation methods
4. **Gradual migration** - use alongside existing code

### **Phase 3: Business Logic** (Week 4)

1. Move business rules into entity methods
2. Update service functions to use domain classes
3. Add tests for domain logic
4. **Refactor existing code** - replace plain objects

### **Phase 4: Advanced Entities** (Week 5)

1. Implement `Task`, `Contact`, `CommunicationProfile`
2. Add relationship methods
3. Complete migration
4. **Remove plain object patterns**

### **Phase 5: Repository Pattern** (Week 6)

1. Create repository interfaces
2. Implement database repositories
3. Abstract data access
4. **Finalize architecture**

---

## 📈 Benefits

### **Immediate Benefits**

- ✅ **Type Safety** - Compile-time validation
- ✅ **Encapsulation** - Business rules in entities
- ✅ **Discoverability** - Domain concepts obvious in code
- ✅ **Testability** - Easier to test domain logic
- ✅ **Documentation** - Self-documenting code

### **Long-term Benefits**

- ✅ **Maintainability** - Single source of truth
- ✅ **Refactoring** - Easier to change domain rules
- ✅ **Onboarding** - New developers understand domain quickly
- ✅ **Domain-Driven Design** - Aligns with DDD principles

---

## ⚠️ Trade-offs

### **Cons**

- ❌ **Initial Overhead** - More code to write initially
- ❌ **Learning Curve** - Team needs to learn domain model pattern
- ❌ **Migration Effort** - Existing code needs refactoring
- ❌ **Performance** - Slight overhead from object creation

### **Mitigation**

- ✅ **Gradual Migration** - Can be done incrementally
- ✅ **Backward Compatible** - Keep existing code working during migration
- ✅ **Clear Examples** - Provide examples and documentation
- ✅ **Performance Testing** - Measure and optimize if needed

---

## 🎯 Success Criteria

### **Phase 1 Complete When**

- ✅ Value objects implemented and tested
- ✅ No breaking changes to existing code
- ✅ Team understands value object pattern

### **Phase 2 Complete When**

- ✅ Core entities (`User`, `Message`, `Room`) implemented
- ✅ Factory methods working
- ✅ Domain validation in place
- ✅ 50% of new code uses domain classes

### **Phase 3 Complete When**

- ✅ Business logic moved to entities
- ✅ Service functions refactored
- ✅ All tests passing
- ✅ 80% of code uses domain classes

### **Final Success**

- ✅ All core entities implemented
- ✅ Repository pattern in place
- ✅ 100% of new code uses domain classes
- ✅ Documentation complete
- ✅ Team comfortable with domain model

---

## 📋 Implementation Checklist

### **Immediate Actions**

- [ ] Create `src/domain/` directory structure
- [ ] Implement value objects (`Email`, `Username`, `RoomId`, `MessageId`)
- [ ] Write tests for value objects
- [ ] Document value object usage

### **Short-term Actions**

- [ ] Implement `User` entity
- [ ] Implement `Message` entity
- [ ] Implement `Room` entity
- [ ] Create factory methods
- [ ] Add domain validation

### **Medium-term Actions**

- [ ] Implement remaining entities
- [ ] Move business logic to entities
- [ ] Refactor service functions
- [ ] Create repository interfaces

### **Long-term Actions**

- [ ] Complete migration
- [ ] Remove plain object patterns
- [ ] Update documentation
- [ ] Train team on domain model

---

## 🔍 Example: Before vs After

### **Before (Current)**

```javascript
// server.js
socket.on('send_message', async ({ text, roomId }) => {
  const user = activeUsers.get(socket.id);

  // Plain object
  const message = {
    id: generateId('msg'),
    username: user.username,
    text: text,
    timestamp: Date.now(),
    roomId: roomId,
  };

  // Business logic in service
  if (canUserSendMessage(user, roomId)) {
    await messageStore.saveMessage(message);
    io.to(roomId).emit('new_message', message);
  }
});

// Validation scattered
function canUserSendMessage(user, roomId) {
  // Check if user is member of room
  // Check rate limits
  // Check message length
  // etc.
}
```

### **After (Proposed)**

```javascript
// server.js
socket.on('send_message', async ({ text, roomId }) => {
  const user = await userRepository.findById(activeUsers.get(socket.id).id);
  const room = await roomRepository.findById(new RoomId(roomId));

  // Domain entity with validation
  const message = Message.create({
    room: room,
    sender: user,
    text: text,
  });

  // Business logic in entity
  if (message.canBeSentBy(user, room)) {
    await messageRepository.save(message);
    io.to(roomId).emit('new_message', message.toDto());
  }
});

// Message.js - Domain entity
class Message {
  static create({ room, sender, text }) {
    // Validation happens here
    if (!room.isMember(sender)) {
      throw new Error('User is not a member of this room');
    }
    if (text.length > 1000) {
      throw new Error('Message exceeds maximum length');
    }

    return new Message({
      id: new MessageId(generateId('msg')),
      roomId: room.id,
      sender: sender.username,
      text: text,
      timestamp: new Date(),
    });
  }

  canBeSentBy(user, room) {
    return room.isMember(user) && this.text.length > 0 && this.text.length <= 1000;
  }
}
```

---

## 📚 References

- **Domain-Driven Design** - Eric Evans
- **Anemic Domain Model** - Martin Fowler
- **Value Objects** - DDD pattern
- **Repository Pattern** - DDD pattern

---

## 🎯 Next Steps

1. **Review Proposal** - Get team feedback
2. **Start Phase 1** - Implement value objects
3. **Create Examples** - Show usage patterns
4. **Document Migration** - Guide for team
5. **Iterate** - Refine based on usage

---

**Status**: Ready for Implementation  
**Priority**: High (Architectural Foundation)  
**Estimated Effort**: 6 weeks (gradual migration)
