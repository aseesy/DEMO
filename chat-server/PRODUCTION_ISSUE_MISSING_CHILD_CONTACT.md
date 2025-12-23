# Production Issue: Missing Child Contact

## Problem
User has added a child contact in production, but it's not showing in their contacts list.

## Immediate Actions

### 1. Diagnose the Issue

**Option A: Use the diagnostic script (recommended)**
```bash
cd chat-server
node scripts/diagnose-missing-contact.js <username> <childName>

# Example:
node scripts/diagnose-missing-contact.js mom1@test.com "Child Name"
```

**Option B: Use the API diagnostic endpoint**
```bash
# If you have access to the user's session token
GET /api/contacts/diagnose/:contactName
```

### 2. Check Common Issues

Run the fix script to automatically fix common problems:
```bash
cd chat-server
node scripts/fix-missing-child-contact.js <username> <childName>
```

This script will:
- Find the contact in the database
- Check for wrong `user_id`
- Check for missing or incorrect `relationship` field
- Fix any issues found
- Show all child contacts for verification

### 3. Manual Database Check

If scripts aren't available, check directly:

```sql
-- Find user
SELECT id, username, email FROM users 
WHERE LOWER(username) = LOWER('username') OR LOWER(email) = LOWER('username');

-- Find child contacts
SELECT id, contact_name, relationship, user_id, created_at 
FROM contacts 
WHERE user_id = <user_id>
  AND (
    LOWER(relationship) = 'my child' 
    OR LOWER(relationship) = 'child'
    OR LOWER(relationship) LIKE '%child%'
  )
ORDER BY created_at DESC;

-- Find contact by name
SELECT * FROM contacts 
WHERE LOWER(contact_name) LIKE LOWER('%ChildName%')
ORDER BY created_at DESC;
```

## Most Likely Causes

### 1. Wrong User ID (Most Common)
**Symptom**: Contact exists but with wrong `user_id`

**Fix**:
```sql
UPDATE contacts 
SET user_id = (SELECT id FROM users WHERE username = 'correct_username')
WHERE id = <contact_id>;
```

### 2. Missing or Incorrect Relationship
**Symptom**: Contact exists but `relationship` is NULL or wrong format

**Fix**:
```sql
UPDATE contacts 
SET relationship = 'my child'
WHERE id = <contact_id> 
  AND (relationship IS NULL OR LOWER(relationship) NOT LIKE '%child%');
```

### 3. Frontend Not Refreshing
**Symptom**: Contact exists in DB but frontend shows old data

**Fix**:
- Have user hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Check browser console for errors
- Verify API response includes the contact

### 4. Search Filter Active
**Symptom**: Contact exists but is filtered out

**Fix**: Clear the search box in the contacts panel

## Verification Steps

After fixing, verify:

1. **Database Check**:
```sql
SELECT id, contact_name, relationship, user_id 
FROM contacts 
WHERE user_id = <user_id> 
  AND LOWER(contact_name) LIKE LOWER('%ChildName%');
```

2. **API Check**:
```bash
# Should return the contact
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/contacts
```

3. **Frontend Check**:
- Open browser DevTools → Network tab
- Reload contacts
- Check response includes the child contact
- Verify relationship is transformed correctly

## Prevention

### Add Logging to Contact Creation

Add to `chat-server/services/contactsService.js`:
```javascript
async function createContact(userId, contactData) {
  console.log('[Contact Creation]', {
    userId,
    contactName: contactData.contact_name,
    relationship: contactData.relationship,
    timestamp: new Date().toISOString()
  });
  
  // ... existing code ...
  
  console.log('[Contact Created]', {
    contactId,
    userId,
    contactName: contactData.contact_name,
    relationship: contactData.relationship
  });
  
  return contactId;
}
```

### Add Validation

Ensure relationship is always set:
```javascript
// In createContact
if (!contactData.relationship) {
  throw new ServiceError('Relationship is required', 400);
}
```

## Files Created

- `scripts/diagnose-missing-contact.js` - Diagnostic tool
- `scripts/fix-missing-child-contact.js` - Automatic fix tool
- `TROUBLESHOOTING_MISSING_CONTACTS.md` - Comprehensive troubleshooting guide

## Next Steps

1. Run diagnostic script to identify the issue
2. Run fix script to automatically fix common problems
3. Have user refresh their browser
4. Verify contact appears
5. If still missing, check frontend console and API responses

