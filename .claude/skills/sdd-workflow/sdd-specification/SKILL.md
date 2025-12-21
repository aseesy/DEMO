---
name: sdd-specification
description: |
  Create feature specifications using Specification-Driven Development (SDD) methodology.
  Use when starting a new feature, documenting requirements, or executing the /specify command.

  This skill guides the creation of comprehensive feature specifications following the SDD
  framework's spec-template.md structure. It ensures specifications include all required
  sections, validates completeness, detects domains/agents needed, and prepares for the
  planning phase.

  Triggered by: /specify command, user request for "specification", "requirements",
  "feature spec", or "document requirements".
allowed-tools: Read, Write, Bash, Grep
---

# SDD Specification Skill

## When to Use

Activate this skill when:

- User invokes `/specify` command
- User requests creation of a feature specification
- User asks to "document requirements" or "write a spec"
- Starting a new feature from scratch
- Need to formalize requirements for a feature

**Trigger Keywords**: specification, spec, requirements, feature description, document requirements, /specify

## Procedure

### Step 1: Branch Management

**Ask user about branch preference**:

```
"Would you like to create a new feature branch, or work on the current branch?"
```

**If new branch requested**:

- Run: `.specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"`
- Script will handle branch creation with user approval (Principle VI)
- Script returns JSON with `branch`, `spec_file`, and `feature_number`

**If current branch**:

- Use current branch name
- Create spec file at: `specs/[current-branch]/spec.md`
- Ensure `specs/[current-branch]/` directory exists

### Step 2: Load Template

**Read the specification template**:

```bash
Read: .specify/templates/spec-template.md
```

**Template sections to preserve**:

- Title (# Feature Name)
- Overview
- User Stories
- Functional Requirements
- Acceptance Criteria
- Technical Considerations
- Dependencies
- Risks
- Success Metrics

### Step 3: Write Specification

**Fill the template** with details from user's feature description:

- Replace all placeholders with concrete information
- Maintain section structure and order
- Use clear, measurable acceptance criteria
- Include user stories in "As a [role], I want [capability], so that [benefit]" format
- Document technical considerations and dependencies

**Write to spec file**:

```bash
Write: specs/[branch-name]/spec.md
```

### Step 4: Domain Detection

**Run domain detection** to identify which agents/domains are involved:

```bash
.specify/scripts/bash/detect-phase-domain.sh --file specs/[branch-name]/spec.md
```

**Capture output**:

- Detected domains (frontend, backend, database, etc.)
- Suggested agents (specialist agents to involve)
- Delegation strategy (single-agent vs multi-agent)

**Report to user**:

```
Detected domains: [list]
Suggested agents: [list]
Delegation strategy: [single-agent or multi-agent]
```

### Step 5: Validate Specification

**Run specification validation**:

```bash
.specify/scripts/bash/validate-spec.sh --file specs/[branch-name]/spec.md
```

**Validation checks** (4 required, 5 recommended, 1 optional):

- Required: Title, Requirements, Acceptance Criteria, User Stories
- Recommended: Overview, Technical Considerations, Dependencies, Risks, Success Metrics
- Optional: Timeline

**Report validation results**:

- Overall score (X/10 checks passing)
- Readiness status (ready/needs-improvement)
- Specific recommendations for improvement

### Step 6: Report Completion

**Provide comprehensive summary**:

```
✅ Feature Specification Created

Branch: [branch-name]
Spec File: specs/[branch-name]/spec.md
Feature Number: [###] (if new branch)

Domains Detected: [list]
Suggested Agents: [list]

Validation Score: X/10
Status: [ready/needs-improvement]

Next Step: Run /plan to generate implementation plan
```

## Constitutional Compliance

### Principle VI: Git Operation Approval

- **NEVER** create branches without explicit user approval
- Ask user if they want a new branch
- If yes, run create-new-feature.sh which handles approval
- Script will request approval before branch creation

### Principle VIII: Documentation Synchronization

- Specification is primary documentation artifact
- Must include all required sections per template
- Specification drives planning and implementation
- Keep specification in sync with feature evolution

### Principle X: Agent Delegation Protocol

- Domain detection identifies which agents are needed
- Report suggested agents for implementation phase
- If multi-domain feature, note that task-orchestrator should coordinate

## Examples

### Example 1: New User Authentication Feature

**User Request**: "/specify User authentication with email and password"

**Skill Execution**:

1. Ask: "Would you like to create a new feature branch, or work on the current branch?"
2. User chooses new branch
3. Run: `.specify/scripts/bash/create-new-feature.sh --json "User authentication with email and password"`
4. Script creates branch: `001-user-authentication`
5. Load template from `.specify/templates/spec-template.md`
6. Write specification with:
   - Title: "User Authentication"
   - User stories: "As a new user, I want to register with email/password..."
   - Requirements: Authentication endpoints, password hashing, session management
   - Acceptance criteria: User can register, login, logout
7. Run domain detection → detects: backend, database, security
8. Run validation → 9/10 checks passing (missing timeline)
9. Report completion with suggested agents: backend-architect, database-specialist, security-specialist

**Expected Output**:

```
✅ Feature Specification Created

Branch: 001-user-authentication
Spec File: specs/001-user-authentication/spec.md
Feature Number: 001

Domains Detected: backend, database, security
Suggested Agents: backend-architect, database-specialist, security-specialist
Delegation Strategy: multi-agent (recommend task-orchestrator)

Validation Score: 9/10
Status: ready

Recommendations:
- Consider adding implementation timeline

Next Step: Run /plan to generate implementation plan
```

### Example 2: Update Existing Specification

**User Request**: "/specify Add OAuth support to existing authentication"

**Skill Execution**:

1. Ask about branch (user chooses current branch: 001-user-authentication)
2. Read existing spec: `specs/001-user-authentication/spec.md`
3. Update specification to add OAuth sections
4. Run domain detection → detects: backend, integration, security
5. Run validation → 10/10 checks passing
6. Report completion with updated suggested agents

## Agent Collaboration

### specification-agent

**When to delegate**: For creating user stories, acceptance criteria, functional requirements from business needs

**What they handle**: Translating business requirements into technical specifications using SDD methodology

### task-orchestrator

**When to delegate**: When multi-domain feature detected (3+ domains)

**What they handle**: Coordinating multiple specialized agents during implementation

### Domain Specialists

**When to notify**: Report suggested agents based on domain detection

**What they handle**: Implementation of specification in their domain

## Validation

Verify the skill executed correctly:

- [ ] Specification file created at correct path
- [ ] All required sections present in specification
- [ ] Domain detection executed and reported
- [ ] Validation executed and reported
- [ ] Suggested agents reported to user
- [ ] Validation score indicates readiness
- [ ] User notified about next step (/plan)

## Troubleshooting

### Issue: Branch creation fails

**Cause**: User denied git approval or branch already exists

**Solution**:

- If user denied: Ask if they want to use current branch instead
- If branch exists: Ask if they want to update existing spec or create different branch name

### Issue: Validation score low (<7/10)

**Cause**: Specification missing recommended sections

**Solution**:

- Review validation output for specific missing sections
- Ask user for additional information
- Update specification with missing sections
- Re-run validation

### Issue: No domains detected

**Cause**: Specification too vague or generic

**Solution**:

- Review specification for technical details
- Ask user clarifying questions about implementation
- Add technical considerations section with specific technologies
- Re-run domain detection

## Notes

- Specification is the foundation of SDD workflow (Spec → Plan → Tasks)
- High-quality specifications lead to better plans and tasks
- Domain detection early enables proactive agent coordination
- Validation ensures specifications are actionable
- All specifications must follow template structure for consistency
- Template located at: `.specify/templates/spec-template.md`

## Related Skills

- **sdd-planning**: Next step after specification (generates implementation plan)
- **domain-detection**: Standalone domain detection for existing files
- **specification-agent**: Agent that can be delegated specification work
