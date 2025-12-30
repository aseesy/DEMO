Main Implementation
chat-server/aiMediator.js - Main AI mediation system
Handles conflict detection, message analysis, interventions, rewrites
References the constitution
Implements the 1-2-3 coaching framework
chat-server/aiMediator.js.backup - Backup of previous version
chat-server/ai-mediation-constitution.md - Constitution document
Immutable principles for AI mediation
1-2-3 coaching framework
Decision criteria and enforcement rules
chat-server/openaiClient.js - OpenAI API client for AI calls
Communication Profile & Context
chat-server/libs/communication-profile/index.js - Main communication profile library
chat-server/libs/communication-profile/mediationContext.js - Context building for mediation
chat-server/libs/communication-profile/profileLoader.js - Loads user communication profiles
chat-server/libs/communication-profile/profilePersister.js - Saves/updates communication profiles
chat-server/libs/communication-profile/temporalDecay.js - Temporal decay logic for profiles
chat-server/libs/communication-profile/**tests**/mediationContext.test.js - Tests for mediation context
Language Analysis
chat-server/libs/language-analyzer/index.js - Language analysis library
specs/005-language-analyzer/spec.md - Language analyzer specification
Supporting Systems
chat-server/userContext.js - User context for AI mediation
chat-server/proactiveCoach.js - Proactive coaching system
chat-server/contactIntelligence.js - Contact intelligence (may inform mediation)
chat-server/threadManager.js - Thread management (may include AI features)
Frontend Components
chat-client-vite/src/components/MediationBanner.jsx - UI component for displaying mediation interventions
chat-client-vite/src/components/MediationBanner.test.jsx - Tests for mediation banner
chat-client-vite/src/ChatRoom.jsx - Main chat room (handles AI mediation display)
Specifications & Documentation
specs/004-ai-mediation-constitution/spec.md - Specification for the constitution feature
specs/006-mediator-speaker-perspective/spec.md - Specification for sender/receiver perspective
specs/006-mediator-speaker-perspective/plan.md - Implementation plan
specs/006-mediator-speaker-perspective/tasks.md - Task breakdown
specs/mediation-flow-update/spec.md - Mediation flow updates
docs/README_AI_MEDIATOR.md - AI mediator documentation
docs/AI_MEDIATOR_IMPROVEMENTS.md - Improvements documentation
docs/AI_MEDIATOR_CONTEXTUAL_AWARENESS.md - Contextual awareness documentation
docs-archive/AI_MEDIATION_AUDIT.md - Historical audit document
Database & Migrations
chat-server/migrations/002_communication_profiles.sql - Database schema for communication profiles
Deprecated (Historical Reference)
chat-server/deprecated/interventionPolicy.js - Old intervention policy (deprecated)
chat-server/deprecated/emotionalModel.js - Old emotional model (deprecated)
chat-server/deprecated/conflictPredictor.js - Old conflict predictor (deprecated)
SDD Framework Integration
sdd-agentic-framework/specs/002-sender-profile-mediation/spec.md - SDD framework spec
sdd-agentic-framework/specs/002-sender-profile-mediation/plan.md - SDD framework plan
sdd-agentic-framework/specs/002-sender-profile-mediation/tasks.md - SDD framework tasks
