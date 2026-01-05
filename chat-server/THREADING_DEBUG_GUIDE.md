# Threading Debug Guide

## Problem

Message history is not being automatically threaded into conversations organized by topics.

## Debugging Steps

### 1. Check Backend Logs

When a user joins a room, you should see these logs in the backend console:

```
[ThreadHandler] 🔍 DEBUG: maybeAnalyzeRoomOnJoin called for room <roomId>
[ThreadHandler] 🔍 DEBUG: Found X existing threads
[ThreadHandler] 🔍 DEBUG: Found X recent messages
```

**If you see:**

- `Room already has threads, skipping analysis` → Threads exist, analysis skipped
- `Room has only X messages, skipping analysis` → Need 5+ messages
- `OPENAI_API_KEY not set` → API key missing
- `Analysis complete for room X, created 0 threads` → Analysis ran but no threads created

### 2. Check OpenAI API Key

The analysis requires `OPENAI_API_KEY` to be set in environment variables.

```bash
# Check if set
echo $OPENAI_API_KEY

# Or check .env file
cat chat-server/.env | grep OPENAI_API_KEY
```

### 3. Run Debug Script

Use the debug script to check threading status:

```bash
cd chat-server
node debug-threading.js <roomId>
```

This will show:

- OpenAI API key status
- Existing threads
- Message count and filtering
- Analysis attempt and results
- Database thread status

### 4. Check Message Requirements

Analysis requires:

- **Minimum 5 messages** in the room
- Messages must be from **last 30 days**
- Messages must not be: system, private, or flagged
- Messages must have text content

### 5. Check Analysis Flow

The analysis flow is:

1. **User joins room** → `connectionHandler.js` calls `maybeAnalyzeRoomOnJoin`
2. **Check conditions**:
   - No existing threads? ✓
   - 5+ messages? ✓
   - OpenAI API key set? ✓
3. **Trigger analysis** → `threadManager.analyzeConversationHistory(roomId, 100)`
4. **AI Analysis** → `AIThreadAnalyzer.analyzeConversationHistory`
   - Gets messages from messageStore
   - Filters messages (last 30 days, no system/private/flagged)
   - Calls OpenAI API to analyze conversation
   - Gets suggestions for threads
   - Creates threads from suggestions
   - Adds messages to threads
5. **Emit events**:
   - `thread_created` for each thread
   - `conversation_analysis_complete` when done

### 6. Common Issues

#### Issue: Analysis not triggered

**Symptoms**: No logs about analysis starting
**Causes**:

- User not joining room properly
- `maybeAnalyzeRoomOnJoin` not called
- `threadManager` not available in services

#### Issue: Analysis skipped

**Symptoms**: Logs show "skipping analysis"
**Causes**:

- Threads already exist
- Not enough messages (< 5)
- OpenAI API key not set

#### Issue: Analysis runs but no threads created

**Symptoms**: "Analysis complete, created 0 threads"
**Causes**:

- OpenAI API returned no suggestions
- Suggestions filtered out (confidence < 60, messageCount < 3)
- Not enough matching messages found (need 3+ per thread)
- Messages already assigned to threads
- Thread creation failed

#### Issue: Threads created but not visible

**Symptoms**: Backend logs show threads created, but frontend doesn't show them
**Causes**:

- `thread_created` events not emitted
- Frontend not listening to `thread_created` events
- Threads not loaded in frontend state

### 7. Manual Testing

To manually trigger analysis:

```javascript
// In browser console (when connected to socket)
socket.emit('analyze_conversation_history', { roomId: 'your-room-id', limit: 100 });
```

### 8. Check Frontend Event Handling

Frontend should:

1. Listen for `thread_created` events
2. Update `ThreadService` state
3. Re-render dashboard with new threads

Check `ThreadService.js`:

- `handleThreadCreated` method exists
- Subscribed to `thread_created` event
- Updates `threads` array correctly

### 9. Database Check

Check if threads exist in database:

```sql
SELECT id, title, category, message_count, created_at
FROM threads
WHERE room_id = '<roomId>'
ORDER BY created_at DESC;
```

### 10. Enable Verbose Logging

The debug logging I added will show:

- When analysis is triggered
- Message counts and filtering
- OpenAI API calls
- Suggestions generated
- Thread creation attempts
- Success/failure reasons

Look for logs prefixed with `🔍 DEBUG:` for detailed information.

## Next Steps

1. **Check backend logs** when user joins
2. **Run debug script** to see current state
3. **Verify OpenAI API key** is set
4. **Check message count** meets requirements
5. **Review analysis logs** for errors or warnings
