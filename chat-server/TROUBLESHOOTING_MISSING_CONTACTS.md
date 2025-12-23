# Troubleshooting Missing Contacts

## Problem
A user has added a child contact, but it's not showing in their contacts list.

## Quick Diagnosis

### Option 1: Use the Diagnostic Endpoint (Recommended)

The API has a built-in diagnostic endpoint. If you have access to the user's session:

```bash
# In browser console or via API client
GET /api/contacts/diagnose/:contactName

# Example:
GET /api/contacts/diagnose/ChildName
```

This will return:
- All contacts matching the name
- Relationship transformation details
- All child contacts for the user
- Potential issues

### Option 2: Use the Diagnostic Script

```bash
cd chat-server
node scripts/diagnose-missing-contact.js <username> <contactName>

# Example:
node scripts/diagnose-missing-contact.js mom1@test.com "Child Name"
```

## Common Causes & Solutions

### 1. Wrong User ID

**Symptom**: Contact exists in database but with wrong `user_id`

**Check**:
```sql
SELECT * FROM contacts 
WHERE contact_name ILIKE '%ChildName%' 
ORDER BY created_at DESC;
```

**Fix**: Update the contact's user_id:
```sql
UPDATE contacts 
SET user_id = (SELECT id FROM users WHERE username = 'correct_username')
WHERE id = <contact_id>;
```

### 2. Relationship Format Issue

**Symptom**: Contact exists but relationship field has unexpected format

**Check**: Look at the `relationship` field in the database. It should be:
- `'my child'` (lowercase, with space)
- `'child'` (also acceptable)

**Common Issues**:
- `'My Child'` (capitalized) - will still work but inconsistent
- `'my_child'` (underscore) - might not transform correctly
- `NULL` - will cause issues

**Fix**:
```sql
UPDATE contacts 
SET relationship = 'my child'
WHERE id = <contact_id> AND relationship IS NULL;
```

### 3. Frontend Not Refreshing

**Symptom**: Contact exists in database but frontend shows old data

**Check**: 
- Open browser DevTools → Network tab
- Check if `/api/contacts` is being called
- Check response - does it include the contact?

**Fix**:
- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache
- Check if there's a search filter active
- Verify the API response includes the contact

### 4. Search Filter Active

**Symptom**: Contact exists but is filtered out by search

**Check**: 
- Is there text in the search box?
- Does the contact name match the search?

**Fix**: Clear the search box

### 5. Contact Created But Not Saved

**Symptom**: User clicked "Save" but contact wasn't created

**Check**:
```sql
-- Check if contact exists at all
SELECT * FROM contacts 
WHERE user_id = (SELECT id FROM users WHERE username = 'username')
ORDER BY created_at DESC 
LIMIT 10;
```

**Fix**: 
- Check server logs for errors during contact creation
- Verify the POST request to `/api/contacts` succeeded
- Check browser console for errors

### 6. Authentication Issue

**Symptom**: API returns 401 or empty contacts

**Check**:
- Is the user logged in?
- Is the JWT token valid?
- Does `req.user.id` match the expected user?

**Fix**: 
- Have user log out and log back in
- Check JWT token expiration
- Verify authentication middleware is working

## Step-by-Step Debugging

### Step 1: Verify Contact Exists

```bash
# Using the diagnostic script
node scripts/diagnose-missing-contact.js <username> <contactName>
```

### Step 2: Check API Response

```bash
# Using curl (replace with actual token)
curl -H "Authorization: Bearer <token>" \
     http://localhost:3001/api/contacts
```

Or in browser console:
```javascript
fetch('/api/contacts', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => console.log('Contacts:', data));
```

### Step 3: Check Frontend State

In browser console:
```javascript
// Check if contacts are loaded
console.log('Contacts from API:', /* check useContactsApi hook */);

// Check if contact is in the array
const contacts = /* get from React DevTools */;
const childContacts = contacts.filter(c => 
  c.relationship?.toLowerCase().includes('child')
);
console.log('Child contacts:', childContacts);
```

### Step 4: Check Relationship Transformation

The frontend transforms relationships. Check if transformation is working:

```javascript
// In browser console
function toDisplayRelationship(storedValue) {
  if (!storedValue) return '';
  const lowerValue = storedValue.toLowerCase();
  const STORAGE_TO_DISPLAY = {
    'co-parent': 'My Co-Parent',
    'my child': 'My Child',
    'my partner': 'My Partner',
    // ... etc
  };
  return STORAGE_TO_DISPLAY[lowerValue] || storedValue;
}

// Test
toDisplayRelationship('my child'); // Should return 'My Child'
toDisplayRelationship('child'); // Should return 'My Child'
```

## Database Queries for Investigation

### Find All Contacts for User
```sql
SELECT 
  id, 
  contact_name, 
  relationship, 
  user_id, 
  created_at 
FROM contacts 
WHERE user_id = (SELECT id FROM users WHERE username = 'username')
ORDER BY created_at DESC;
```

### Find Child Contacts
```sql
SELECT 
  id, 
  contact_name, 
  relationship, 
  created_at 
FROM contacts 
WHERE user_id = (SELECT id FROM users WHERE username = 'username')
  AND (
    LOWER(relationship) = 'my child' 
    OR LOWER(relationship) = 'child'
    OR LOWER(relationship) LIKE '%child%'
  )
ORDER BY created_at DESC;
```

### Find Contacts by Name
```sql
SELECT 
  id, 
  contact_name, 
  relationship, 
  user_id 
FROM contacts 
WHERE contact_name ILIKE '%ChildName%';
```

### Check for Duplicates
```sql
SELECT 
  contact_name, 
  relationship, 
  user_id, 
  COUNT(*) as count 
FROM contacts 
WHERE user_id = (SELECT id FROM users WHERE username = 'username')
GROUP BY contact_name, relationship, user_id 
HAVING COUNT(*) > 1;
```

## Fixing Common Issues

### Fix Wrong User ID
```sql
-- Find the correct user ID
SELECT id, username FROM users WHERE username = 'correct_username';

-- Update contact
UPDATE contacts 
SET user_id = <correct_user_id>
WHERE id = <contact_id>;
```

### Fix Relationship Format
```sql
-- Standardize relationship format
UPDATE contacts 
SET relationship = 'my child'
WHERE user_id = <user_id>
  AND LOWER(relationship) IN ('child', 'my_child', 'My Child');
```

### Fix Missing Relationship
```sql
-- Set default relationship if missing
UPDATE contacts 
SET relationship = 'my child'
WHERE user_id = <user_id>
  AND contact_name = 'ChildName'
  AND relationship IS NULL;
```

## Prevention

### 1. Validate on Creation
Ensure the contact creation endpoint validates:
- `contact_name` is required and not empty
- `relationship` is set (default to 'my child' if creating child)
- `user_id` comes from authenticated session, not request body

### 2. Add Logging
Add logging to contact creation:
```javascript
console.log('[Contact Created]', {
  userId: req.user.id,
  contactName: contactData.contact_name,
  relationship: contactData.relationship,
  contactId: contactId
});
```

### 3. Frontend Validation
Ensure frontend validates before submitting:
- Contact name is not empty
- Relationship is selected
- Form data is properly formatted

## API Endpoints for Diagnosis

- `GET /api/contacts` - Get all contacts (uses authenticated user)
- `GET /api/contacts/diagnose/:contactName` - Diagnostic endpoint
- `POST /api/contacts` - Create contact (verify it succeeds)

## Contact Support

If the issue persists after trying these steps, provide:
1. Output from diagnostic script
2. API response from `/api/contacts`
3. Browser console errors (if any)
4. Server logs from contact creation
5. Database query results showing the contact exists

