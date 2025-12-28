# Pattern Configuration

Centralized pattern definitions for message analysis.

## Structure

- `greetings.js` - Common greetings that never need mediation
- `polite-responses.js` - Polite responses that never need mediation
- `polite-requests.js` - Patterns for detecting polite requests
- `positive-messages.js` - Patterns for detecting positive messages
- `index.js` - Main export file

## Usage

```javascript
const {
  ALLOWED_GREETINGS,
  ALLOWED_POLITE,
  POLITE_REQUEST_PATTERNS,
  POSITIVE_PATTERNS,
} = require('../../config/patterns');
```

## Pattern Synchronization

These patterns should match the frontend patterns in `chat-client-vite/src/config/patterns/` where applicable.

To verify synchronization, run:
```bash
node scripts/validate-pattern-sync.js
```

## Adding New Patterns

1. Add pattern to appropriate file (e.g., `polite-requests.js`)
2. Export from `index.js`
3. Update frontend patterns to match (if applicable)
4. Run validation script
5. Test with sample messages

## Pattern Format

- **Regex patterns**: Use for complex matching (e.g., `/\b(word1|word2)\b/i`)
- **String arrays**: Use for exact matches (e.g., `['ok', 'yes', 'no']`)

## Best Practices

- Keep patterns focused and specific
- Test patterns with edge cases
- Document pattern purpose
- Keep frontend/backend in sync
- Version patterns when making breaking changes

