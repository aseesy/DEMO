# Product Manager Knowledge Base

## Purpose

Accumulated knowledge and learnings for the product-manager agent. This document provides quick reference to key resources and domain knowledge.

---

## Quick Access: Key Resources

### User Research & Personas

| Resource                | Location                                | Description                                       |
| ----------------------- | --------------------------------------- | ------------------------------------------------- |
| **User Personas**       | `.docs/product/personas/`               | Detailed personas for Sarah, Mike, Jessica, David |
| **Jobs-to-be-Done**     | `.docs/product/jtbd/jobs-to-be-done.md` | Structured JTBD library with prioritization       |
| **Interview Templates** | `.docs/product/research-templates/`     | Research protocols and scripts                    |

### AI & Communication

| Resource                   | Location                                               | Description                        |
| -------------------------- | ------------------------------------------------------ | ---------------------------------- |
| **Communication Patterns** | `.docs/product/ai-mediation/communication-patterns.md` | Hostile vs. healthy patterns guide |
| **Message Examples**       | `.docs/product/ai-mediation/message-examples.md`       | Curated rewrite examples           |

### Strategy & Planning

| Resource                   | Location                                                 | Description                            |
| -------------------------- | -------------------------------------------------------- | -------------------------------------- |
| **Feature Prioritization** | `.docs/product/prioritization/feature-prioritization.md` | RICE scores and rationale              |
| **Competitive Analysis**   | `.docs/product/competitive/competitive-analysis.md`      | Market landscape and positioning       |
| **Master PRD**             | `.docs/prd/prd.md`                                       | Complete Product Requirements Document |

---

## Co-Parenting Domain Knowledge

### User Personas Summary

| Persona     | Type       | Conflict Level | Key Need                                            |
| ----------- | ---------- | -------------- | --------------------------------------------------- |
| **Sarah**   | Primary    | High           | Send safe messages without starting fights          |
| **Ben**     | Primary    | High           | Communicate efficiently without implied judgment    |
| **Erika**   | Primary    | High           | Express herself with confidence, not apology        |
| **Mike**    | Secondary  | High           | Express himself clearly without being misunderstood |
| **Jessica** | Tertiary   | N/A (Attorney) | Help clients improve, get clean records             |
| **David**   | Quaternary | Low            | Organization and efficiency                         |

### Paired Personas: Ben & Erika

A matched pair showing how two people experience the same relationship differently.

| Persona   | Style                    | AI Focus                                     |
| --------- | ------------------------ | -------------------------------------------- |
| **Ben**   | Efficient, authoritative | Remove implied judgment, preserve directness |
| **Erika** | Apologetic, indirect     | Build confidence, enable direct requests     |

**Key Insight**: Not villain/victim - both operating from old emotional injuries.

**Full personas**: `.docs/product/personas/`
**Relationship dynamics**: `.docs/product/personas/ben-erika-relationship-dynamics.md`

### Core Jobs-to-be-Done

**Critical Jobs (P0)**:

- J1.1: Send Safe Messages - "I want to send messages that won't escalate"
- J4.1: Feel Safe Communicating - "I don't want to dread every interaction"
- J3.1: Reach Agreements - "I want to make decisions, not fight"

**High Priority Jobs (P1)**:

- J1.2: Express Concerns Without Attack
- J3.2: Say No Without War
- J2.1: Confirm Logistics
- J5.1: Have Proof

**Full JTBD library**: `.docs/product/jtbd/jobs-to-be-done.md`

### Pain Points by Severity

| Pain Point                                      | Severity | Personas Affected |
| ----------------------------------------------- | -------- | ----------------- |
| Every message risks becoming a fight            | Critical | Sarah, Mike       |
| Expensive attorney fees for basic communication | Critical | Sarah, Mike       |
| Children affected by parental conflict          | Critical | All               |
| Words misinterpreted as hostile                 | High     | Mike              |
| Past weaponized in every conversation           | High     | Sarah, Mike       |
| Important info buried in arguments              | Medium   | All               |
| New partners have no visibility                 | Low      | David             |

---

## Product Strategy Knowledge

### Prioritization Framework: RICE

```
RICE Score = (Reach × Impact × Confidence) / Effort
```

| Factor     | Scale              | Notes                             |
| ---------- | ------------------ | --------------------------------- |
| Reach      | # of users/quarter | How many users affected?          |
| Impact     | 0.25-3             | 0.25=Minimal, 1=Medium, 3=Massive |
| Confidence | 0.5-1.0            | How sure are we?                  |
| Effort     | Person-weeks       | Development effort                |

**Current prioritization**: `.docs/product/prioritization/feature-prioritization.md`

### MVP Feature Priority

| Rank | Feature                | RICE | Status      |
| ---- | ---------------------- | ---- | ----------- |
| 1    | Real-time Messaging    | 375  | Complete    |
| 2    | Co-parent Invitations  | 400  | In Progress |
| 3    | Mobile Responsive UI   | 300  | In Progress |
| 4    | AI Message Mediation   | 200  | In Progress |
| 5    | Message History/Search | 160  | Planned     |

### Success Metrics Framework

**Product Delivery**:

- Roadmap commitment: >80%
- PRD quality: >4/5
- Velocity: Stable or improving

**User Engagement**:

- 30-day retention: >60%
- Feature adoption: >30% within 30 days
- NPS: >40

**AI Quality**:

- Rewrite acceptance: >70%
- Intent preservation: >90%
- Latency (p95): <2s

---

## AI Product Knowledge

### LLM Capabilities & Limitations

| Capability          | Strength | Notes                                    |
| ------------------- | -------- | ---------------------------------------- |
| Pattern recognition | Strong   | Good at identifying hostile patterns     |
| Tone analysis       | Strong   | Reliable sentiment detection             |
| Rewriting           | Strong   | Can preserve intent while improving tone |
| Consistency         | Moderate | Varies by prompt quality                 |
| Real-time           | Moderate | 1-2s latency acceptable                  |
| Edge cases          | Weak     | Requires ongoing tuning                  |

### AI Mediation Design Principles

1. **Sender-First**: Suggestions private to sender only
2. **User Control**: Sender decides final message
3. **Preserve Intent**: Rewrites must keep original meaning
4. **Educate**: Explain WHY messages trigger intervention
5. **Graceful Degradation**: Work without AI if unavailable
6. **Learn Over Time**: Reduce interventions as user improves

### Hostile Pattern Categories

| Pattern            | Example                     | Detection Confidence |
| ------------------ | --------------------------- | -------------------- |
| Always/Never       | "You ALWAYS do this"        | High                 |
| Blame/Accusation   | "This is YOUR fault"        | High                 |
| Triangulation      | "She told me you didn't..." | High                 |
| Past Weaponization | "Just like when you..."     | Medium               |
| Hostile Tone       | ALL CAPS, ??? !!!           | High                 |
| Threats            | "My lawyer will..."         | High                 |
| Mind Reading       | "You just want to hurt me"  | Medium               |

**Full patterns guide**: `.docs/product/ai-mediation/communication-patterns.md`

---

## Brand Values Reference

| Value          | Meaning                                 | Product Implication                                         |
| -------------- | --------------------------------------- | ----------------------------------------------------------- |
| **Dignity**    | Treating every user with inherent worth | No shaming, no public corrections, no judgment              |
| **Calm**       | Reducing rather than amplifying stress  | Quiet UI, thoughtful notifications, no urgency manipulation |
| **Precision**  | Clear, accurate, unambiguous            | No vague language, no unclear states, no confusing flows    |
| **Fairness**   | Equal treatment regardless of user type | No features that advantage one co-parent over another       |
| **Neutrality** | Not taking sides in conflicts           | AI suggestions balanced, no blame attribution               |
| **Respect**    | Honoring user autonomy and choices      | User control over features, easy opt-out, transparent AI    |

---

## Competitive Landscape Summary

### Direct Competitors

| Competitor      | Strength                        | Weakness              | LiaiZen Advantage        |
| --------------- | ------------------------------- | --------------------- | ------------------------ |
| OurFamilyWizard | Court acceptance, comprehensive | Expensive, dated UX   | Modern UX, AI coaching   |
| TalkingParents  | Affordable, court-admissible    | No AI, basic features | AI mediation             |
| AppClose        | User-friendly, family-focused   | No conflict tools     | High-conflict capability |

### Positioning

> **LiaiZen**: The only co-parenting platform with AI that actually helps you communicate better - not just document your failures.

**Full analysis**: `.docs/product/competitive/competitive-analysis.md`

---

## Research Resources

### Available Templates

| Template              | Use Case                      | Location                                                           |
| --------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Interview Guide       | Discovery research            | `.docs/product/research-templates/interview-guide-coparent.md`     |
| Usability Test Script | Feature validation            | `.docs/product/research-templates/usability-test-script.md`        |
| Satisfaction Survey   | NPS and satisfaction tracking | `.docs/product/research-templates/survey-template-satisfaction.md` |

### Research Best Practices

- Discovery interviews: 8-12 participants for saturation
- Usability tests: 5 users find 80% of issues
- Surveys: Minimum 30 responses for significance

---

## Decision Patterns

### When to Use AI Mediation

- User sends message with hostile pattern detected
- Confidence threshold: >70% for intervention
- User has not established pattern of healthy communication

### When NOT to Intervene

- Message is constructive
- User has established healthy patterns
- Minor tone issues unlikely to escalate

### When to Escalate to Human Review

- Content suggests crisis (self-harm, abuse)
- User explicitly requests human help
- AI confidence is low but concern is high

---

## Learning Log

### Insights from User Research

_(Add findings as research is conducted)_

### Patterns from Support

_(Add patterns from user feedback)_

### Lessons from Launches

_(Add post-launch learnings)_

---

_Last Updated: 2025-11-26_
_Knowledge Base for product-manager agent - coparentliaizen.com_
