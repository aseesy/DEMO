# Feature Prioritization Framework

**Purpose**: Document feature prioritization decisions with rationale. Serves as historical record and template for future prioritization.

**Last Updated**: 2025-11-26
**Version**: 1.0.0
**Framework**: RICE (Reach, Impact, Confidence, Effort)

---

## RICE Framework Overview

### Scoring Criteria

| Factor         | Description                                         | Scale                                                        |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| **Reach**      | How many users will this affect per quarter?        | Number of users                                              |
| **Impact**     | How much will this move the needle for those users? | 0.25 (Minimal), 0.5 (Low), 1 (Medium), 2 (High), 3 (Massive) |
| **Confidence** | How sure are we about our estimates?                | 0.5 (Low), 0.8 (Medium), 1.0 (High)                          |
| **Effort**     | How many person-weeks to build?                     | Person-weeks                                                 |

### RICE Score Formula

```
RICE Score = (Reach × Impact × Confidence) / Effort
```

Higher score = Higher priority

---

## MVP Feature Prioritization (Phase 1)

### Prioritized Feature List

| Rank | Feature                | Reach | Impact | Confidence | Effort | RICE Score | Status      |
| ---- | ---------------------- | ----- | ------ | ---------- | ------ | ---------- | ----------- |
| 1    | AI Message Mediation   | 500   | 3      | 0.8        | 6      | **200**    | In Progress |
| 2    | Real-time Messaging    | 500   | 3      | 1.0        | 4      | **375**    | Complete    |
| 3    | User Authentication    | 500   | 2      | 1.0        | 3      | **333**    | Complete    |
| 4    | Co-parent Invitations  | 500   | 2      | 0.8        | 2      | **400**    | In Progress |
| 5    | Contact Management     | 300   | 1      | 0.8        | 3      | **80**     | In Progress |
| 6    | Basic Task Management  | 200   | 1      | 0.8        | 4      | **40**     | Planned     |
| 7    | Message History/Search | 400   | 1      | 0.8        | 2      | **160**    | Planned     |
| 8    | Mobile Responsive UI   | 450   | 2      | 1.0        | 3      | **300**    | In Progress |

---

## Feature Details & Rationale

### Feature 1: AI Message Mediation

**RICE Score**: 200

| Factor         | Value       | Rationale                                                  |
| -------------- | ----------- | ---------------------------------------------------------- |
| **Reach**      | 500         | All beta users will encounter this                         |
| **Impact**     | 3 (Massive) | Core differentiator, directly addresses primary pain point |
| **Confidence** | 0.8         | AI quality proven in testing, some edge cases              |
| **Effort**     | 6 weeks     | Complex AI integration, prompt engineering, UI             |

**Jobs Addressed**: J1.1 (Send Safe Messages), J1.2 (Express Concerns), J4.1 (Feel Safe)

**Decision Rationale**:
This is LiaiZen's core value proposition. Without effective AI mediation, we're just another messaging app. Despite high effort, the impact justifies prioritization. Users won't convert without seeing this work.

**Success Metrics**:

- 60% rewrite acceptance rate
- 30% reduction in hostile message attempts over 8 weeks
- < 5% false positive rate (constructive messages blocked)

**Risks**:

- AI accuracy may frustrate users if too aggressive
- Latency could interrupt flow
- Edge cases may require ongoing tuning

---

### Feature 2: Real-time Messaging

**RICE Score**: 375

| Factor         | Value       | Rationale                                 |
| -------------- | ----------- | ----------------------------------------- |
| **Reach**      | 500         | All users need this                       |
| **Impact**     | 3 (Massive) | Table stakes - can't function without it  |
| **Confidence** | 1.0         | Well-understood technology                |
| **Effort**     | 4 weeks     | WebSocket infrastructure, UI, reliability |

**Jobs Addressed**: J2.1 (Confirm Logistics), J2.2 (Share Information)

**Decision Rationale**:
Foundational capability. Everything else depends on reliable messaging. Socket.io provides proven reliability.

**Success Metrics**:

- 99.5% uptime
- < 500ms message delivery latency
- Zero message loss

**Status**: Complete

---

### Feature 3: User Authentication

**RICE Score**: 333

| Factor         | Value    | Rationale                                  |
| -------------- | -------- | ------------------------------------------ |
| **Reach**      | 500      | All users                                  |
| **Impact**     | 2 (High) | Required for trust, but not differentiator |
| **Confidence** | 1.0      | Standard technology                        |
| **Effort**     | 3 weeks  | JWT, OAuth, password reset, security       |

**Jobs Addressed**: J5.1 (Have Proof - authentication for legal validity)

**Decision Rationale**:
Security and privacy are critical for co-parenting platform. Google OAuth reduces friction while maintaining security.

**Success Metrics**:

- < 2% signup abandonment
- Zero security incidents
- < 30 seconds to complete signup

**Status**: Complete

---

### Feature 4: Co-parent Invitations

**RICE Score**: 400

| Factor         | Value    | Rationale                                    |
| -------------- | -------- | -------------------------------------------- |
| **Reach**      | 500      | Every user needs to invite co-parent         |
| **Impact**     | 2 (High) | Platform is useless without both parents     |
| **Confidence** | 0.8      | Flow is clear, but acceptance rate uncertain |
| **Effort**     | 2 weeks  | Email, link handling, acceptance flow        |

**Jobs Addressed**: J4.1 (Feel Safe - invitation sets tone)

**Decision Rationale**:
Critical for activation. If users can't easily invite co-parents, they'll never experience value. First message from the platform sets the tone for the entire relationship.

**Success Metrics**:

- 60% invitation acceptance rate
- < 3 days average time to accept
- < 5% invitation errors

**Status**: In Progress

---

### Feature 5: Contact Management

**RICE Score**: 80

| Factor         | Value      | Rationale                   |
| -------------- | ---------- | --------------------------- |
| **Reach**      | 300        | ~60% of users will use this |
| **Impact**     | 1 (Medium) | Useful but not critical     |
| **Confidence** | 0.8        | Straightforward feature     |
| **Effort**     | 3 weeks    | CRUD, sharing, categories   |

**Jobs Addressed**: J2.2 (Share Information), J2.3 (Find Past Info)

**Decision Rationale**:
Addresses David's (low-conflict) organizational needs and provides utility for all users. Lower priority than communication features but important for retention.

**Success Metrics**:

- 50% of users add at least 3 contacts
- Contact lookup < 10 seconds

**Status**: In Progress

---

### Feature 6: Basic Task Management

**RICE Score**: 40

| Factor         | Value      | Rationale                         |
| -------------- | ---------- | --------------------------------- |
| **Reach**      | 200        | ~40% of users will use initially  |
| **Impact**     | 1 (Medium) | Helpful but messaging is primary  |
| **Confidence** | 0.8        | Clear requirements                |
| **Effort**     | 4 weeks    | Tasks, assignments, reminders, UI |

**Jobs Addressed**: J2.1 (Confirm Logistics), J3.1 (Reach Agreements)

**Decision Rationale**:
Important for coordination but secondary to communication. Users need to communicate before they can coordinate tasks. Deferred to late MVP or Phase 2.

**Success Metrics**:

- 80% task completion rate
- 30% of active users create tasks

**Status**: Planned

---

### Feature 7: Message History/Search

**RICE Score**: 160

| Factor         | Value      | Rationale                      |
| -------------- | ---------- | ------------------------------ |
| **Reach**      | 400        | ~80% will search at some point |
| **Impact**     | 1 (Medium) | Convenience, not core value    |
| **Confidence** | 0.8        | Standard feature               |
| **Effort**     | 2 weeks    | Search index, UI, filtering    |

**Jobs Addressed**: J2.3 (Find Past Info), J5.1 (Have Proof)

**Decision Rationale**:
Low effort, high value for organization-focused users (David) and legal documentation needs (Mike, Jessica). Quick win for Phase 1.

**Success Metrics**:

- Search returns results in < 2 seconds
- 40% of users use search within first month

**Status**: Planned

---

### Feature 8: Mobile Responsive UI

**RICE Score**: 300

| Factor         | Value    | Rationale                              |
| -------------- | -------- | -------------------------------------- |
| **Reach**      | 450      | 90% of users will access on mobile     |
| **Impact**     | 2 (High) | Most co-parent communication is mobile |
| **Confidence** | 1.0      | Standard responsive design             |
| **Effort**     | 3 weeks  | Responsive layouts, touch optimization |

**Jobs Addressed**: All - mobile is the primary access method

**Decision Rationale**:
Sarah and Mike both use smartphones primarily. Without mobile optimization, we lose the majority of use cases. PWA approach before native apps.

**Success Metrics**:

- 90% mobile usability score
- No increase in drop-off on mobile
- Touch targets 44px minimum

**Status**: In Progress

---

## Phase 2 Candidates (Post-MVP)

| Feature               | Estimated RICE | Rationale for Deferral               |
| --------------------- | -------------- | ------------------------------------ |
| Calendar Integration  | 120            | Useful but complex; messaging first  |
| Document Storage      | 80             | Nice-to-have; focus on communication |
| Expense Tracking      | 60             | Secondary need; financial complexity |
| Attorney Portal       | 40             | B2B feature; need B2C traction first |
| Native Mobile Apps    | 150            | PWA sufficient for MVP               |
| Advanced Analytics    | 30             | Needs data from MVP usage first      |
| Therapist Integration | 20             | Specialized; validate core first     |

---

## Decision Log

### 2025-11-26: Initial Prioritization

**Decision**: MVP focus on AI mediation + core messaging + invitations
**Rationale**: These three features together deliver the core value proposition. Without AI mediation, we're generic. Without messaging, nothing works. Without invitations, no network effect.
**Trade-offs**: Deferred task management and calendar to ensure quality on core features.

### [Future decisions will be logged here]

---

## Prioritization Review Schedule

| Review Type     | Frequency | Participants            |
| --------------- | --------- | ----------------------- |
| Weekly sprint   | Weekly    | PM, Engineering Lead    |
| Feature review  | Bi-weekly | PM, Design, Engineering |
| Roadmap review  | Monthly   | PM, Leadership          |
| Strategy review | Quarterly | Full team               |

---

## How to Use This Document

### For Product Decisions

1. Score new feature ideas using RICE
2. Compare to existing prioritized list
3. Document rationale for any priority changes
4. Update decision log

### For Engineering Planning

1. Reference effort estimates for sprint planning
2. Note dependencies between features
3. Flag if estimates change significantly

### For Stakeholder Communication

1. Share RICE scores to explain prioritization
2. Reference success metrics for feature validation
3. Point to decision log for historical context

---

_Prioritization Framework for coparentliaizen.com - Better Co-Parenting Through Better Communication_
