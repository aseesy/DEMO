# Coding Feedback System

**⚠️ DEPRECATED**: This feedback system has been archived. See `.cursor/rules` "Anti-Patterns to Avoid" section for current guidance.

## Overview

This system allowed you to provide feedback on AI coding behaviors to help improve future performance. The system has been replaced with direct rule-based guidance in `.cursor/rules`.

## Quick Feedback Commands

### Star System (Quick Rating)
- `@feedback ⭐` - Mark current behavior as excellent (do more of this)
- `@feedback ❌` - Mark current behavior as problematic (avoid this)
- `@feedback ⭐⭐` - Exceptional behavior (exemplary)
- `@feedback ⚠️` - Warning/concern (needs attention)

### Contextual Feedback
- `@feedback ⭐ refactoring` - Good refactoring approach
- `@feedback ❌ over-engineering` - Too complex for the task
- `@feedback ⭐ design-system` - Good adherence to design system
- `@feedback ❌ hardcoded-values` - Should use design tokens

## Feedback Categories

### Code Quality
- **Architecture decisions** - How code is structured
- **Refactoring approach** - Complexity vs simplicity
- **Design system compliance** - Following design tokens and patterns
- **Error handling** - Robustness and user experience
- **Testing approach** - Test coverage and strategy

### Communication
- **Explanations** - Clarity and helpfulness
- **Proactive suggestions** - When to suggest vs when to just do
- **Question asking** - When clarification is needed vs when to infer

### Workflow
- **File organization** - Which files to edit/create
- **Change scope** - How much to change at once
- **Tool usage** - When to use which tools

## Detailed Feedback Format

```markdown
@feedback {
  "rating": "⭐" | "❌" | "⭐⭐" | "⚠️",
  "category": "code-quality" | "communication" | "workflow" | "design",
  "context": "Brief description of what happened",
  "behavior": "Specific behavior being rated",
  "suggestion": "What should happen instead (optional)",
  "files": ["file1.js", "file2.jsx"] (optional)
}
```

## Examples

### Good Behavior
```
@feedback ⭐ design-system
Context: Used teal-medium class instead of hardcoded hex
Behavior: Consistently using design tokens
```

### Bad Behavior
```
@feedback ❌ over-engineering
Context: Created 5 new files for a simple feature
Behavior: Over-complicating simple tasks
Suggestion: Start simple, refactor if needed
```

### Pattern Recognition
```
@feedback ⭐ refactoring
Context: Extracted common logic to utility file
Behavior: Reducing duplication proactively
Files: [aiHelperUtils.js]
```

## Feedback Storage

Feedback is stored in `.cursor/feedback/` directory:
- `feedback.json` - All feedback entries (chronological)
- `patterns.json` - Aggregated patterns and preferences
- `goals.json` - Goal tracking and progress

## Goal Tracking

Set goals for improvement:
- `@goal improve-design-compliance` - Track design system adherence
- `@goal reduce-over-engineering` - Track simplicity improvements
- `@goal better-explanations` - Track communication clarity

View progress:
- `@feedback stats` - Show feedback statistics
- `@feedback goals` - Show goal progress
- `@feedback patterns` - Show identified patterns

