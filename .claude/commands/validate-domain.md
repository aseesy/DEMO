---
description: Validate feature specifications and implementations against coparentliaizen.com domain requirements and co-parenting best practices.
---

**AGENT REQUIREMENT**: This command can be executed by any agent, but domain validation is best handled by agents with co-parenting domain knowledge.

**If specialized validation is needed**, delegate to appropriate agent:
```
Use the Task tool to invoke specialized agent:
- subagent_type: "specification-agent" (for spec validation)
- subagent_type: "backend-architect" (for architecture validation)
- subagent_type: "security-specialist" (for privacy/security validation)
- description: "Execute /validate-domain command"
- prompt: "Execute the /validate-domain command. Arguments: $ARGUMENTS"
```

---

## Execution Instructions

Given the feature specification or implementation provided as an argument, do this:

1. **Load Domain Requirements**:
   - Read `.specify/templates/spec-template.md` for co-parenting domain context
   - Review LiaiZen mission: "Better Co-Parenting Through Better Communication"
   - Check for child-centered outcomes focus
   - Verify privacy and security considerations

2. **Validate Against Domain Principles**:
   - **Child-Centered Outcomes**: Does the feature ultimately benefit children's wellbeing?
   - **Conflict Reduction**: Does the feature help reduce misunderstandings and tensions?
   - **Privacy & Security**: Does the feature protect sensitive family information?
   - **Accessibility**: Does the feature work for parents with varying technical skills?
   - **Real-Time Communication**: Does the feature support asynchronous communication (different time zones)?

3. **Check Co-Parenting Specific Considerations**:
   - Handles unavailable/unresponsive co-parents gracefully
   - Maintains audit trail for legal/custody purposes
   - Provides conflict resolution resources
   - Complies with privacy regulations (COPPA, GDPR)
   - Supports selective information sharing
   - Handles invitation states clearly

4. **Validate Technical Integration**:
   - Integrates with existing AI mediation service (`chat-server/aiMediator.js`)
   - Supports real-time communication via WebSocket
   - Works with existing room and contact management
   - Compatible with mobile/PWA requirements
   - Maintains backward compatibility with database schema

5. **Run Validation Script**:
   - Execute `.specify/scripts/bash/validate-domain.sh --file SPEC_FILE` or `--directory FEATURE_DIR`
   - Script checks for domain-specific requirements
   - Reports validation score and recommendations

6. **Generate Validation Report**:
   - List all domain requirements checked
   - Report pass/fail status for each requirement
   - Provide specific recommendations for improvements
   - Score overall domain alignment (0-100)
   - Identify missing co-parenting considerations

7. **Report Completion**:
   - Validation score
   - Passed requirements
   - Failed requirements with recommendations
   - Domain alignment percentage
   - Readiness for co-parenting context

**Note**: This command does NOT modify files - it only validates and reports. All recommendations are suggestions for manual review.

**Usage Examples**:
- `/validate-domain spec.md` - Validate a feature specification
- `/validate-domain specs/001-feature-name/` - Validate entire feature directory
- `/validate-domain --component ContactsPanel.jsx` - Validate a specific component

