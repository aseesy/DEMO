# PRD Quick Reference

## What is the PRD?

Your **Product Requirements Document (PRD)** is the Single Source of Truth for your entire project. It defines:
- What you're building and why
- Who you're building it for
- What success looks like
- How the framework should be customized

## How to Complete Your PRD

### 1. Executive Summary (Required)
- **Vision**: One paragraph - what are you building?
- **Problem**: What specific pain are you solving?
- **Success Metrics**: How do you measure success? (must be quantifiable)
- **Target Audience**: Who uses this?

### 2. User Personas (Required)
Create 2-4 realistic personas:
- Background, goals, pain points
- Be specific! "Sarah, a mid-level backend engineer..." not "A developer"

### 3. Core Features (Required)
For each feature:
- User story: "As a [persona], I want [action], so that [benefit]"
- Acceptance criteria: Specific, testable conditions
- Priority: High/Medium/Low

### 4. Constitutional Customization (Required)
**CRITICAL**: Customize all 14 principles for your project:

1. **Library-First** - How does this apply to you?
2. **Test-First** - Your testing philosophy?
3. **Contract-First** - Your API standards?
4. **Idempotency** - Which operations need this?
5. **Progressive Enhancement** - Your feature flag strategy?
6. **Git Approval** - NO automatic git ops (keep as-is)
7. **Observability** - Your logging/monitoring approach?
8. **Documentation** - Your doc maintenance strategy?
9. **Dependency Management** - Your approval process?
10. **Agent Delegation** - Custom agents you'll need?
11. **Input Validation** - Your validation standards?
12. **Design System** - Your UI/UX principles?
13. **Access Control** - Your tier strategy?
14. **AI Model Selection** - Keep defaults or customize?

### 5. Release Strategy (Required)
- **MVP**: Minimum features to launch (be ruthless!)
- **Phase 2, 3, N**: Future feature groupings
- **Success Criteria**: How to measure each phase

## Using the PRD

### When Running /specify
The specification-agent will:
- Pull user stories from your PRD
- Reference personas for context
- Use acceptance criteria patterns
- Align with release phases

### When Running /plan
The planning-agent will:
- Read constitutional customizations
- Apply technical constraints
- Use integration requirements
- Validate against PRD principles

### After PRD Approval
1. **Update Constitution**:
   ```bash
   # Edit .specify/memory/constitution.md
   # Add project-specific guidance from PRD for each principle
   ```

2. **Create Custom Agents**:
   ```bash
   # For each agent identified in PRD Principle X
   /create-agent agent-name "Agent purpose"
   ```

3. **Begin Features**:
   ```bash
   # For each MVP feature
   /specify "Feature description"
   ```

## PRD Review Checklist

Before finalizing, verify:
- [ ] Vision is clear and compelling
- [ ] Success metrics are quantifiable
- [ ] All 14 constitutional principles customized
- [ ] MVP is truly minimal
- [ ] User personas are specific and realistic
- [ ] All features have acceptance criteria
- [ ] Technical constraints documented
- [ ] Open questions identified with owners
- [ ] Stakeholders approved

## Getting Help

Use the **prd-specialist agent** in Claude Code:
- Ask questions about any PRD section
- Get guidance on prioritization
- Validate completeness
- Review constitutional customizations

The PRD is your north star. Invest time here to save time later!
