# Quick Start Guide

## Quick Feedback (Fastest Method)

Just add a comment in your code or chat:

```
@feedback ⭐ design-system
Context: Used teal-medium class instead of hardcoded hex
```

Or for negative feedback:

```
@feedback ❌ over-engineering
Context: Created too many files for simple feature
Suggestion: Start with one file, refactor if needed
```

## Using the Script (More Detailed)

Add detailed feedback with the script:

```bash
# Positive feedback
node .cursor/scripts/add-feedback.js ⭐ "Good refactoring" "Extracted common logic" --category code-quality --files "aiHelperUtils.js"

# Negative feedback with suggestion
node .cursor/scripts/add-feedback.js ❌ "Too complex" "Created 5 files for simple feature" --category workflow --suggestion "Start simple, refactor later"
```

## View Your Feedback

Generate a report:

```bash
node .cursor/scripts/process-feedback.js report
```

This creates `feedback/report.md` with:

- Statistics (positive/negative ratios)
- Top patterns (what's working, what's not)
- Goal progress
- Recent feedback entries

## Common Feedback Patterns

### ⭐ Good Behaviors

- `@feedback ⭐ design-system` - Good use of design tokens
- `@feedback ⭐ refactoring` - Good code organization
- `@feedback ⭐ explanation` - Clear, helpful explanation
- `@feedback ⭐ proactive` - Good proactive suggestions

### ❌ Bad Behaviors

- `@feedback ❌ hardcoded-values` - Should use design tokens
- `@feedback ❌ over-engineering` - Too complex for the task
- `@feedback ❌ unclear-explanation` - Explanation was confusing
- `@feedback ❌ wrong-tool` - Used wrong tool for the job

### ⚠️ Warnings

- `@feedback ⚠️ potential-issue` - Something to watch out for
- `@feedback ⚠️ edge-case` - Might not handle edge cases

## Setting Goals

Edit `.cursor/feedback/goals.json`:

```json
{
  "goals": [
    {
      "id": "design-compliance",
      "name": "Design System Compliance",
      "description": "90% positive feedback on design-related changes",
      "target": "90%",
      "current": "0%",
      "created": "2025-01-27T10:30:00Z",
      "deadline": "2025-02-27T10:30:00Z"
    }
  ]
}
```

## Tips

1. **Be specific** - Include context about what happened
2. **Be timely** - Give feedback right after the behavior
3. **Include suggestions** - Help guide improvement
4. **Track patterns** - Look for recurring issues
5. **Set goals** - Focus on specific improvements

## Integration with Cursor

The feedback system works alongside Cursor's built-in memory:

- Feedback patterns inform future behavior
- Goals help track progress over time
- Reports provide insights for improvement

You can reference feedback in conversations:

- "Based on previous feedback, I should use design tokens"
- "Previous feedback showed over-engineering is an issue"
- "Let me check the feedback report for patterns"
