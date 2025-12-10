# Domain Model Usage Guide

**Date**: 2025-01-27  
**Purpose**: Guide for using value objects and domain entities in LiaiZen  
**Status**: Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Value Objects](#value-objects)
3. [When to Use Value Objects](#when-to-use-value-objects)
4. [Migration Guide](#migration-guide)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [FAQ](#faq)

---

## 🎯 Overview

This guide explains how to use **value objects** and **domain entities** in the LiaiZen codebase. Value objects provide type safety, validation, and encapsulation for primitive domain concepts.

### **What Are Value Objects?**

Value objects are **immutable** objects that represent domain concepts. They:
- ✅ Validate data on creation
- ✅ Provide type safety
- ✅ Encapsulate domain rules
- ✅ Prevent invalid states

### **Current Status**

**Phase 1 (Value Objects)**: ✅ Ready to implement
- `Email` - Typed email address
- `Username` - Typed username
- `RoomId` - Typed room identifier
- `MessageId` - Typed message identifier

**Phase 2+ (Entities)**: ⏳ Coming later
- `User`, `Message`, `Room`, `Task`, `Contact`

---

## ⚠️ Important: Username vs Display Name

**CRITICAL DISTINCTION**: There are two different concepts that must not be confused:

### **Database Username** (Unique Identifier)
- **Purpose**: System identifier for authentication and database lookups
- **Format**: Auto-generated from email (e.g., "alice123")
- **Characteristics**:
  - Lowercase, alphanumeric
  - Unique across the system
  - Auto-generated (not user-provided)
  - Used for authentication, database queries, system lookups
- **Storage**: `users.username` column (UNIQUE, NOT NULL)
- **Value Object**: Use `Username` value object for this
- **Example**: `new Username("alice123")`

### **Display Name** (User-Facing Name)
- **Purpose**: Name shown to other users in the UI
- **Format**: User-provided (e.g., "Alice", "Bob Smith", "Mary-Jane")
- **Characteristics**:
  - Can contain spaces, mixed case, special characters
  - User-provided (not auto-generated)
  - Used for display to other users
  - Can be changed by user
- **Storage**: `users.display_name` column (TEXT, nullable)
- **Value Object**: None yet (plain string)
- **Example**: `"Alice"` or `"Bob Smith"`

### **First Name**
- **Purpose**: User's first name
- **Format**: User-provided (e.g., "Alice")
- **Storage**: `users.first_name` column (TEXT, nullable)
- **Value Object**: None yet (plain string)
- **Example**: `"Alice"`

### **When to Use Each**

| Use Case | Use This | Example |
|----------|----------|---------|
| Database lookups | `Username` value object | `new Username("alice123")` |
| Authentication | `Username` value object | `new Username(user.username)` |
| Display to users | `displayName` string | `user.display_name \|\| user.username` |
| User input (name) | `displayName` string | `req.body.displayName` |
| User input (first name) | `firstName` string | `req.body.firstName` |

### **Common Mistakes to Avoid**

❌ **DON'T**: Use display name as database username
```javascript
// WRONG
const username = new Username(user.display_name); // display_name might be "Alice Smith"
```

✅ **DO**: Use database username for Username value object
```javascript
// CORRECT
const username = new Username(user.username); // username is "alice123"
```

❌ **DON'T**: Use database username for display
```javascript
// WRONG (unless display_name is null)
const displayName = user.username; // Shows "alice123" instead of "Alice"
```

✅ **DO**: Use display_name with fallback
```javascript
// CORRECT
const displayName = user.display_name || user.username; // Shows "Alice" or "alice123" as fallback
```

❌ **DON'T**: Confuse API parameter names
```javascript
// WRONG (old, deprecated)
apiPost('/api/auth/register-with-invite', {
  username: displayName // Confusing! username parameter means display name
});
```

✅ **DO**: Use correct parameter names
```javascript
// CORRECT (new, preferred)
apiPost('/api/auth/register-with-invite', {
  displayName: displayName // Clear! displayName parameter means display name
});
```

### **API Parameter Naming**

**Registration Endpoints:**
- ✅ **Use**: `displayName` parameter (new, preferred)
- ⚠️ **Deprecated**: `username` parameter (old, still works but will be removed)

**Profile Update Endpoints:**
- ✅ **Use**: `username` parameter (this is correct - it updates the database username)
- ✅ **Use**: `display_name` parameter (this updates the display name)

---

## 🔷 Value Objects

### **Email**

Represents a validated email address.

**Usage:**
```javascript
const { Email } = require('./src/domain/valueObjects');

// Create email (validates on construction)
const email = new Email('alice@example.com');

// Access value
console.log(email.value); // 'alice@example.com'

// Use in comparisons
const email1 = new Email('alice@example.com');
const email2 = new Email('alice@example.com');
email1.equals(email2); // true

// Invalid email throws error
try {
  const invalid = new Email('not-an-email');
} catch (error) {
  // Error: Invalid email: not-an-email
}
```

**Validation Rules:**
- Must match email regex pattern
- Automatically lowercased and trimmed
- Throws error if invalid

**When to Use:**
- ✅ User registration/login
- ✅ Email validation
- ✅ Storing email addresses
- ✅ Email comparisons

**When NOT to Use:**
- ❌ Temporary email strings (use plain string)
- ❌ Email parsing/extraction (use utility function first)

---

### **Username**

**IMPORTANT**: This represents a **database username** (unique identifier), NOT a display name or first name.

Represents a validated database username (unique identifier).

**Usage:**
```javascript
const { Username } = require('./src/domain/valueObjects');

// Create username (validates on construction)
const username = new Username('alice123');

// Access value
console.log(username.value); // 'alice123'

// Invalid username throws error
try {
  const invalid = new Username('ab'); // Too short
} catch (error) {
  // Error: Username must be at least 3 characters
}
```

**Validation Rules:**
- Minimum 3 characters
- Maximum 50 characters
- Automatically lowercased and trimmed
- Throws error if invalid

**When to Use:**
- ✅ User authentication (database username)
- ✅ User lookups (database username)
- ✅ Username comparisons (database username)
- ✅ Storing database usernames

**When NOT to Use:**
- ❌ Display names (use `display_name` field)
- ❌ First names (use `first_name` field)
- ❌ Temporary username strings (use plain string)
- ❌ Username generation (use utility function first)

---

### **RoomId**

Represents a validated room identifier.

**Usage:**
```javascript
const { RoomId } = require('./src/domain/valueObjects');

// Create room ID
const roomId = new RoomId('room-abc123');

// Access value
console.log(roomId.value); // 'room-abc123'

// Use in comparisons
const id1 = new RoomId('room-abc123');
const id2 = new RoomId('room-abc123');
id1.equals(id2); // true
```

**Validation Rules:**
- Must be non-empty string
- Throws error if invalid

**When to Use:**
- ✅ Room lookups
- ✅ Room operations
- ✅ Room comparisons
- ✅ Storing room IDs

**When NOT to Use:**
- ❌ Room ID generation (use utility function first)

---

### **MessageId**

Represents a validated message identifier.

**Usage:**
```javascript
const { MessageId } = require('./src/domain/valueObjects');

// Create message ID
const messageId = new MessageId('msg-xyz789');

// Access value
console.log(messageId.value); // 'msg-xyz789'
```

**Validation Rules:**
- Must be non-empty string
- Throws error if invalid

**When to Use:**
- ✅ Message lookups
- ✅ Message operations
- ✅ Message comparisons
- ✅ Storing message IDs

**When NOT to Use:**
- ❌ Message ID generation (use utility function first)

---

## 🎯 When to Use Value Objects

### **✅ Use Value Objects When:**

1. **Data comes from user input**
   ```javascript
   // User registration
   const email = new Email(req.body.email); // Validates input
   ```

2. **Data comes from database**
   ```javascript
   // Database query result
   const email = new Email(dbRow.email); // Validates stored data
   ```

3. **Data is passed between functions**
   ```javascript
   // Function parameter
   function sendEmail(email) {
     const validatedEmail = new Email(email); // Validates parameter
     // ...
   }
   ```

4. **Data needs validation**
   ```javascript
   // Anywhere validation is needed
   const username = new Username(input); // Throws if invalid
   ```

### **❌ Don't Use Value Objects When:**

1. **Temporary string manipulation**
   ```javascript
   // ❌ Don't do this
   const emailStr = 'alice@example.com';
   const domain = emailStr.split('@')[1]; // Just use string
   
   // ✅ Do this
   const email = new Email('alice@example.com');
   const domain = email.value.split('@')[1]; // Extract from value object
   ```

2. **String concatenation/formatting**
   ```javascript
   // ❌ Don't do this
   const greeting = `Hello ${new Username('alice').value}!`;
   
   // ✅ Do this
   const username = new Username('alice');
   const greeting = `Hello ${username.value}!`;
   ```

3. **Performance-critical loops**
   ```javascript
   // ❌ Don't do this (creates objects in loop)
   for (const emailStr of emailList) {
     const email = new Email(emailStr); // Unnecessary object creation
   }
   
   // ✅ Do this (validate once, reuse)
   const emails = emailList.map(str => new Email(str));
   for (const email of emails) {
     // Use email.value
   }
   ```

---

## 🔄 Migration Guide

### **Step 1: Identify Usage Points**

Find places where plain strings are used for domain concepts:

```javascript
// Before: Plain strings
function getUserByEmail(email) {
  return db.query('SELECT * FROM users WHERE email = $1', [email]);
}

function createUser(username, email) {
  return db.query('INSERT INTO users (username, email) VALUES ($1, $2)', 
    [username, email]);
}
```

### **Step 2: Add Value Object Validation**

Add validation at entry points (API endpoints, database reads):

```javascript
// After: Value objects at boundaries
function getUserByEmail(emailInput) {
  const email = new Email(emailInput); // Validate at boundary
  return db.query('SELECT * FROM users WHERE email = $1', [email.value]);
}

function createUser(usernameInput, emailInput) {
  const username = new Username(usernameInput); // Validate at boundary
  const email = new Email(emailInput); // Validate at boundary
  return db.query('INSERT INTO users (username, email) VALUES ($1, $2)', 
    [username.value, email.value]);
}
```

### **Step 3: Use Value Objects Internally**

Pass value objects between functions:

```javascript
// After: Value objects in function signatures
function getUserByEmail(email) {
  // email is already a Email value object
  return db.query('SELECT * FROM users WHERE email = $1', [email.value]);
}

function createUser(username, email) {
  // username and email are already value objects
  return db.query('INSERT INTO users (username, email) VALUES ($1, $2)', 
    [username.value, email.value]);
}
```

### **Step 4: Gradual Migration**

Migrate one module at a time:

1. **Start with new code** - Always use value objects in new features
2. **Migrate API endpoints** - Validate at request boundaries
3. **Migrate database operations** - Validate at database boundaries
4. **Migrate internal functions** - Pass value objects between functions

---

## 📝 Examples

### **Example 1: User Registration**

**Before:**
```javascript
// server.js
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;
  
  // Validation scattered
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  
  // Use plain strings
  const user = await createUser(username, email, password);
  res.json({ user });
});
```

**After:**
```javascript
// server.js
const { Email, Username } = require('./src/domain/valueObjects');

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email: emailInput, username: usernameInput, password } = req.body;
    
    // Validation in value objects
    const email = new Email(emailInput);
    const username = new Username(usernameInput);
    
    // Use value objects
    const user = await createUser(username, email, password);
    res.json({ user });
  } catch (error) {
    // Value object validation errors are caught here
    res.status(400).json({ error: error.message });
  }
});
```

---

### **Example 2: Database Queries**

**Before:**
```javascript
// userContext.js
async function getUserContext(username) {
  // Plain string, no validation
  const result = await db.query(
    'SELECT * FROM user_context WHERE user_id = $1', 
    [username.toLowerCase()]
  );
  return result.rows[0];
}
```

**After:**
```javascript
// userContext.js
const { Username } = require('../domain/valueObjects');

async function getUserContext(username) {
  // username is already a Username value object
  const result = await db.query(
    'SELECT * FROM user_context WHERE user_id = $1', 
    [username.value] // Username already lowercased
  );
  return result.rows[0];
}

// Or validate at boundary
async function getUserContext(usernameInput) {
  const username = new Username(usernameInput); // Validate
  const result = await db.query(
    'SELECT * FROM user_context WHERE user_id = $1', 
    [username.value]
  );
  return result.rows[0];
}
```

---

### **Example 3: Message Operations**

**Before:**
```javascript
// messageStore.js
async function saveMessage(message) {
  // Plain strings, no validation
  const id = message.id || generateId('msg');
  const roomId = message.roomId;
  const username = message.username;
  
  await db.query(
    'INSERT INTO messages (id, room_id, username, text) VALUES ($1, $2, $3, $4)',
    [id, roomId, username, message.text]
  );
}
```

**After:**
```javascript
// messageStore.js
const { MessageId, RoomId, Username } = require('../domain/valueObjects');

async function saveMessage(message) {
  // Validate IDs at boundary
  const id = message.id ? new MessageId(message.id) : new MessageId(generateId('msg'));
  const roomId = new RoomId(message.roomId);
  const username = new Username(message.username);
  
  await db.query(
    'INSERT INTO messages (id, room_id, username, text) VALUES ($1, $2, $3, $4)',
    [id.value, roomId.value, username.value, message.text]
  );
}
```

---

### **Example 4: Function Parameters**

**Before:**
```javascript
// roomManager.js
function canUserAccessRoom(userId, roomId) {
  // Plain strings, no type safety
  return db.query(
    'SELECT * FROM room_members WHERE user_id = $1 AND room_id = $2',
    [userId, roomId]
  );
}
```

**After:**
```javascript
// roomManager.js
const { RoomId } = require('../domain/valueObjects');

function canUserAccessRoom(userId, roomId) {
  // roomId is a RoomId value object
  // Provides type safety and validation
  return db.query(
    'SELECT * FROM room_members WHERE user_id = $1 AND room_id = $2',
    [userId, roomId.value]
  );
}

// Call site
const roomId = new RoomId('room-abc123');
const canAccess = await canUserAccessRoom(user.id, roomId);
```

---

## ✅ Best Practices

### **1. Validate at Boundaries**

Validate input at API endpoints, database reads, and external interfaces:

```javascript
// ✅ Good: Validate at API boundary
app.post('/api/users', async (req, res) => {
  const email = new Email(req.body.email); // Validate here
  // ...
});

// ❌ Bad: Validate deep in code
function processUser(data) {
  // ... lots of code ...
  const email = new Email(data.email); // Too late
}
```

### **2. Use Value Objects in Function Signatures**

Pass value objects between functions for type safety:

```javascript
// ✅ Good: Value object in signature
function sendEmail(email) {
  // email is already validated
  // ...
}

// ❌ Bad: Plain string in signature
function sendEmail(emailStr) {
  const email = new Email(emailStr); // Validate every time
  // ...
}
```

### **3. Extract Values for Database/External APIs**

Use `.value` when passing to external systems:

```javascript
// ✅ Good: Extract value for database
const email = new Email('alice@example.com');
await db.query('INSERT INTO users (email) VALUES ($1)', [email.value]);

// ❌ Bad: Try to use value object directly
await db.query('INSERT INTO users (email) VALUES ($1)', [email]); // Won't work
```

### **4. Handle Validation Errors Gracefully**

Catch value object validation errors and return user-friendly messages:

```javascript
// ✅ Good: Handle validation errors
try {
  const email = new Email(req.body.email);
} catch (error) {
  return res.status(400).json({ 
    error: 'Invalid email address',
    details: error.message 
  });
}

// ❌ Bad: Let validation errors crash
const email = new Email(req.body.email); // Might throw
```

### **5. Don't Over-Use Value Objects**

Use value objects for domain concepts, not for every string:

```javascript
// ✅ Good: Domain concept
const email = new Email('alice@example.com');

// ❌ Bad: Not a domain concept
const status = new Status('active'); // Over-engineering
```

---

## ❓ FAQ

### **Q: Do I need to use value objects everywhere?**

**A:** No. Use value objects at **boundaries** (API endpoints, database operations) and in **function signatures**. Internal string manipulation can use plain strings.

### **Q: What about performance?**

**A:** Value objects are lightweight. The validation overhead is minimal (regex, length checks). If performance becomes an issue, profile and optimize, but it's unlikely to be a problem.

### **Q: Can I use value objects with existing code?**

**A:** Yes! Value objects are designed to work alongside existing code. Migrate gradually, starting with new code and API endpoints.

### **Q: What if I need to modify a value object?**

**A:** Value objects are **immutable**. If you need a modified version, create a new instance. This prevents accidental mutations.

### **Q: How do I convert between value objects and plain strings?**

**A:** Use `.value` to get the underlying string:
```javascript
const email = new Email('alice@example.com');
const emailStr = email.value; // 'alice@example.com'
```

### **Q: Can I use value objects in database queries?**

**A:** Yes, but extract the value:
```javascript
const email = new Email('alice@example.com');
await db.query('SELECT * FROM users WHERE email = $1', [email.value]);
```

### **Q: What about TypeScript?**

**A:** Value objects work with JavaScript. If you migrate to TypeScript later, value objects provide a natural type system.

---

## 📚 Related Documents

- **`DOMAIN_MODEL_PROPOSAL.md`** - Full proposal with examples
- **`DOMAIN_MODEL_IMPLEMENTATION_PLAN.md`** - Step-by-step implementation plan
- **`DOMAIN_MODEL_RISK_ASSESSMENT.md`** - Risk analysis
- **`DOMAIN_MODEL_PHASE1_DECISION.md`** - Phase 1 decision and action plan

---

## 🎯 Quick Reference

### **Import Value Objects**
```javascript
const { Email, Username, RoomId, MessageId } = require('./src/domain/valueObjects');
```

### **Create Value Objects**
```javascript
const email = new Email('alice@example.com');
const username = new Username('alice123');
const roomId = new RoomId('room-abc123');
const messageId = new MessageId('msg-xyz789');
```

### **Access Values**
```javascript
email.value      // 'alice@example.com'
username.value   // 'alice123'
roomId.value     // 'room-abc123'
messageId.value  // 'msg-xyz789'
```

### **Compare Value Objects**
```javascript
email1.equals(email2)  // true if values are equal
```

### **Handle Errors**
```javascript
try {
  const email = new Email(invalidInput);
} catch (error) {
  // Handle validation error
  console.error(error.message);
}
```

---

**Last Updated**: 2025-01-27  
**Status**: Active  
**Version**: 1.0.0
