# Jobs-to-be-Done (JTBD) Library

**Purpose**: Structured repository of user jobs that drive LiaiZen product decisions. All features should map to one or more jobs in this library.

**Last Updated**: 2025-11-26
**Version**: 1.0.0

---

## JTBD Framework

### Format

> **When** [situation/trigger], **I want to** [motivation/action], **so that** [expected outcome].

### Job Types

- **Functional Jobs**: What users are trying to accomplish
- **Emotional Jobs**: How users want to feel
- **Social Jobs**: How users want to be perceived

---

## Core Jobs by Category

## 1. Communication Jobs

### J1.1: Send Safe Messages

**Job Statement**:

> **When** I need to communicate with my co-parent about our children, **I want to** send messages that won't be misinterpreted or escalate conflict, **so that** we can coordinate effectively without fighting.

| Attribute             | Value                                          |
| --------------------- | ---------------------------------------------- |
| **Personas**          | Sarah (Primary), Mike (Secondary)              |
| **Job Type**          | Functional + Emotional                         |
| **Frequency**         | Daily                                          |
| **Importance**        | Critical                                       |
| **Current Solutions** | Text, email, attorney review                   |
| **Pain with Current** | Escalates to fights, expensive attorney review |

**Related Features**:

- AI message mediation
- Pre-send hostility detection
- Rewrite suggestions
- Tone analysis

---

### J1.2: Express Concerns Without Attack

**Job Statement**:

> **When** I'm frustrated or worried about something my co-parent did, **I want to** express my concerns constructively, **so that** I can be heard without starting a war.

| Attribute             | Value                                             |
| --------------------- | ------------------------------------------------- |
| **Personas**          | Sarah (Primary)                                   |
| **Job Type**          | Functional + Emotional                            |
| **Frequency**         | Weekly                                            |
| **Importance**        | High                                              |
| **Current Solutions** | Vent to friends, draft/delete, attorney mediation |
| **Pain with Current** | Concerns go unexpressed or explode into conflict  |

**Related Features**:

- AI coaching on "I" statements
- Anger-to-concern reframing
- Cool-down suggestions

---

### J1.3: Communicate Clearly and Briefly

**Job Statement**:

> **When** I need to respond quickly to a message, **I want to** be brief without sounding harsh, **so that** I can communicate efficiently without being misunderstood.

| Attribute             | Value                                        |
| --------------------- | -------------------------------------------- |
| **Personas**          | Mike (Secondary)                             |
| **Job Type**          | Functional                                   |
| **Frequency**         | Daily                                        |
| **Importance**        | High                                         |
| **Current Solutions** | Short texts                                  |
| **Pain with Current** | Brief messages read as hostile or dismissive |

**Related Features**:

- Tone-softening for brief messages
- Quick reply templates
- Context-adding suggestions

---

### J1.4: Stay on Topic

**Job Statement**:

> **When** my co-parent brings up the past or changes the subject, **I want to** redirect the conversation to the current issue, **so that** we can actually resolve things instead of relitigating history.

| Attribute             | Value                                       |
| --------------------- | ------------------------------------------- |
| **Personas**          | Sarah (Primary), Mike (Secondary)           |
| **Job Type**          | Functional                                  |
| **Frequency**         | Weekly                                      |
| **Importance**        | High                                        |
| **Current Solutions** | None effective                              |
| **Pain with Current** | Every conversation becomes about everything |

**Related Features**:

- Topic detection
- Redirect suggestions
- "Focus on present" coaching

---

## 2. Coordination Jobs

### J2.1: Confirm Logistics

**Job Statement**:

> **When** I need to coordinate pickup times, events, or schedules, **I want to** get clear confirmation, **so that** there's no confusion about who's doing what.

| Attribute             | Value                                            |
| --------------------- | ------------------------------------------------ |
| **Personas**          | All                                              |
| **Job Type**          | Functional                                       |
| **Frequency**         | Daily/Weekly                                     |
| **Importance**        | High                                             |
| **Current Solutions** | Text, calendar apps                              |
| **Pain with Current** | Confirmations buried in arguments, missed events |

**Related Features**:

- Quick confirmation buttons
- Calendar integration
- Confirmation tracking

---

### J2.2: Share Information Efficiently

**Job Statement**:

> **When** I learn something about our child (medical, school, activity), **I want to** share it with my co-parent quickly, **so that** we're both informed and can act accordingly.

| Attribute             | Value                            |
| --------------------- | -------------------------------- |
| **Personas**          | All                              |
| **Job Type**          | Functional                       |
| **Frequency**         | Weekly                           |
| **Importance**        | Medium-High                      |
| **Current Solutions** | Text, email                      |
| **Pain with Current** | Information scattered, gets lost |

**Related Features**:

- Information categories
- Quick-share templates
- Acknowledgment tracking

---

### J2.3: Find Past Information

**Job Statement**:

> **When** I need to remember what we agreed to or discussed, **I want to** find that information quickly, **so that** I don't waste time searching or have disputes about what was said.

| Attribute             | Value                              |
| --------------------- | ---------------------------------- |
| **Personas**          | David (Quaternary), All            |
| **Job Type**          | Functional                         |
| **Frequency**         | Weekly                             |
| **Importance**        | Medium                             |
| **Current Solutions** | Search through texts/emails        |
| **Pain with Current** | Important info buried in arguments |

**Related Features**:

- Search functionality
- Decision log
- Agreement tracking

---

### J2.4: Include New Partners

**Job Statement**:

> **When** my new partner wants to help with coordination, **I want to** give them appropriate access, **so that** they can participate without awkwardness.

| Attribute             | Value                                  |
| --------------------- | -------------------------------------- |
| **Personas**          | David (Quaternary)                     |
| **Job Type**          | Social                                 |
| **Frequency**         | Setup once                             |
| **Importance**        | Medium                                 |
| **Current Solutions** | Forward messages manually              |
| **Pain with Current** | Partners left out or awkward inclusion |

**Related Features**:

- Partner access permissions
- Tiered visibility
- Separate partner view

---

## 3. Decision-Making Jobs

### J3.1: Reach Agreements

**Job Statement**:

> **When** we need to make a parenting decision together, **I want to** discuss options and reach agreement, **so that** we can move forward instead of being stuck in conflict.

| Attribute             | Value                                                  |
| --------------------- | ------------------------------------------------------ |
| **Personas**          | Sarah (Primary), Mike (Secondary)                      |
| **Job Type**          | Functional                                             |
| **Frequency**         | Weekly                                                 |
| **Importance**        | Critical                                               |
| **Current Solutions** | Texts that become fights, attorney mediation           |
| **Pain with Current** | Never reach resolution, expensive attorney involvement |

**Related Features**:

- Decision discussion threads
- Proposal/counter-proposal flow
- Agreement documentation

---

### J3.2: Say No Without War

**Job Statement**:

> **When** I disagree with my co-parent's request, **I want to** decline respectfully, **so that** I can maintain my boundaries without escalating conflict.

| Attribute             | Value                               |
| --------------------- | ----------------------------------- |
| **Personas**          | Mike (Secondary)                    |
| **Job Type**          | Functional + Emotional              |
| **Frequency**         | Weekly                              |
| **Importance**        | High                                |
| **Current Solutions** | Brief refusal that reads as hostile |
| **Pain with Current** | Every "no" starts a fight           |

**Related Features**:

- Respectful decline templates
- Explanation prompts
- Alternative suggestion prompts

---

### J3.3: Be Heard

**Job Statement**:

> **When** I have an opinion about our children, **I want to** have input in decisions, **so that** I feel like an equal partner in parenting.

| Attribute             | Value                         |
| --------------------- | ----------------------------- |
| **Personas**          | Mike (Secondary)              |
| **Job Type**          | Emotional + Social            |
| **Frequency**         | Ongoing                       |
| **Importance**        | High                          |
| **Current Solutions** | Arguments                     |
| **Pain with Current** | Feels excluded from decisions |

**Related Features**:

- Joint decision workflows
- Input requests
- Acknowledgment features

---

## 4. Emotional Safety Jobs

### J4.1: Feel Safe Communicating

**Job Statement**:

> **When** I need to message my co-parent, **I want to** feel confident my message won't start a fight, **so that** I don't dread every interaction.

| Attribute             | Value                                |
| --------------------- | ------------------------------------ |
| **Personas**          | Sarah (Primary), Mike (Secondary)    |
| **Job Type**          | Emotional                            |
| **Frequency**         | Every message                        |
| **Importance**        | Critical                             |
| **Current Solutions** | Draft/delete, attorney review        |
| **Pain with Current** | Constant anxiety about communication |

**Related Features**:

- Pre-send review
- Confidence indicators
- Low-stress UI

---

### J4.2: Protect My Children from Conflict

**Job Statement**:

> **When** tension arises with my co-parent, **I want to** handle it without my children being affected, **so that** they can have good relationships with both parents.

| Attribute             | Value                                        |
| --------------------- | -------------------------------------------- |
| **Personas**          | All                                          |
| **Job Type**          | Emotional + Social                           |
| **Frequency**         | Ongoing                                      |
| **Importance**        | Critical                                     |
| **Current Solutions** | Trying to hide conflict (often failing)      |
| **Pain with Current** | Children sense tension, get caught in middle |

**Related Features**:

- Conflict de-escalation
- Private communication channel
- Child-centered reminders

---

### J4.3: Stop Reliving the Past

**Job Statement**:

> **When** my co-parent brings up old grievances, **I want to** keep the conversation focused on today, **so that** I can stop fighting the same battles over and over.

| Attribute             | Value                                        |
| --------------------- | -------------------------------------------- |
| **Personas**          | Sarah (Primary), Mike (Secondary)            |
| **Job Type**          | Emotional                                    |
| **Frequency**         | Weekly                                       |
| **Importance**        | High                                         |
| **Current Solutions** | None                                         |
| **Pain with Current** | Every conversation becomes about the divorce |

**Related Features**:

- Past-reference detection
- Redirect coaching
- Present-focus prompts

---

## 5. Documentation Jobs

### J5.1: Have Proof of What Was Said

**Job Statement**:

> **When** there's a dispute about our agreements or what was communicated, **I want to** have clear records, **so that** I can prove what actually happened.

| Attribute             | Value                                   |
| --------------------- | --------------------------------------- |
| **Personas**          | Sarah, Mike, Jessica (Attorney)         |
| **Job Type**          | Functional                              |
| **Frequency**         | When disputes arise                     |
| **Importance**        | High                                    |
| **Current Solutions** | Screenshots from multiple platforms     |
| **Pain with Current** | Scattered, disputed, incomplete records |

**Related Features**:

- Complete message history
- Timestamping
- Export for legal purposes

---

### J5.2: Demonstrate Cooperation

**Job Statement**:

> **When** I need to show (to court, attorney, mediator) that I'm trying to cooperate, **I want to** have evidence of my collaborative attempts, **so that** my efforts are recognized.

| Attribute             | Value                                  |
| --------------------- | -------------------------------------- |
| **Personas**          | Mike (Secondary), Jessica (Attorney)   |
| **Job Type**          | Social                                 |
| **Frequency**         | When needed for legal proceedings      |
| **Importance**        | High for custody-active users          |
| **Current Solutions** | Fragmented screenshots                 |
| **Pain with Current** | Hard to show patterns, easy to dispute |

**Related Features**:

- Communication analytics
- Cooperation metrics
- Pattern reporting

---

### J5.3: Track Agreements

**Job Statement**:

> **When** we agree on something, **I want to** document it clearly, **so that** we both remember what we agreed to and can reference it later.

| Attribute             | Value                              |
| --------------------- | ---------------------------------- |
| **Personas**          | All                                |
| **Job Type**          | Functional                         |
| **Frequency**         | When agreements made               |
| **Importance**        | Medium                             |
| **Current Solutions** | Hope we both remember              |
| **Pain with Current** | "We never agreed to that" disputes |

**Related Features**:

- Agreement confirmation flow
- Agreement history
- Reminder/reference system

---

## 6. Professional Jobs (Attorney Persona)

### J6.1: Get Clean Communication Records

**Job Statement**:

> **When** I need communication records for a case, **I want to** access organized, verifiable records, **so that** I can build a case without disputing authenticity.

| Attribute             | Value                            |
| --------------------- | -------------------------------- |
| **Personas**          | Jessica (Attorney)               |
| **Job Type**          | Functional                       |
| **Frequency**         | Per case                         |
| **Importance**        | High                             |
| **Current Solutions** | Client-provided screenshots      |
| **Pain with Current** | Fragmented, disputed, incomplete |

**Related Features**:

- Legal export format
- Verification/authentication
- Timeline reconstruction

---

### J6.2: Stop Billing for Communication Coaching

**Job Statement**:

> **When** clients need help communicating with their co-parent, **I want to** refer them to a tool that helps, **so that** I don't spend billable hours on basic communication.

| Attribute             | Value                                        |
| --------------------- | -------------------------------------------- |
| **Personas**          | Jessica (Attorney)                           |
| **Job Type**          | Functional + Emotional (guilt about billing) |
| **Frequency**         | Ongoing                                      |
| **Importance**        | Medium                                       |
| **Current Solutions** | Manual message review                        |
| **Pain with Current** | Billing for what should be free              |

**Related Features**:

- Professional referral program
- Self-service communication coaching
- Reduced attorney intervention

---

### J6.3: Help Clients Improve

**Job Statement**:

> **When** I see clients damaging their cases through poor communication, **I want to** give them tools that actually help in the moment, **so that** they stop sabotaging themselves.

| Attribute             | Value                                     |
| --------------------- | ----------------------------------------- |
| **Personas**          | Jessica (Attorney)                        |
| **Job Type**          | Functional + Emotional                    |
| **Frequency**         | Ongoing                                   |
| **Importance**        | High                                      |
| **Current Solutions** | Advice that doesn't work in the moment    |
| **Pain with Current** | Clients can't implement advice when angry |

**Related Features**:

- Real-time AI intervention
- Communication skill building
- Progress tracking

---

## Job Priority Matrix

| Job                           | User Impact | Business Impact | Complexity | Priority |
| ----------------------------- | ----------- | --------------- | ---------- | -------- |
| J1.1: Send Safe Messages      | Critical    | Critical        | High       | P0       |
| J4.1: Feel Safe Communicating | Critical    | High            | Medium     | P0       |
| J3.1: Reach Agreements        | Critical    | High            | Medium     | P0       |
| J1.2: Express Concerns        | High        | High            | High       | P1       |
| J3.2: Say No Without War      | High        | Medium          | Medium     | P1       |
| J2.1: Confirm Logistics       | High        | Medium          | Low        | P1       |
| J5.1: Have Proof              | High        | Medium          | Low        | P1       |
| J1.3: Communicate Briefly     | Medium      | Medium          | Medium     | P2       |
| J2.3: Find Past Info          | Medium      | Low             | Low        | P2       |
| J2.4: Include Partners        | Low         | Low             | Medium     | P3       |

---

## Feature-to-Job Mapping

| Feature                 | Primary Jobs     | Secondary Jobs |
| ----------------------- | ---------------- | -------------- |
| AI Message Mediation    | J1.1, J1.2, J4.1 | J3.2, J1.4     |
| Quick Confirmations     | J2.1             | J2.2           |
| Decision Threads        | J3.1, J3.3       | J5.3           |
| Message Search          | J2.3             | J5.1           |
| Legal Export            | J5.1, J5.2       | J6.1           |
| Partner Access          | J2.4             | J2.2           |
| Communication Analytics | J5.2, J6.3       | J4.1           |

---

_JTBD Library for coparentliaizen.com - Better Co-Parenting Through Better Communication_
