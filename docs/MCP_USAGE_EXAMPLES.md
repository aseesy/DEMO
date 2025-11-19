# MCP Usage Examples for LiaiZen

This document provides practical examples of using MCP servers with the LiaiZen co-parenting application.

## SQLite MCP Examples

### Query Users

**Prompt:**
```
Query the database and show me all users with their email addresses and creation dates.
```

**Expected MCP Call:**
```sql
SELECT id, username, email, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Check Contact Relationships

**Prompt:**
```
How many contacts does each user have? Show me a breakdown by relationship type.
```

**Expected MCP Call:**
```sql
SELECT 
  u.username,
  c.relationship,
  COUNT(*) as count
FROM users u
LEFT JOIN contacts c ON c.user_id = u.id
GROUP BY u.username, c.relationship
ORDER BY u.username, count DESC;
```

### Task Statistics

**Prompt:**
```
Show me task completion statistics: how many tasks are open vs completed per user?
```

**Expected MCP Call:**
```sql
SELECT 
  u.username,
  t.status,
  COUNT(*) as task_count
FROM users u
LEFT JOIN tasks t ON t.user_id = u.id
GROUP BY u.username, t.status
ORDER BY u.username, t.status;
```

### Find Users with Incomplete Profiles

**Prompt:**
```
Find all users who haven't completed their profile (missing first_name or last_name).
```

**Expected MCP Call:**
```sql
SELECT id, username, email, first_name, last_name
FROM users
WHERE first_name IS NULL OR first_name = '' 
   OR last_name IS NULL OR last_name = '';
```

### Check Co-Parent Connections

**Prompt:**
```
Show me all co-parent relationships and which users are connected.
```

**Expected MCP Call:**
```sql
SELECT 
  u1.username as user1,
  u2.username as user2,
  c1.contact_name as contact_name,
  c1.relationship
FROM contacts c1
JOIN users u1 ON c1.user_id = u1.id
JOIN contacts c2 ON c1.contact_email = c2.contact_email
JOIN users u2 ON c2.user_id = u2.id
WHERE c1.relationship LIKE '%Co-Parent%'
  AND u1.id != u2.id;
```

### Database Schema Inspection

**Prompt:**
```
Show me the database schema for the tasks table.
```

**Expected MCP Call:**
```sql
PRAGMA table_info(tasks);
```

### Recent Activity

**Prompt:**
```
Show me all messages sent in the last 24 hours with sender and room information.
```

**Expected MCP Call:**
```sql
SELECT 
  m.id,
  u.username as sender,
  r.room_name,
  m.message,
  m.timestamp
FROM messages m
JOIN users u ON m.user_id = u.id
JOIN rooms r ON m.room_id = r.id
WHERE m.timestamp > datetime('now', '-1 day')
ORDER BY m.timestamp DESC;
```

## GitHub MCP Examples

### Create an Issue

**Prompt:**
```
Create a GitHub issue for fixing the task completion bug where tasks don't update properly.
```

**Expected Action:**
- Creates issue with title and description
- Labels appropriately
- Assigns to relevant milestone

### Check Recent Commits

**Prompt:**
```
Show me the last 10 commits in this repository.
```

**Expected Action:**
- Lists recent commits with messages
- Shows author and timestamp
- Links to commit details

### Create Pull Request

**Prompt:**
```
Create a pull request for the responsive design improvements branch.
```

**Expected Action:**
- Creates PR from feature branch
- Adds description
- Requests reviews

## Browser MCP Examples

### Test Login Flow

**Prompt:**
```
Open the app in the browser and test the login flow. Take a screenshot of the login page.
```

**Expected Action:**
- Navigates to localhost:5173
- Takes screenshot
- Tests form interactions

### Verify Dashboard

**Prompt:**
```
Navigate to the dashboard and verify all sections are displaying correctly on mobile viewport.
```

**Expected Action:**
- Resizes browser to mobile size
- Navigates to dashboard
- Takes screenshots
- Reports any layout issues

### Test Task Creation

**Prompt:**
```
Test creating a new task through the UI. Fill out the form and submit it, then verify it appears in the task list.
```

**Expected Action:**
- Clicks "Add Task" button
- Fills form fields
- Submits form
- Verifies task appears in list

## Filesystem MCP Examples

### Check Log Files

**Prompt:**
```
Read the server log file and show me any errors from the last hour.
```

**Expected Action:**
- Reads chat-server/server.log
- Filters for recent errors
- Displays relevant log entries

### Update Configuration

**Prompt:**
```
Update the API timeout in the config file to 45 seconds.
```

**Expected Action:**
- Reads config file
- Updates timeout value
- Saves changes

## Combined MCP Workflows

### Debug User Issue

**Prompt:**
```
A user reported they can't see their tasks. Check:
1. Their user record in the database
2. Their tasks in the database
3. Test the UI to see what's displayed
```

**Expected Workflow:**
1. SQLite MCP: Query user and tasks
2. Browser MCP: Test UI with that user's credentials
3. Filesystem MCP: Check relevant code files
4. Report findings

### Verify Deployment

**Prompt:**
```
Verify the latest deployment:
1. Check recent commits
2. Test the production site in browser
3. Check database for any migration issues
```

**Expected Workflow:**
1. GitHub MCP: Check recent commits
2. Browser MCP: Test production URL
3. SQLite MCP: Verify schema matches expected state

## Best Practices

### 1. Always Verify Database Queries
Before running UPDATE or DELETE queries, always:
- First run a SELECT to see what will be affected
- Confirm with the user before making changes
- Use transactions when possible

### 2. Use Browser MCP for UI Testing
- Test on multiple viewport sizes
- Take screenshots for documentation
- Verify accessibility features

### 3. Combine MCPs for Complex Tasks
- Use SQLite MCP to understand data
- Use Browser MCP to verify UI behavior
- Use Filesystem MCP to check code

### 4. Document MCP Usage
- Note which MCPs were used for each task
- Save important queries for future reference
- Share findings with the team

## Troubleshooting

### SQLite MCP Not Working

**Issue:** "Database not found" or "Permission denied"

**Solutions:**
1. Verify database path in MCP config matches actual location
2. Check file permissions on database file
3. Ensure database file exists (create it if needed)

### GitHub MCP Authentication Failed

**Issue:** "Authentication failed" or "Token invalid"

**Solutions:**
1. Verify GITHUB_TOKEN environment variable is set
2. Check token has correct scopes (repo, read:org)
3. Regenerate token if expired

### Browser MCP Can't Connect

**Issue:** "Connection refused" or "Page not found"

**Solutions:**
1. Ensure dev server is running (npm run dev)
2. Check correct port (usually 5173 for Vite)
3. Verify URL in browser navigation

## Quick Reference

### Common SQLite Queries

```sql
-- All users
SELECT * FROM users;

-- User's contacts
SELECT * FROM contacts WHERE user_id = ?;

-- User's tasks
SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC;

-- Recent messages
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50;

-- Room members
SELECT u.username FROM users u 
JOIN room_members rm ON u.id = rm.user_id 
WHERE rm.room_id = ?;
```

### Common Browser Actions

- Navigate: `Navigate to http://localhost:5173`
- Screenshot: `Take a screenshot of the current page`
- Click: `Click on the "Add Task" button`
- Type: `Type "test@example.com" into the email field`
- Resize: `Resize browser to mobile size (375x667)`

### Common GitHub Actions

- List issues: `Show me all open issues`
- Create issue: `Create an issue titled "..." with description "..."`
- View PR: `Show me pull request #123`
- Recent commits: `Show me the last 5 commits`

