# Aider Usage Guide

Aider is an AI pair programming tool that works directly in your terminal. It can read, understand, and modify your codebase.

## Basic Usage

### 1. Start Aider in Chat Mode

```bash
# Start aider in the project directory
cd /Users/athenasees/Desktop/chat
aider

# Or specify files to work with
aider chat-server/routes/profile.js

# Or multiple files
aider chat-server/routes/profile.js chat-server/src/services/profile/profileService.js
```

### 2. Set Up API Key

Aider needs an API key. You can set it via:

```bash
# Environment variable (recommended)
export AIDER_ANTHROPIC_API_KEY="your-key-here"
export AIDER_OPENAI_API_KEY="your-key-here"  # if using OpenAI

# Or pass it directly
aider --anthropic-api-key "your-key-here"
```

### 3. Common Commands in Aider

Once aider is running, you can:

- **Ask questions**: "How does the profile route work?"
- **Request changes**: "Add error handling to the profile update endpoint"
- **Refactor code**: "Refactor this function to use async/await"
- **Fix bugs**: "Fix the validation error in profileService"
- **Add features**: "Add a new endpoint to get user statistics"

### 4. Example Workflow

```bash
# Start aider with specific files
aider chat-server/routes/profile.js chat-server/src/services/profile/profileService.js

# In aider chat, you can say:
# "Add validation to ensure email is required when updating profile"
# "Refactor getComprehensiveProfile to use the repository pattern"
# "Add unit tests for the updatePrivacySettings method"
```

## Useful Aider Commands

### File Operations

```bash
# Add files to the conversation
/file chat-server/routes/dashboard.js

# Read a file (read-only, won't be edited)
/read chat-server/database.js

# Show which files are in context
/files
```

### Git Integration

```bash
# Aider automatically tracks git changes
# View diffs before committing
/show-diffs

# Commit changes with AI-generated message
/commit

# Run tests before committing
/test
```

### Code Quality

```bash
# Lint and fix code
/lint

# Run tests
/test

# Set up auto-linting
# (configured in .aider.conf.yml)
```

## Configuration

Create `.aider.conf.yml` in your project root:

```yaml
# .aider.conf.yml
model: anthropic/claude-3-7-sonnet-20250219
auto-commits: true
auto-lint: true
test-cmd: 'cd chat-server && npm test'
lint-cmd:
  javascript: 'cd chat-server && npm run lint:fix'
git: true
```

## Example: Refactoring a Route

```bash
# Start aider with the route file
aider chat-server/routes/dashboard.js

# In aider chat:
# "Refactor this route to use dependency injection like profile.js does"
# "Add error handling using handleServiceError middleware"
# "Create a DashboardService and move business logic there"
```

## Example: Adding Tests

```bash
# Start aider with test and source files
aider chat-server/__tests__/routes/dashboard.routes.test.js chat-server/routes/dashboard.js

# In aider chat:
# "Create integration tests for all dashboard endpoints"
# "Add tests for error cases"
# "Mock the dashboardService like profileService tests do"
```

## Example: Fixing Bugs

```bash
# Start aider with relevant files
aider chat-server/routes/notifications.js chat-server/src/services/notificationService.js

# In aider chat:
# "Fix the bug where notifications aren't being marked as read"
# "Add validation to prevent duplicate notifications"
```

## Tips

1. **Be Specific**: Instead of "fix this", say "fix the validation error on line 45"
2. **Provide Context**: Mention related files or patterns from your codebase
3. **Use Examples**: Reference similar code that works (e.g., "like profile.js does")
4. **Iterate**: Start with small changes, then build up
5. **Review Changes**: Always review aider's changes before committing

## Advanced Features

### Browser UI

```bash
# Open aider in your browser
aider --gui

# Or
aider --browser
```

### One-Shot Commands

```bash
# Run a single command and exit
aider chat-server/routes/profile.js --message "Add JSDoc comments to all functions"

# Or from a file
aider --message-file instructions.txt
```

### Model Selection

```bash
# Use specific model
aider --model anthropic/claude-3-7-sonnet-20250219
aider --model openai/gpt-4o
aider --model openai/gpt-4o-mini  # faster, cheaper
```

### Architect Mode

```bash
# Use architect edit format for complex refactoring
aider --architect chat-server/routes/
```

## Integration with Your Workflow

### Before Starting Work

```bash
# 1. Navigate to project
cd /Users/athenasees/Desktop/chat

# 2. Start aider with relevant files
aider chat-server/routes/profile.js chat-server/src/services/profile/

# 3. Ask aider to understand the codebase
# "Review this code and explain the dependency injection pattern"
```

### During Development

```bash
# Keep aider running in a terminal
# Make requests as you work:
# "Add a new endpoint for profile search"
# "Refactor this to use the service layer"
# "Add validation for the new field"
```

### Before Committing

```bash
# In aider:
/test          # Run tests
/lint          # Fix linting issues
/show-diffs    # Review changes
/commit        # Commit with AI-generated message
```

## Troubleshooting

### API Key Issues

```bash
# Check if key is set
echo $AIDER_ANTHROPIC_API_KEY

# Set it if missing
export AIDER_ANTHROPIC_API_KEY="your-key"
```

### Model Not Found

```bash
# List available models
aider --list-models

# Use a specific model
aider --model anthropic/claude-3-7-sonnet-20250219
```

### Files Not Found

```bash
# Make sure you're in the right directory
pwd

# Use absolute paths if needed
aider /Users/athenasees/Desktop/chat/chat-server/routes/profile.js
```

## Best Practices

1. **Start Small**: Begin with single files, then expand
2. **Review Changes**: Always review aider's edits
3. **Use Git**: Aider works best with git repositories
4. **Be Explicit**: Clear instructions get better results
5. **Iterate**: Break large tasks into smaller steps
6. **Test**: Run tests after aider makes changes
7. **Document**: Ask aider to add comments/JSDoc

## Example Session

```bash
$ cd /Users/athenasees/Desktop/chat
$ aider chat-server/routes/dashboard.js

> Aider: I can help you edit chat-server/routes/dashboard.js

> You: Refactor this route to use dependency injection like profile.js

> Aider: [Analyzes code, makes changes]

> You: Add error handling using handleServiceError

> Aider: [Adds error handling]

> You: /test

> Aider: [Runs tests, fixes any issues]

> You: /commit

> Aider: [Creates commit with message]
```

## Resources

- Aider documentation: https://aider.chat
- GitHub: https://github.com/paul-gauthier/aider
- Community: https://aider.chat/docs
