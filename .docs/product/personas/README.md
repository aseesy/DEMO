# LiaiZen User Personas

This directory contains detailed user personas for LiaiZen's co-parenting communication platform.

## Persona Hierarchy

| Type | Persona | Description | Conflict Level |
|------|---------|-------------|----------------|
| **Primary** | [Sarah](./sarah-divorced-mother.md) | Recently divorced mother, 50/50 custody | High |
| **Primary** | [Ben](./ben-logistics-focused-father.md) | Logistics-focused father (paired with Erika) | High |
| **Primary** | [Erika](./erika-recovering-mother.md) | Mother rebuilding after recovery (paired with Ben) | High |
| **Primary** | [Athena](./athena-reflective-mother.md) | Reflective mother (paired with Yashir) | High |
| **Primary** | [Yashir](./yashir-assertive-father.md) | Assertive father (paired with Athena) | High |
| **Secondary** | [Mike](./mike-high-conflict-father.md) | Father in custody dispute | High |
| **Tertiary** | [Jessica](./jessica-family-law-attorney.md) | Family law attorney | N/A (professional) |
| **Quaternary** | [David](./david-low-conflict-coparent.md) | Amicably divorced father | Low |

## Paired Personas

A unique addition to our persona set - **matched pairs** showing how two people experience the same relationship differently.

### Ben & Erika

| Document | Purpose |
|----------|---------|
| [Ben - Full Persona](./ben-logistics-focused-father.md) | His background, drivers, communication style |
| [Erika - Full Persona](./erika-recovering-mother.md) | Her background, drivers, communication style |
| [Relationship Dynamics](./ben-erika-relationship-dynamics.md) | Their interaction patterns, loops to break |

### Athena & Yashir

| Document | Purpose |
|----------|---------|
| [Athena - Full Persona](./athena-reflective-mother.md) | Her background, drivers, communication style |
| [Yashir - Full Persona](./yashir-assertive-father.md) | His background, drivers, communication style |
| [Relationship Dynamics](./athena-yashir-relationship-dynamics.md) | Their interaction patterns, loops to break |

### Why Paired Personas Matter
- Shows how **the same event** creates different wounds
- Maps the **communication loop** that needs breaking
- Identifies **trigger language** for both sides
- Informs **two-sided AI mediation** design

### Key Insight: Not Villain/Victim
> "I don't see Ben as 'the villain' or Erika as 'the victim.' They are both operating from old emotional injuries."

> "I don't see Athena as 'the controller' or Yashir as 'the reactive one.' They are both operating from legitimate needs that conflict with each other's communication styles."

LiaiZen serves **both** - helping each communicate in ways the other can receive.

---

## Quick Reference

### Primary Target: High-Conflict Co-Parents

**Sarah & Mike Pattern**:
- Communication spirals into multi-day arguments
- Attorney fees for basic communication mediation ($8K-$12K/year)
- Missing children's important events
- Can't discuss present without past being weaponized
- Every interaction ends in stalemate

**Ben & Erika Pattern**:
- Historic resentment from opposing experiences
- Control vs. protection dynamic
- Efficiency vs. emotional safety needs
- Trigger language that escalates unintentionally
- Loops of defensive/assertive responses

**Athena & Yashir Pattern**:
- Clarifying vs. correction perception mismatch
- Structure vs. autonomy dynamic
- Logical reasoning vs. reactive expression
- Over-explanation triggering defensiveness
- Loops of clarification/defensiveness

**Key Features Needed:**
- AI mediation that blocks/rewrites hostile messages before sending
- **Personalized detection** of each user's trigger patterns
- **Two-sided coaching** for both sender and receiver
- Learning system that adapts to communication patterns
- Clean records for legal purposes
- Mobile-first experience

### Secondary Target: Family Law Professionals (Jessica)

**Pain Points:**
- Clients sabotage themselves through communication
- Scattered, disputable records across platforms
- Billing hours for basic communication coaching
- Can't help clients improve in real-time

**Key Features Needed:**
- Client referral system
- Exportable, verifiable records
- (Future) Attorney portal for oversight

### Tertiary Target: Low-Conflict Co-Parents (David)

**Pain Points:**
- Information scattered across platforms
- New partners lack visibility
- Occasional miscommunication despite good relationship
- No organized history to reference

**Key Features Needed:**
- Organization and search
- Partner access permissions
- Shared calendar and contacts
- Optional (not intrusive) AI assistance

---

## Communication Style Matrix

| Persona | Style | Risk | AI Focus |
|---------|-------|------|----------|
| **Sarah** | Emotional, detailed | Escalation when triggered | De-escalation, present focus |
| **Mike** | Brief, direct | Reads as harsh/dismissive | Tone softening, context adding |
| **Ben** | Efficient, authoritative | Reads as judgmental/controlling | Remove implied judgment |
| **Erika** | Apologetic, indirect | Reads as weak/uncertain | Build confidence, directness |
| **Athena** | Logical, clarifying | Reads as correction/control | Preserve intent, reduce defensiveness triggers |
| **Yashir** | Assertive, reactive | Reads as combative/defensive | Maintain autonomy, reduce escalation |
| **David** | Casual, scattered | Minor misunderstandings | Organization, optional tone help |

---

## Usage Guidelines

### For Product Decisions
1. Always consider impact on **high-conflict personas** first (Sarah, Mike, Ben, Erika, Athena, Yashir)
2. Use **Ben & Erika** and **Athena & Yashir** to test two-sided mediation features
3. Consider **Jessica's** referral potential (growth channel)
4. Ensure **David** feels welcome (reduces stigma, improves retention)

### For AI Mediation Design
1. **Sarah/Mike**: Generic hostile pattern detection
2. **Ben**: Efficiency + authority patterns that imply judgment
3. **Erika**: Apologetic + deferential patterns that undermine confidence
4. **Athena**: Clarifying language that reads as correction/control
5. **Yashir**: Defensive responses to perceived autonomy threats
6. **Ben→Erika direction**: Receiving-side interpretation help
7. **Athena→Yashir direction**: Receiving-side interpretation help (clarification vs. correction)
8. **All**: Preserve intent while improving delivery

### For Feature Prioritization
- High-conflict features (AI mediation) = MVP priority
- Two-sided mediation (sender + receiver help) = High priority
- Organization features = Phase 2
- Professional features (attorney portal) = Phase 3

### For Design Decisions
- Mobile-first (Sarah, Mike, Ben, Erika)
- Low cognitive load (everyone is stressed)
- Calm visual design (brand value)
- Don't assume conflict (David)
- **No judgment** (especially for Erika's recovery context)

---

## Persona Updates

These personas should be updated based on:
- User research findings
- Customer support patterns
- Analytics insights
- Competitive landscape changes
- New paired relationships identified

**Last Updated:** 2025-01-27
**Sources:**
- LiaiZen PRD v1.0.0
- User Research - Couple Dynamics Study
- User Research - Co-Parenting Communication Dynamics (Athena & Yashir)

---

*For coparentliaizen.com - Better Co-Parenting Through Better Communication*
