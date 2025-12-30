# Username vs Display Name - Test Plan

**Date**: 2025-01-27  
**Status**: Ready for Testing  
**Purpose**: Verify that username/displayName confusion is resolved

---

## 🧪 Test Scenarios

### **1. Registration with Display Name (New Parameter)**

**Endpoint**: `POST /api/auth/register-with-invite`

**Test Case 1.1: Short Code Registration with displayName**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "alice@example.com",
  password: "password123",
  displayName: "Alice Smith",
  inviteCode: "LZ-ABC123"
}

Expected:
- ✅ User created with display_name = "Alice Smith"
- ✅ Database username auto-generated (e.g., "alice123")
- ✅ No deprecation warning in logs
- ✅ Response includes user.displayName = "Alice Smith"
```

**Test Case 1.2: Pairing Token Registration with displayName**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "bob@example.com",
  password: "password123",
  displayName: "Bob Johnson",
  inviteToken: "pairing_token_xyz"
}

Expected:
- ✅ User created with display_name = "Bob Johnson"
- ✅ Database username auto-generated (e.g., "bob456")
- ✅ No deprecation warning in logs
- ✅ Pairing accepted successfully
```

**Test Case 1.3: Invitation Token Registration with displayName**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "carol@example.com",
  password: "password123",
  displayName: "Carol Williams",
  inviteToken: "invitation_token_xyz"
}

Expected:
- ✅ User created with display_name = "Carol Williams"
- ✅ Database username auto-generated (e.g., "carol789")
- ✅ No deprecation warning in logs
- ✅ Invitation accepted successfully
```

---

### **2. Backward Compatibility (Old Parameter)**

**Endpoint**: `POST /api/auth/register-with-invite`

**Test Case 2.1: Short Code Registration with username (deprecated)**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "dave@example.com",
  password: "password123",
  username: "Dave Brown",  // Old parameter
  inviteCode: "LZ-DEF456"
}

Expected:
- ✅ User created with display_name = "Dave Brown"
- ✅ Database username auto-generated (e.g., "dave012")
- ✅ Deprecation warning logged: "⚠️ [DEPRECATED] POST /api/auth/register-with-invite: "username" parameter is deprecated. Use "displayName" instead."
- ✅ Response includes user.displayName = "Dave Brown"
```

**Test Case 2.2: Both Parameters Provided (displayName takes precedence)**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "eve@example.com",
  password: "password123",
  username: "Old Name",      // Old parameter
  displayName: "Eve Davis",   // New parameter
  inviteCode: "LZ-GHI789"
}

Expected:
- ✅ User created with display_name = "Eve Davis" (displayName takes precedence)
- ✅ Database username auto-generated (e.g., "eve345")
- ✅ No deprecation warning (displayName provided)
- ✅ Response includes user.displayName = "Eve Davis"
```

---

### **3. Registration Endpoint (Primary Signup)**

**Endpoint**: `POST /api/auth/register`

**Test Case 3.1: Registration with displayName**

```javascript
POST /api/auth/register
Body: {
  email: "frank@example.com",
  password: "password123",
  displayName: "Frank Miller",
  coParentEmail: "partner@example.com",
  context: {}
}

Expected:
- ✅ User created with display_name = "Frank Miller"
- ✅ Database username auto-generated (e.g., "frank678")
- ✅ Invitation sent to co-parent
- ✅ Response includes user.displayName = "Frank Miller"
```

---

### **4. Database Verification**

**Test Case 4.1: Verify Database Username is Auto-Generated**

```sql
SELECT id, username, email, display_name, first_name
FROM users
WHERE email = 'alice@example.com';

Expected:
- ✅ username is auto-generated (e.g., "alice123")
- ✅ display_name matches provided value (e.g., "Alice Smith")
- ✅ username is lowercase, alphanumeric
- ✅ username is unique
```

**Test Case 4.2: Verify Display Name Fallback**

```javascript
// User with display_name
const user1 = { username: 'alice123', display_name: 'Alice Smith' };
const display1 = user1.display_name || user1.username;
// Expected: "Alice Smith"

// User without display_name
const user2 = { username: 'bob456', display_name: null };
const display2 = user2.display_name || user2.username;
// Expected: "bob456" (fallback to username)
```

---

### **5. Frontend Integration**

**Test Case 5.1: AcceptInvitationPage Registration**

```
1. Navigate to accept-invite page
2. Fill in form:
   - Email: test@example.com
   - Password: password123
   - Display Name: "Test User"
3. Submit form

Expected:
- ✅ API call uses displayName parameter
- ✅ Registration succeeds
- ✅ User sees success message
- ✅ User is logged in
```

**Test Case 5.2: useAuth Registration**

```
1. Use registration form
2. Fill in:
   - Email: test2@example.com
   - Password: password123
   - Name: "Test User 2"
   - Co-parent Email: partner@example.com
3. Submit form

Expected:
- ✅ API call uses displayName parameter
- ✅ Registration succeeds
- ✅ Invitation sent to co-parent
```

---

### **6. Error Cases**

**Test Case 6.1: Missing Display Name**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "test@example.com",
  password: "password123",
  // No displayName or username
  inviteCode: "LZ-TEST123"
}

Expected:
- ✅ 400 Bad Request
- ✅ Error message: "Display name is required"
```

**Test Case 6.2: Empty Display Name**

```javascript
POST /api/auth/register-with-invite
Body: {
  email: "test@example.com",
  password: "password123",
  displayName: "",
  inviteCode: "LZ-TEST123"
}

Expected:
- ✅ 400 Bad Request
- ✅ Error message: "Display name is required"
```

---

## 📋 Test Checklist

### **Backend Tests**

- [ ] Test short code registration with `displayName`
- [ ] Test pairing token registration with `displayName`
- [ ] Test invitation token registration with `displayName`
- [ ] Test backward compatibility with `username` parameter
- [ ] Test both parameters provided (displayName takes precedence)
- [ ] Test missing display name error
- [ ] Test empty display name error
- [ ] Verify deprecation warning is logged
- [ ] Verify database username is auto-generated correctly
- [ ] Verify display_name is stored correctly

### **Frontend Tests**

- [ ] Test AcceptInvitationPage registration flow
- [ ] Test useAuth registration flow
- [ ] Verify API calls use `displayName` parameter
- [ ] Verify user sees correct display name after registration
- [ ] Test error handling for missing display name

### **Integration Tests**

- [ ] Test full registration flow end-to-end
- [ ] Test display name appears correctly in UI
- [ ] Test database username is not shown to users
- [ ] Test fallback to username when display_name is null

---

## 🔍 Verification Points

### **Database Verification**

```sql
-- Check that username is auto-generated and unique
SELECT username, email, display_name
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Verify:
-- ✅ username is lowercase, alphanumeric
-- ✅ username is unique
-- ✅ display_name matches user input
-- ✅ username != display_name (unless display_name is null)
```

### **Log Verification**

```bash
# Check for deprecation warnings
grep "DEPRECATED.*username.*parameter" server.log

# Should see warnings only when old parameter is used
```

### **API Response Verification**

```javascript
// Registration response should include:
{
  success: true,
  user: {
    id: 123,
    username: "alice123",      // Auto-generated
    email: "alice@example.com",
    displayName: "Alice Smith" // User-provided
  },
  token: "..."
}
```

---

## 🐛 Known Issues / Edge Cases

### **Edge Case 1: Display Name with Special Characters**

- **Input**: `displayName: "Mary-Jane O'Brien"`
- **Expected**: Stored as-is in `display_name` column
- **Database Username**: Auto-generated from email (e.g., "maryjane123")

### **Edge Case 2: Very Long Display Name**

- **Input**: `displayName: "A Very Long Display Name That Exceeds Normal Length"`
- **Expected**: Stored in database (TEXT column, no length limit)
- **Database Username**: Still auto-generated from email (max 20 chars)

### **Edge Case 3: Display Name Same as Email Prefix**

- **Input**: `displayName: "alice"`, `email: "alice@example.com"`
- **Expected**:
  - `display_name` = "alice"
  - `username` = "alice123" (auto-generated, may have suffix)
  - These are different values (correct!)

---

## ✅ Success Criteria

### **Phase 1 Complete When:**

- ✅ Backend accepts both `displayName` and `username` parameters
- ✅ Deprecation warnings logged correctly
- ✅ All registration paths work with `displayName`
- ✅ Database usernames are auto-generated correctly
- ✅ Display names are stored correctly

### **Phase 2 Complete When:**

- ✅ Frontend uses `displayName` parameter
- ✅ All registration forms work correctly
- ✅ No errors in browser console
- ✅ Users see correct display names

### **Overall Success:**

- ✅ Clear distinction between database username and display name
- ✅ No confusion in codebase
- ✅ API parameters match their purpose
- ✅ All tests passing
- ✅ No breaking changes
- ✅ Backward compatibility maintained

---

## 📝 Test Results Template

```
Test Date: __________
Tester: __________

Backend Tests:
[ ] Test 1.1: Short code with displayName - PASS/FAIL
[ ] Test 1.2: Pairing token with displayName - PASS/FAIL
[ ] Test 1.3: Invitation token with displayName - PASS/FAIL
[ ] Test 2.1: Backward compatibility with username - PASS/FAIL
[ ] Test 2.2: Both parameters (displayName precedence) - PASS/FAIL
[ ] Test 3.1: Primary registration with displayName - PASS/FAIL
[ ] Test 4.1: Database username verification - PASS/FAIL
[ ] Test 6.1: Missing display name error - PASS/FAIL
[ ] Test 6.2: Empty display name error - PASS/FAIL

Frontend Tests:
[ ] Test 5.1: AcceptInvitationPage registration - PASS/FAIL
[ ] Test 5.2: useAuth registration - PASS/FAIL

Integration Tests:
[ ] Full registration flow end-to-end - PASS/FAIL
[ ] Display name appears correctly in UI - PASS/FAIL

Issues Found:
1. __________
2. __________

Notes:
__________
```

---

**Status**: ✅ **TEST PLAN READY**  
**Next Step**: Execute tests and document results
