# Product Requirements Document (PRD): LiaiZen

**Project**: `liaizen`
**Created**: 2025-11-24
**Owner**: Product Team
**Status**: Active
**Version**: 1.0.0

---

## 📋 Executive Summary

### Vision Statement
Transform high-tension co-parenting exchanges into respectful, child-centered dialogue through intelligent mediation technology. LiaiZen empowers separated parents to communicate effectively, reduce conflict, and prioritize their children's wellbeing through AI-powered message mediation, secure task sharing, and comprehensive communication tools designed specifically for the unique challenges of co-parenting.

### Problem Statement
Separated and divorced parents face significant communication challenges that directly impact their children's wellbeing. High-conflict exchanges, misunderstandings due to different communication styles, lack of documentation for legal/custody purposes, and difficulty coordinating shared responsibilities create stress for both parents and children. Existing communication tools (email, text messaging, general chat apps) lack features specifically designed for co-parenting: conflict de-escalation, message mediation, audit trails for legal purposes, and child-centered communication prompts. Parents need a platform that actively helps them communicate better, not just a conduit for messages that can escalate tensions.

### Success Metrics
- **Primary Metric**: Message sentiment improvement (30% reduction in negative/hostile messages within 3 months of use)
- **Secondary Metrics**:
  - Monthly Active Users (MAU): 10,000 users within 6 months of launch
  - AI Mediation Acceptance Rate: 60% of users accept AI rewrite suggestions
  - Task Completion Rate: 80% of assigned tasks completed on time
  - User Retention: 70% of users active after 3 months
  - Conflict De-escalation: 40% reduction in multi-message argument threads
  - Average Response Time: Parents respond to co-parent messages within 24 hours (vs. 3+ days industry average)

### Target Audience
- **Primary Users**: Separated/divorced parents managing joint or shared custody arrangements (ages 25-50, varying technical skill levels)
- **Secondary Users**: Family law attorneys seeking to reduce client communication conflicts and billable mediation hours
- **Stakeholders**: Children of separated parents (indirect beneficiaries), family therapists, co-parenting counselors, mental health professionals

---

## 🎯 Product Goals & Objectives

### Short-term Goals (0-3 months)
1. Launch MVP with core messaging, AI mediation, and contact management to 500 beta users
2. Achieve 60% AI mediation acceptance rate (users accepting rewrite suggestions)
3. Establish reliable real-time messaging infrastructure with 99.5% uptime
4. Validate core value proposition: measurable reduction in conflict through message sentiment analysis
5. Build trust with early adopters through robust privacy controls and COPPA/GDPR compliance

### Medium-term Goals (3-6 months)
1. Scale to 10,000 Monthly Active Users with positive user retention (70%+ at 3 months)
2. Launch task management and calendar integration features for comprehensive co-parenting coordination
3. Establish partnerships with 5 family law firms for attorney referrals and platform validation
4. Develop mobile apps (iOS/Android) for on-the-go access and push notifications
5. Build content library of co-parenting resources and conflict resolution guides

### Long-term Vision (6-12 months)
1. Become the leading co-parenting communication platform with 50,000+ active users
2. Launch premium features: document storage, expense tracking, advanced analytics
3. Expand to become a social platform for respectful family communication as children age into adulthood
4. Expand AI capabilities: predictive conflict alerts, personalized communication coaching, stress level detection
5. Build therapist/counselor portal for professional oversight and intervention recommendations
6. Explore international expansion with multi-language support and region-specific family law compliance

### Non-Goals
- **Not a dating or social networking platform** - LiaiZen is strictly for co-parent communication, not for finding new partners or socializing
- **Not a legal advice platform** - We provide tools for communication and documentation, but not legal counsel or custody recommendations
- **Not a therapy/counseling replacement** - AI mediation assists communication but does not replace professional mental health support
- **Not a child monitoring tool** - We do not track children's activities, locations, or communications (COPPA compliance)
- **Not a general-purpose chat app** - Focus remains exclusively on co-parenting use cases, not expanding to general messaging
- **Not a financial services platform** - Expense tracking is for record-keeping, not payment processing or financial advice

---

## 👥 User Personas

### Primary Persona: Sarah - Recently Divorced Mother
- **Background**: 38-year-old marketing manager, divorced 18 months ago, shares 50/50 custody of two children (ages 7 and 10) with her ex-husband. Moderately tech-savvy, uses smartphone for most communication. Lives in suburban area, works full-time.
- **Communication Struggles & Real Costs**:
  - **The Endless Conflict Cycle**: Every message exchange spirals into multi-day arguments where old grievances resurface. A simple "Can you pick up Emma early on Friday?" becomes "You NEVER help when I need you" and then devolves into rehashing who forgot whose soccer game two years ago. They haven't successfully resolved a single scheduling conflict without fighting in over a year.
  - **Financial Drain**: Has spent $8,000 in attorney fees this year just to mediate communication breakdowns—her lawyer literally bills $400/hour to translate her emotional texts into something reasonable. One heated text exchange cost her $1,200 when her attorney had to intervene to de-escalate the situation and get the conversation back on track.
  - **Lost Relationship with Kids**: Her 10-year-old daughter now refuses to tell her about school events because "it always starts a fight with Dad." Sarah missed her daughter's piano recital because her ex-husband claimed he "never got the message" about the date change—but their text thread shows he did, buried in an argument about summer vacation.
  - **Constant Battle Mentality**: She can't communicate about anything without it becoming a battle. Asking about medication schedules turns into accusations. Sharing teacher feedback becomes blame warfare. She's stuck in a loop where every interaction with her ex leaves her shaking with anger and regret.
  - **Drowning in the Past**: They can't discuss anything current without him dragging up things from years ago. A conversation about Emma's math tutor becomes "Well you're the one who..." referencing something from 2019. She's exhausted from fighting the same battles over and over instead of focusing on their children's needs today.
  - **No Productive Outcomes**: After 18 months of separation, they still haven't figured out how to make a single decision together. Every conversation ends in stalemate or one parent unilaterally deciding out of frustration. Their kids are suffering because their parents literally cannot communicate effectively enough to coordinate basic parenting.
- **Behaviors**:
  - Drafts and re-drafts messages dozens of times, paralyzed by fear of saying the wrong thing
  - Loses sleep before hitting "send" on anything, knowing it will likely trigger a fight
  - Screenshots messages obsessively, anticipating she'll need proof of "what he really said" later
  - Vents to friends for hours trying to figure out how to respond without escalating
  - Avoids necessary conversations entirely, letting important issues fester because she can't face another argument
- **Success Criteria**:
  - Can communicate about children's needs without every exchange becoming a war
  - Stops wasting thousands of dollars on attorney mediation for basic communication
  - Rebuilds trust with her daughter that it's safe to share information between households
  - Reaches actual decisions and agreements instead of endless conflict loops
  - Can discuss present-day issues without the past being weaponized against her

### Secondary Persona: Mike - Father in High-Conflict Co-Parenting Situation
- **Background**: 42-year-old construction foreman, divorced 3 years ago, has children every other weekend and one weeknight. Not highly tech-savvy, primarily uses phone for calls/texts. Currently in ongoing custody dispute seeking more parenting time.
- **Communication Struggles & Real Costs**:
  - **Words Used Against Him**: Everything he says gets misinterpreted and escalated. His straightforward "No, that doesn't work for me" gets read as hostile and dismissive. His brief texts come across as uncaring when he's just trying to be efficient. His inability to express himself clearly is damaging his relationship with both his ex-wife and his children.
  - **Constant Accusations**: His ex-wife claims he "never responds" to messages, but he does—just not always in the exact way she wants. She accuses him of being "difficult" when he's just trying to state his availability. Every interaction leaves him feeling like he's failing, even when he's trying his best.
  - **Missing His Kids' Lives**: He missed his son's championship soccer game because the message was buried in a 47-text argument about summer vacation. His daughter's parent-teacher conference happened without him because he "didn't respond fast enough"—he was on a construction site with spotty service. He's losing precious moments with his children because their communication is broken.
  - **Can't Say What He Means**: He's not good with words. When he tries to explain his work schedule conflicts, it comes out sounding harsh. When he's hurt that his kids didn't mention their weekend with him, he can't express it without sounding accusatory. His inability to communicate the way lawyers and judges expect is literally costing him time with his children.
  - **Draining His Savings**: He's spent $12,000 in legal fees over the past year, much of it because their communication is so toxic that everything requires attorney intervention. His lawyer charges him $350/hour to help him respond to his ex-wife's messages. He can't afford to keep fighting like this, but he can't afford to stop fighting for his kids either.
  - **Reliving the Same Arguments**: Every conversation about the present somehow becomes a trial about the past. She brings up things he said three years ago. She reinterprets his intentions based on old conflicts. He can't move forward because she won't let the past go—and he doesn't know how to break the cycle.
  - **Never Reaching Resolution**: They can't agree on anything. Pickup times, holiday schedules, school decisions—everything turns into a fight that goes nowhere. He's exhausted from trying to coordinate basic parenting with someone who treats every interaction as a battlefield.
- **Behaviors**:
  - Types and deletes messages repeatedly, terrified of saying the wrong thing that will escalate the conflict
  - Delays responding because he's afraid his message will make things worse
  - Shows every text to his attorney before sending (when he can afford to)
  - Avoids necessary conversations because he knows they'll end badly
  - Keeps kids in the dark about issues to protect them from the conflict
- **Success Criteria**:
  - Can communicate clearly without his words being misinterpreted or escalating conflicts
  - Learns how to express himself in a way that doesn't escalate conflicts
  - Stops bleeding money on attorney fees just to manage basic communication
  - Stops missing important moments in his children's lives due to communication breakdowns
  - Reaches actual agreements about parenting instead of endless stalemates

### Tertiary Persona: Jessica - Family Law Attorney
- **Background**: 35-year-old attorney specializing in family law and custody cases, represents 15-20 active divorce/custody clients at any time. Tech-savvy, early adopter of legal tech tools.
- **Communication Struggles & Real Costs**:
  - **Watching Clients Sabotage Themselves**: She sees clients damage their co-parenting relationships not because they're bad parents, but because they can't stop sending hostile, emotional messages. One client lost ground in custody negotiations because his aggressive communication style demonstrated poor judgment. Another client's angry texting patterns illustrated an inability to co-parent collaboratively. The communication breakdown is costing her clients their relationships with their children.
  - **Impossible to Build Cases on Chaos**: Her clients hand her scattered screenshots from five different platforms—text, email, Facebook Messenger, WhatsApp—with no context, no complete records, and conflicting timelines. Opposing counsel disputes authenticity. She can't demonstrate patterns of cooperation or obstruction when the records are a disorganized mess.
  - **Billing for What Should Be Free**: She spends 10-15 billable hours per client per month just helping them communicate—literally reviewing and rewriting their messages to their co-parent. At $350-400/hour, clients are paying thousands just to say "Can you pick up the kids at 5?" in a way that won't escalate into another fight. This isn't legal strategy—it's basic communication they should be able to handle themselves.
  - **Creating More Conflict Than Solving**: When clients can't communicate, every minor disagreement becomes a legal issue requiring her intervention. A simple schedule change becomes a $800 attorney exchange. A question about medical decisions becomes a motion requiring court time. The communication failures generate legal work that benefits no one—not her clients, not their children, not the court system.
  - **Unable to Help Them Improve**: She can tell clients "communicate respectfully" until she's blue in the face, but they don't have the tools to actually do it in the heat of the moment. They need real-time help learning healthier communication, not after-the-fact attorney intervention when the damage is already done.
- **Behaviors**:
  - Spends hours reconstructing communication timelines from fragmented screenshots
  - Pre-reviews client messages before they send them (when clients have the budget)
  - Refers clients to communication platforms but most are either too basic or too therapy-focused
  - Wishes she could prescribe a tool that actually teaches communication skills, not just record failures
  - Sees the same dysfunctional patterns repeat across dozens of cases
- **Success Criteria**:
  - Clients learn to communicate effectively without constant attorney intervention
  - Has clean, complete communication records to build cases on
  - Reduces billable hours spent on basic communication mediation
  - Can show client improvement in communication patterns over time
  - Clients stop sabotaging their own co-parenting relationships through poor communication

### Quaternary Persona: David - Co-Parent with Minimal Conflict
- **Background**: 45-year-old teacher, amicably divorced 5 years ago, shares custody 60/40 with ex-wife. Strong communicators with low conflict, both remarried.
- **Communication Struggles & Real Costs**:
  - **Small Misunderstandings That Add Up**: Even though they're amicable, communication gaps still cost them. Last month he showed up to a soccer game his ex-wife already attended—wasted 2 hours driving across town because they didn't coordinate. His son needed permission slips signed by both parents, but the deadline passed because the message got lost in their casual text thread.
  - **Scattered Information, Constant Questions**: They text, email, and leave notes. His ex-wife asks "What's the new dentist's number?" for the third time this year because there's no central place to store it. He has to dig through months of texts to find when they discussed summer camp last year. The disorganization wastes time and creates friction even in a low-conflict relationship.
  - **Partners Left Out**: His new wife wants to help coordinate schedules but has no visibility into what's been discussed. His ex-wife's husband sometimes duplicates purchases (two new soccer cleats) because no one knows who's handling what. Even amicable co-parenting gets messy when there's no clear system.
  - **Tension Creeps In**: They're generally respectful, but occasional tone misunderstandings still happen. A brief "Can't do Tuesday" text felt dismissive to her when he was just rushed. She sometimes interprets his questions as criticism when he's just trying to coordinate. Even healthy co-parents benefit from communication that reduces misunderstanding.
  - **No Way to Track Their Success**: They're actually good at this, but have no way to see their progress or patterns. If they ever need to demonstrate their collaborative approach (for example, when discussing custody modifications for the relocation his ex-wife is considering), they have no organized record of their respectful communication. Their success is invisible because it's scattered across platforms.
- **Behaviors**:
  - Texts and emails interchangeably, creating scattered records
  - Re-asks questions because previous answers are buried in threads
  - Coordinates mostly through their kids as messengers (not ideal but easier)
  - Occasionally has small frustrations that are quickly resolved but still annoying
  - Wishes for better organization without the "we need therapy" feeling of conflict-focused tools
- **Success Criteria**:
  - Maintains their healthy communication while adding organization and efficiency
  - Reduces time wasted on miscommunication and duplicate efforts
  - Has transparency that includes new partners without awkwardness
  - Prevents small misunderstandings before they cause friction
  - Can reference their communication history and collaborative patterns when needed

---

## 🗺️ User Journey Maps

### Journey 1: First-Time User Onboarding (Sarah's Journey)
**Persona**: Sarah - Recently Divorced Mother

1. **Discovery**: Sarah's therapist mentions LiaiZen after hearing about yet another text fight with her ex. She searches "stop fighting with co-parent" on her iPhone and finds LiaiZen. Reads landing page emphasizing "AI blocks hostile messages before they're sent" and "learn healthier communication" - both resonate deeply with her exhaustion.

2. **Onboarding**:
   - Creates account with Google OAuth (fast, doesn't want complex signup)
   - AI immediately pre-populates smart tasks: "Send welcome message to co-parent," "Add children's information," "Upload important contacts (pediatrician, school)"
   - Completes brief profile: children's names/ages, custody arrangement (50/50), relationship context (high-conflict, triggers include: past accusations, blame language)
   - No tutorial videos - AI learns from her as she goes
   - Sends first message to ex-husband: "Hi, I'm trying this app that helps us communicate better for the kids. Will you join?"
   - AI analyzes: "This message is calm and child-focused. Sending immediately." Message goes through without blocking.

3. **Core Usage - AI Learning & Adaptation**:
   - **Day 3**: Ex-husband joins after seeing her invitation. Sarah drafts response to his message about pickup: "You're ALWAYS late. I'm sick of this."
     - **AI BLOCKS the message**. Shows her: "This contains 'always' statements and expresses frustration about past patterns rather than the current need."
     - **Communication tip**: "Focus on the specific situation, not the pattern."
     - **Rewrite 1**: "I need you to be on time for Friday's pickup at 5pm. Can you confirm?"
     - **Rewrite 2**: "Friday's pickup is at 5pm. I have a work meeting at 5:30, so I need you there by 5. Text me when you're on the way?"
     - Sarah selects Rewrite 2. Message sends. Ex-husband responds: "Got it, I'll be there at 4:55." No fight.

   - **Week 2**: Sarah tries to send: "She told me you didn't make her lunch yesterday."
     - **AI BLOCKS**. "This involves triangulation (speaking for the child) and focuses on blame."
     - **Tip**: "Speak about your own needs, not through the child."
     - **Rewrite 1**: "Can we talk about lunch plans for her school days? I want to make sure she's eating well."
     - **Rewrite 2**: "I'm checking in about lunches - do you need me to send food on your days or are you handling it?"
     - She chooses Rewrite 1. They have a productive conversation about meal coordination.

   - **Week 4**: Sarah starts a message about holiday schedule. Types: "I'm worried about—"
     - **AI ALLOWS IT**. Over time, AI has learned Sarah's "I'm worried about" phrasing is genuine concern, not accusatory. The full message: "I'm worried about Thanksgiving timing with your parents. Can we discuss?" goes through without intervention.
     - AI is adapting to her communication style and learning when she's being constructive vs. hostile.

4. **Advanced Usage - AI Evolution**:
   - **Month 3**: Sarah notices she's typing fewer hostile messages to begin with. AI has only blocked 2 messages this week vs. 8/week in Month 1. She's learning healthier patterns.
   - **Month 4**: AI now recognizes her communication style well enough that 95% of her messages go through unblocked. The few that get blocked are genuinely problematic, and she immediately recognizes why.
   - **Month 6**: Ex-husband's communication has also improved (AI is training him too). They're reaching agreements faster. Sarah's stress about co-parenting communication has dropped dramatically. Her kids notice—daughter shares school information freely again.
   - **Year 2**: The kids are now teenagers. As they age, Sarah and her ex start using LiaiZen less for conflict mediation (barely needed anymore) and more as a coordination hub—shared expenses, college planning, family event coordination. The platform has evolved with them from crisis tool to respectful collaboration platform.

5. **Long-Term Vision**: Years later, as children become adults, Sarah and her ex-husband continue using LiaiZen not as "co-parents" but as two adults who share family connections and need to coordinate holidays, graduations, and eventually grandchildren. The AI that once blocked their hostile messages now simply facilitates respectful, organized communication. LiaiZen has become a social platform for people who've learned to communicate with mutual respect.

**Pain Points**:
- **Week 1**: Frustrated when AI blocks messages she "needs to send" - doesn't yet see the pattern
- **Week 2**: Wishes AI understood context better (learns this improves as AI learns her style)
- **Month 1**: Ex-husband complains the app is "censoring" him - needs time to trust the process

**Breakthrough Moments**:
- **Week 2**: First time a blocked message prevents a three-day argument
- **Month 2**: Daughter says "You and Dad aren't fighting as much" - validates the change
- **Month 4**: Realizes she's THINKING differently before typing, not just relying on AI to fix it
- **Month 6**: Ex-husband texts her outside the app to say "This is actually helping"

### Journey 2: Attorney-Facilitated Adoption (Mike's Journey)
**Persona**: Mike - Father in High-Conflict Co-Parenting Situation

1. **Discovery**: Mike's attorney recommends LiaiZen during their third meeting about communication issues. Attorney says: "I can't keep billing you $350/hour to rewrite your texts. This app will teach you to communicate without constantly escalating. Your ex-wife needs to use it too—this isn't about her behavior, it's about both of you learning healthier patterns."

2. **Onboarding**:
   - Creates account with email/password (doesn't use Google account for personal reasons)
   - AI pre-populates smart tasks: "Invite co-parent," "Add children's information," "Set up shared contacts"
   - Completes profile: children's info, custody schedule, notes that he "struggles to say things the right way"
   - No tutorials - AI will teach through doing
   - Invites ex-wife via email. She accepts within 2 days.

3. **Core Usage - Learning to Communicate**:
   - **Day 1**: Sees ex-wife's message about schedule change: "I need to switch weekends because of my sister's wedding." Mike types: "No way. You always do this last minute."
     - **AI BLOCKS**. "This uses 'always' language and doesn't address the actual request."
     - **Tip**: "State your constraint, not your frustration."
     - **Rewrite 1**: "I already have plans that weekend. Can we look at other options?"
     - **Rewrite 2**: "I have work commitments that weekend. Would the following weekend work instead?"
     - Mike picks Rewrite 1. Ex-wife responds calmly, they negotiate. First time in months they've resolved something without fighting.

   - **Week 2**: Mike's at construction site during lunch. Ex-wife asks about their son's medication schedule. Mike types one-handed while eating: "Figure it out yourself."
     - **AI BLOCKS**. "This is dismissive and doesn't help coordinate care."
     - **Tip**: "Acknowledge even if you need time to respond."
     - **Rewrite 1**: "I'm at work right now. Can I call you tonight to discuss?"
     - **Rewrite 2**: "Let me check my notes and get back to you by 3pm."
     - Mike chooses Rewrite 2. Uses voice-to-text. Gets it sent quickly without causing conflict.

   - **Month 1**: Mike notices he's thinking before typing now. He starts a message: "That won't work for me because..." and AI lets it through. He's learning the pattern—state facts, not emotions.

4. **Advanced Usage - Reputation Protection & Skill Building**:
   - **Month 2**: Mike's attorney asks how communication is going. Mike shows her the message history. Attorney sees calm, respectful exchanges. Says: "This is exactly what I needed to see. Keep this up—this shows you're capable of collaborative co-parenting."
   - **Month 3**: Ex-wife tries to bait him in a message: "You never cared about the kids' schoolwork anyway." Mike starts typing a defensive response. **AI BLOCKS** before he makes it worse. Rewrite: "I'd like to be more involved in homework help. Can we set up a system?" Crisis averted. His reputation protected.
   - **Month 5**: AI rarely blocks Mike's messages anymore. He's internalized healthier communication. The platform is less about blocking him and more about helping him coordinate efficiently.
   - **Year 1**: Custody hearing happens. His attorney points to consistent, respectful communication pattern. Judge grants Mike 50/50 custody—increased from his previous every-other-weekend. The improved communication was a key factor.

5. **Long-Term Evolution**: Mike continues using LiaiZen for years. As kids grow, platform shifts from conflict prevention to coordination tool. Eventually, when his daughter graduates high school, Mike and his ex-wife use the platform to coordinate college visits, share expenses for graduation party, plan family events. The AI that once saved him from his worst impulses now just helps them stay organized. They've learned to respect each other.

**Pain Points**:
- **Week 1**: Feels like app is "controlling" him - doesn't like being told he's wrong
- **Week 3**: Frustrated when AI blocks messages that "aren't that bad"
- **Month 1**: Spotty cell service at work sites causes delays (offline mode helps)

**Breakthrough Moments**:
- **Week 2**: First time his ex-wife responds positively to his message - realizes this is working
- **Month 2**: Attorney says "I'm not worried about your communication anymore" - huge validation
- **Month 5**: His daughter tells him "You and Mom don't fight as much" - makes everything worth it
- **Year 1**: Wins increased custody partly due to improved communication - life-changing

### Journey 3: Low-Conflict Organizational Use (David's Journey)
**Persona**: David - Co-Parent with Minimal Conflict

1. **Discovery**: David searches "co-parent coordination app" after his new wife asks why he and his ex don't have a better system. Finds LiaiZen. Initially concerned it's conflict-focused, but reads "prevent misunderstandings before they happen" and "transparent coordination" - decides to try it.

2. **Onboarding**:
   - Creates account, invites ex-wife (she joins same day)
   - AI pre-populates smart tasks: "Add shared contacts," "Set up calendar sync," "Create first coordination task"
   - Both complete profiles - mark themselves as "collaborative communicators"
   - No conflict-focused tutorial - AI recognizes their low-conflict status and tailors onboarding to organization

3. **Core Usage - Preventing Small Issues**:
   - **Week 1**: They communicate mostly through text still. Then David types a quick message in LiaiZen about soccer practice: "Can't do Tuesday."
     - **AI analyzes but doesn't block** - it's not hostile, but could be clearer. AI suggests: "Consider adding your constraint and proposing alternative: 'I have a staff meeting Tuesday. Can you handle pickup or should we ask his grandmother?'"
     - David thinks "Good point" and uses the suggestion. Ex-wife appreciates the clarity and alternative. No back-and-forth needed.

   - **Week 3**: Ex-wife messages: "Your wife bought new cleats?" (She's confused, not accusatory)
     - David starts typing: "Yeah, I told you we would."
     - **AI BLOCKS softly**: "This could sound defensive. She may not remember that conversation."
     - **Tip**: "Assume coordination gap, not blame."
     - **Rewrite 1**: "Yes, we handled it last week. I thought I mentioned it but may have forgotten to confirm!"
     - **Rewrite 2**: "We did! Sorry if I didn't confirm - they're in his bag. No need to duplicate."
     - David picks Rewrite 2. Crisis averted before it became one.

   - **Month 2**: AI has learned their communication style. Most messages go through without intervention. The rare suggestions are appreciated - they prevent small misunderstandings from becoming friction.

4. **Advanced Usage - Expanding the Network**:
   - **Month 3**: David invites his new wife to view-only access. She can see schedules, tasks, and contact information. Ex-wife approves. Now everyone is on the same page—no more duplicate purchases or scheduling conflicts.
   - **Month 6**: They add grandparents to shared calendar view. Family events get coordinated smoothly. No more "I didn't know about the recital" situations.
   - **Year 2**: Kids are teenagers now. David and his ex use LiaiZen primarily for coordination—who's handling car insurance, college visit schedules, shared expenses for proms and sports equipment. AI mediation is rarely needed (maybe once every few months when stress is high). The platform has evolved into a family coordination hub.

5. **Long-Term Vision**: Years later, David's kids are adults. He and his ex-wife still use LiaiZen to coordinate family holidays, share updates about grandchildren when they come, split costs for family gifts. What started as a co-parenting tool has become a permanent fixture for their extended family network—a respectful, organized way for people with shared family ties to stay connected. LiaiZen has evolved beyond co-parenting into a social platform for healthy, respectful family coordination.

**Pain Points**:
- **Week 1**: Worries platform is "overkill" for their low-conflict situation
- **Week 2**: Occasionally feels AI suggestions are unnecessary when they're already being respectful
- **Month 1**: Learning curve for new spouse getting access - clarity needed

**Breakthrough Moments**:
- **Week 3**: AI prevents a small misunderstanding from escalating - realizes even healthy relationships benefit from clarity
- **Month 3**: New wife says "This makes everything so much easier" - validates the tool
- **Year 1**: His ex-wife's new husband texts: "Thanks for setting this up, makes my life easier too"
- **Year 2**: Realizes they're modeling healthy co-parenting for their kids, who will use these skills in their own relationships

---

## ⚙️ Core Features & Requirements

### Feature Category 1: Real-Time Communication
**Priority**: High (MVP Critical)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 1.1: WebSocket-Based Messaging
**User Story**: As a co-parent (Sarah/Mike), I want to send and receive messages in real-time so that I can coordinate time-sensitive matters like schedule changes without delays.

**Acceptance Criteria**:
- [ ] Given two co-parents in a room, when User A sends a message, then User B receives it within 2 seconds
- [ ] Given a user with poor connectivity, when connection is lost, then messages queue locally and send when reconnected
- [ ] Given a user on mobile, when app is backgrounded, then push notifications alert user to new messages
- [ ] Messages display with timestamp and sender name
- [ ] No read receipts (prevents "why didn't you respond if you saw it?" conflicts)
- [ ] If co-parent hasn't responded in 3+ hours, system gently prompts sender: "Still waiting? You could send: 'No rush, but could you let me know by [time]?'"
- [ ] Message history is searchable by keyword, date range, sender
- [ ] Maximum message length: 5000 characters (prevents wall-of-text abuse)
- [ ] Support for basic formatting: line breaks, emphasis (no rich HTML to prevent abuse)

**Dependencies**: Socket.io infrastructure, user authentication, room membership
**Constraints**:
- Real-time requires WebSocket support (fallback to polling for old browsers)
- Message storage must comply with data retention policies (7 years for legal purposes)
- End-to-end encryption not feasible due to AI mediation requirement (messages must be readable by AI)
**Success Metrics**:
- Message delivery latency <2 seconds for 95% of messages
- Zero message loss rate
- 80% of users send first message within 24 hours of joining

#### Feature 1.2: Room-Based Privacy Model
**User Story**: As a co-parent (Sarah), I want my messages with my ex-husband to be completely private from other users so that sensitive family information stays confidential.

**Acceptance Criteria**:
- [ ] Given a user account, when user creates room, then only invited co-parent can access messages
- [ ] Given an invitation, when recipient accepts, then both users see full message history
- [ ] Given an invitation, when recipient declines or doesn't respond, then sender can cancel invitation
- [ ] Room membership limited to 2 co-parents (no group chats to maintain focus)
- [ ] Optional: Read-only "observer" role for attorneys, therapists (with both co-parent approval)
- [ ] Room deletion requires both co-parent approval (or single user after account dormancy period)

**Dependencies**: User authentication, invitation system
**Constraints**:
- Two-party limitation (no group co-parenting for multiple parents)
- Cannot remove co-parent once accepted (data retention for legal purposes)
**Success Metrics**:
- 90% of invitations accepted within 7 days
- Zero data breach incidents
- Zero unauthorized access incidents

#### Feature 1.3: Message History & Search
**User Story**: As a co-parent (Mike), I want to search through past conversations so that I can quickly reference previous agreements and decisions.

**Acceptance Criteria**:
- [ ] Given user in room, when user searches messages, then results display within 2 seconds
- [ ] Search supports keyword matching, date range filtering, and sender filtering
- [ ] Search highlights matching text in context
- [ ] User can jump to full conversation from search result
- [ ] Message history loads progressively as user scrolls (infinite scroll)
- [ ] Search indexes updated in real-time as new messages arrive

**Dependencies**: Message storage, search indexing, authentication
**Constraints**:
- Search must work on mobile with limited screen space
- Search performance must scale to 10,000+ messages per room
**Success Metrics**:
- 60% of users use search feature within first month
- Average search completion time <2 seconds
- 80% of searches return relevant results (user doesn't refine search)

### Feature Category 2: AI-Powered Message Mediation (CORE VALUE PROPOSITION)
**Priority**: CRITICAL (MVP Essential - Product Differentiator)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 2.1: Real-Time Message Blocking & Analysis
**User Story**: As a co-parent (Sarah) about to send an angry message, I want the AI to prevent me from sending it and show me why it's problematic so that I can learn healthier communication patterns.

**Acceptance Criteria**:
- [ ] Given user composing message, when user attempts to send, then AI analyzes message in real-time (<2 seconds)
- [ ] AI determines action: ALLOW (send immediately), BLOCK (prevent sending), or SUGGEST (gentle guidance)
- [ ] **BLOCK triggers when message contains**:
  - Always/never statements ("You ALWAYS forget", "You NEVER help")
  - Personal attacks or name-calling
  - Threats or ultimatums
  - Blaming language focused on past grievances
  - Triangulation (speaking through children)
  - Hostile tone with profanity or aggressive caps
- [ ] **ALLOW triggers when message is**:
  - Factual and specific (dates, times, logistics)
  - Solution-oriented and child-focused
  - Respectful request or clarification
  - Acknowledging receipt or agreement
- [ ] **SUGGEST triggers when message could be clearer** (low-conflict users)
- [ ] User sees blocking decision within 2 seconds of attempting to send
- [ ] Blocked message UI shows: "This message can't be sent" with clear explanation

**Dependencies**: OpenAI API integration, message composition UI, real-time WebSocket
**Constraints**:
- AI analysis costs ~$0.02-0.04 per message (GPT-3.5 Turbo for speed/cost balance)
- Must handle edge cases: sarcasm, cultural differences, non-English
- Cannot guarantee 100% accuracy - will have false positives (better safe than sorry)
- Must work offline (queue analysis when reconnected)
**Success Metrics**:
- AI blocks 40-50% of messages in Week 1 for high-conflict users
- AI blocking drops to 10-20% by Month 3 (users learning)
- <3 second analysis time for 95% of messages
- <8% false positive rate (neutral messages incorrectly blocked) based on user appeals

#### Feature 2.2: Conversational Mediation Response (REQUIRED FORMAT)
**User Story**: As a co-parent (Mike) whose message was blocked, I want to understand WHY I wouldn't want to send it and see constructive alternatives so that I can learn to communicate better.

**Acceptance Criteria**:
- [ ] Given AI blocks message, when block screen displays, then user sees THREE components:
  1. **Conversational Explanation**: Why sender wouldn't want to send that message (conversational tone, specific to their situation and relationship context)
  2. **Communication Tip**: One actionable skill relative to them and their situation
  3. **Two Rewrites**: Two complete alternative messages preserving core intent
- [ ] **Conversational Explanation examples** (friendly, not clinical):
  - "Hey, I get you're frustrated, but sending this will probably start another argument about past stuff instead of solving Friday's pickup. You've told me before that rehashing the past makes things worse with [co-parent's name]."
  - "I know you're hurt that [child's name] didn't mention this, but bringing them into it ('she told me...') puts them in the middle. You've shared that you want to keep the kids out of your conflicts."
  - "This sounds defensive, and from what I know about [co-parent's name], they'll probably take it as picking a fight. You've said you want to have fewer blow-ups."
- [ ] **Communication Tip examples** (personalized to their context):
  - "Try focusing on Friday's specific logistics, not the pattern you're seeing."
  - "Share what you need without referencing what [child's name] said."
  - "Lead with your constraint (your work schedule) rather than reacting to their tone."
- [ ] **Rewrite Format**:
  - Rewrite 1: Direct and factual approach
  - Rewrite 2: Collaborative and solution-oriented approach
  - Both preserve user's core message but change delivery
  - Both are complete, sendable messages (not fragments)
- [ ] User has three options: Select Rewrite 1, Select Rewrite 2, or "Write New Message"
- [ ] "Write New Message" returns to empty composer (NOT original text), user writes fresh message from scratch
- [ ] New message is analyzed by AI before sending (may be allowed, blocked again, or gently suggested)
- [ ] System tracks which rewrite user selected for AI learning
- [ ] Entire flow (block → display → user selection) completes in <5 seconds

**Dependencies**: OpenAI API (GPT-4 Turbo for conversational quality), Feature 2.1 blocking system, user context data (from Feature 2.4)
**Constraints**:
- Conversational tone requires rich context: co-parent's name, children's names, user's stated concerns/goals
- Quality degrades if user hasn't provided context during onboarding
- Cost per block event: ~$0.04-0.08 (includes analysis + 2 rewrites)
- Must feel like a supportive friend, not a clinical therapist or judgmental authority
- Cultural and language nuances may be missed
**Success Metrics**:
- 70% of users select one of the two rewrites
- 20% of users write new message (shows engagement with learning)
- <10% of users repeatedly write new messages that get blocked again (indicates frustration or not learning)
- Users report AI feels "like a supportive friend" not "like being scolded" (>4.2/5.0 rating)
- Users say AI "understands my situation" (>75% agreement)
- Average time from block to rewrite selection: <30 seconds (user not stuck)

#### Feature 2.3: Adaptive AI Learning (User-Specific Patterns)
**User Story**: As a co-parent (Sarah) who's been using LiaiZen for months, I want the AI to understand my communication style so that it doesn't block constructive messages that happen to use phrases that could be problematic in other contexts.

**Acceptance Criteria**:
- [ ] Given user has 30+ days of message history, when AI analyzes new message, then AI considers user's historical patterns
- [ ] **AI learns**:
  - User's baseline tone and phrasing style
  - Which phrases user uses constructively (e.g., "I'm worried about" = genuine concern, not manipulation)
  - User's typical response time and message length
  - Which communication tips have been most effective for this user
  - Which types of messages this user struggles with most
- [ ] **Adaptive blocking**:
  - Week 1-2: Strict blocking (learning phase)
  - Week 3-4: Adjusts to user's baseline
  - Month 2+: Personalizes to user's voice while maintaining healthy communication standards
- [ ] AI intervention frequency decreases over time as user improves:
  - High-conflict users: 40-50% blocks (Week 1) → 10-20% blocks (Month 3)
  - Low-conflict users: 10-15% suggestions (Week 1) → 2-5% gentle nudges (Month 3)
- [ ] User can view "Communication Progress" dashboard showing:
  - Blocked messages over time (trending down = learning)
  - Most common communication patterns improved
  - Skills mastered (e.g., "You've stopped using 'always/never' statements")
- [ ] System stores AI mediation events anonymously for continuous model improvement

**Dependencies**: AI mediation database, user message history, analytics dashboard
**Constraints**:
- Requires minimum 2 weeks of data to personalize effectively
- Cannot compromise safety: even adapted AI still blocks clearly hostile content
- Privacy concern: AI learning from user messages (must be transparent in privacy policy)
**Success Metrics**:
- 50% reduction in AI blocks between Month 1 and Month 3 (users learning)
- 85% of users report AI "gets better at understanding me over time"
- <5% of long-term users (6+ months) report AI blocks appropriate messages
- Users view progress dashboard average 2-3 times per month

#### Feature 2.4: Smart Onboarding Tasks (Context Building)
**User Story**: As a new user (Sarah), I want the platform to guide me through providing context about my co-parenting situation so that the AI can give me personalized help from day one.

**Acceptance Criteria**:
- [ ] Given user creates account, when onboarding completes, then AI pre-populates smart tasks:
  1. "Send welcome message to co-parent" (template provided)
  2. "Add your children's information" (names, ages, custody schedule)
  3. "Upload key contacts" (pediatrician, school, emergency contacts)
  4. "Describe your communication challenges" (optional, helps AI understand context)
  5. "Set communication preferences" (notification settings, conflict level: high/medium/low)
- [ ] Tasks are marked as "Setup" priority and appear in dashboard
- [ ] Each task includes:
  - Clear description of WHY it's important
  - Estimated time to complete (e.g., "2 minutes")
  - Link to complete the task directly
- [ ] AI uses completed task data to:
  - Tailor mediation approach (high-conflict = stricter, low-conflict = gentle suggestions)
  - Understand family structure for context in messages
  - Personalize communication tips based on stated challenges
- [ ] Users can skip tasks, but AI explains: "The more context you provide, the better I can help you communicate"
- [ ] Progress bar shows "Profile: 60% complete" to encourage completion

**Dependencies**: User onboarding flow, task management system, AI context database
**Constraints**:
- Must balance information gathering vs. overwhelming new users
- Privacy concern: sensitive family data must be encrypted
- Users may resist providing detailed information upfront
**Success Metrics**:
- 75% of users complete at least 3/5 onboarding tasks within first week
- 60% of users complete all 5 tasks within first month
- Users who complete all tasks show 30% better AI mediation satisfaction scores
- <5% of users report onboarding feels invasive or too lengthy

### Feature Category 3: Contact Management
**Priority**: High (MVP Critical)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 3.1: Comprehensive Contact & Relationship Management
**User Story**: As a co-parent (Sarah), I want to maintain a detailed directory of contacts AND track important relationship context so that the AI can understand my family dynamics and provide better mediation.

**Acceptance Criteria**:
- [ ] Given user in room, when user adds contact, then both co-parents see contact in directory
- [ ] **Contact Types**: Co-parent, Child, Professional (teacher/doctor), Family, Partner, Emergency
- [ ] **Base Fields** (all contacts): name, email, phone, relationship type, notes
- [ ] **Co-Parent Specific Fields**:
  - Separation date
  - Difficult aspects of relationship (multi-select: trust issues, communication, scheduling, financial, parenting styles)
  - Friction situations (text: specific triggers)
  - Legal matters (active cases, custody arrangement)
  - Safety concerns (substance abuse, mental health, neglect/abuse concerns)
  - Additional context (free-form notes)
- [ ] **Child Specific Fields**:
  - Age and birthdate
  - School information
  - Custody arrangement details
  - Linked to "other parent" contact
  - Activities (managed via child_activities table - see Feature 5)
- [ ] **Partner Specific Fields** (new partners/step-parents):
  - How long together (partner_duration)
  - Has children from other relationships (boolean)
  - Notes about integration with co-parenting
- [ ] **Professional Specific Fields**:
  - Organization/practice name
  - Specialty (for doctors)
  - Grade/subject (for teachers)
  - Office hours
- [ ] Either co-parent can add, edit, or delete contacts
- [ ] Contact changes are logged with timestamp and editor name (audit trail)
- [ ] Contacts are backed up automatically and can be copied to user's personal contact list
- [ ] **AI Integration**: Contact relationship data feeds into AI mediator for context-aware responses

**Dependencies**: User authentication, room membership, AI mediator system
**Constraints**:
- Extremely sensitive data (safety concerns, legal matters) - AES-256 encryption at rest
- COPPA compliance: children's names/ages stored but NOT behaviorally tracked
- Audit logging required for all contact data access
**Success Metrics**:
- Average of 8-15 contacts per co-parenting pair (higher due to comprehensive fields)
- 80% of users fill out co-parent relationship context fields (enables better AI mediation)
- 70% of users add at least 5 contacts within first month
- 50% reduction in "What's the pediatrician's number?" type messages
- AI mediation accuracy improves 30% when full context provided

#### Feature 3.2: Emergency Contact Protocols
**User Story**: As a co-parent (Mike) who doesn't have custody most of the time, I want to be notified immediately if there's an emergency involving my children so that I can respond quickly.

**Acceptance Criteria**:
- [ ] Given user designates contact as "Emergency", when contact is viewed/called, then other co-parent receives push notification
- [ ] Emergency contacts highlighted in red in directory
- [ ] Optional: "Emergency Alert" message type with high-priority notification
- [ ] Emergency messages bypass "do not disturb" settings (configurable)

**Dependencies**: Contact directory, push notifications
**Constraints**:
- Emergency feature could be abused for non-emergencies (need clear guidelines)
- Push notifications require mobile app or browser permissions
**Success Metrics**:
- <1% false emergency alert rate (abuse prevention)
- Emergency contacts used appropriately (based on user feedback)

### Feature Category 4: Task Management
**Priority**: High (MVP Critical)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 4.1: Shared Task Lists
**User Story**: As a co-parent (David), I want to create shared to-do lists for parenting responsibilities so that nothing falls through the cracks.

**Acceptance Criteria**:
- [ ] Given user in room, when user creates task, then both co-parents see task
- [ ] Tasks include: title, description, assigned to (one or both parents), due date, status (pending/completed)
- [ ] Tasks can be assigned to specific parent or "either parent"
- [ ] Task completion sends notification to other parent
- [ ] Overdue tasks highlighted in red
- [ ] Tasks can be recurring (weekly, monthly) - e.g., "Pick up child from soccer every Tuesday"

**Dependencies**: Room membership, notifications
**Constraints**:
- Task assignment could create resentment if one parent assigns all tasks to other
- Need fair distribution tracking/suggestions
**Success Metrics**:
- 80% task completion rate within 7 days of due date
- Average of 5-10 active tasks per co-parenting pair
- 60% of users report feeling more organized (survey)

#### Feature 4.2: Task History & Completion Tracking
**User Story**: As a co-parent (Sarah) frustrated that ex-husband "never does his share," I want to see task completion statistics so that I have objective data for discussions about workload balance.

**Acceptance Criteria**:
- [ ] Given tasks with assignments, when user views stats, then system shows completion rate per parent (percentage, number of tasks)
- [ ] Stats show on-time vs. late completions
- [ ] Stats displayed in dashboard with visual trends over time
- [ ] Stats displayed neutrally to avoid "scorekeeping" resentment
- [ ] Option to hide stats if both co-parents prefer (low-conflict users)

**Dependencies**: Task management, data analytics
**Constraints**:
- Task stats could exacerbate conflict if displayed confrontationally
- Need careful UX design to be informational, not accusatory
**Success Metrics**:
- 70% of users view task completion stats at least once per month
- <10% of users report stats increased conflict (survey)
- Users report feeling more balanced workload distribution

### Feature Category 5: Child Activities & Schedule Management
**Priority**: Medium (MVP Nice-to-Have, Phase 2 Essential)
**Timeline**: Phase 2 (Month 3-6)

#### Feature 5.1: Activity Tracking & Cost Splitting
**User Story**: As a co-parent (Sarah), I want to track my children's activities with schedules and costs so that both parents know what's happening and can fairly split expenses.

**Acceptance Criteria**:
- [ ] Given user with child contacts, when user adds activity, then activity is linked to specific child
- [ ] **Activity Information**:
  - Activity name, description, location
  - Instructor/coach contact information
  - Days of week, start time, end time
  - Recurrence pattern (weekly, biweekly, monthly, one-time)
  - Start date and optional end date (e.g., soccer season Sept-Nov)
- [ ] **Cost Management**:
  - Cost amount and frequency (per session, monthly, per season)
  - Split type: equal (50/50), percentage-based, or specific parent pays
  - Track who paid and when
  - History of payments for each activity
- [ ] Activities appear in shared calendar view (future integration)
- [ ] Notifications when new activity added or cost changes
- [ ] Can mark activities as "past" to maintain history

**Dependencies**: Contact management (child contacts), task management (for payment tracking)
**Constraints**:
- Cost splitting can be contentious - need neutral presentation
- Different parents may have different views on which activities are "necessary"
- Privacy: activity details should only be visible to co-parents, not extended family
**Success Metrics**:
- 60% of users with children track at least 2 activities
- 40% of users use cost-splitting features
- Reduces "Who's paying for soccer?" questions by 70%

#### Feature 5.2: Activity Calendar Integration
**User Story**: As a co-parent (David) managing multiple children's activities, I want to see all activities in a calendar view so that I can avoid scheduling conflicts.

**Acceptance Criteria**:
- [ ] Calendar view shows all children's activities with color-coding per child
- [ ] Can toggle activities on/off per child
- [ ] Shows upcoming activities for next 7/30/90 days
- [ ] Integrates with task due dates in unified calendar
- [ ] Export to Google Calendar / Apple Calendar (iCal format)
- [ ] Conflict detection: warns if two activities overlap

**Dependencies**: Activity tracking, calendar integration framework
**Constraints**:
- Calendar complexity increases with multiple children
- Need mobile-friendly calendar view
**Success Metrics**:
- 70% of users with activities use calendar view at least weekly
- 30% of users export to external calendar
- Reduces missed activity conflicts by 50%

### Feature Category 6: Authentication & Security
**Priority**: Critical (MVP Essential)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 5.1: Multi-Method Authentication
**User Story**: As a user (Sarah), I want to sign up quickly with Google OAuth so that I don't have to remember another password.

**Acceptance Criteria**:
- [ ] Users can sign up/login with: Email/Password, Google OAuth
- [ ] Email/password requires: minimum 8 characters, one number, one special character
- [ ] Email verification required before accessing full features (prevent spam accounts)
- [ ] Password reset via email with secure token (expires in 1 hour)
- [ ] Account lockout after 5 failed login attempts (security)
- [ ] Two-factor authentication (2FA) optional via SMS or authenticator app

**Dependencies**: Express.js backend, JWT token management
**Constraints**:
- OAuth requires third-party service availability (Google)
- SMS 2FA has cost (~$0.01 per message)
**Success Metrics**:
- 70% of users choose Google OAuth (faster onboarding)
- <1% account compromise rate
- 15% of users enable 2FA (security-conscious segment)

#### Feature 5.2: Room Invitation System
**User Story**: As a user (Sarah), I want to invite my co-parent to a private room via email so that we can start communicating securely.

**Acceptance Criteria**:
- [ ] Given user account, when user creates room and invites co-parent by email, then co-parent receives email with signup/login link
- [ ] Invitation email clearly explains what LiaiZen is and why they're invited
- [ ] Recipient can accept, decline, or ignore invitation
- [ ] Invitation expires after 30 days if not accepted
- [ ] Sender can cancel invitation before acceptance
- [ ] Once invitation accepted, both users have equal room access (no "owner" privileges)

**Dependencies**: Email service (Nodemailer), user accounts
**Constraints**:
- Email delivery not guaranteed (spam filters, incorrect addresses)
- Invitation acceptance dependent on recipient cooperation (can't force)
**Success Metrics**:
- 90% invitation email delivery success rate
- 70% invitation acceptance rate within 7 days
- <5% invitation spam/abuse rate

#### Feature 5.3: Data Privacy & COPPA/GDPR Compliance
**User Story**: As a parent (Sarah), I want assurance that my children's information is protected and that I control my data so that I can trust the platform with sensitive family information.

**Acceptance Criteria**:
- [ ] Children's names/ages stored but NOT tracked behaviorally (COPPA compliance)
- [ ] Users can request a copy of all their data in JSON format (GDPR Right to Data Portability)
- [ ] Users can delete account and all data (GDPR Right to Erasure) - with co-parent notification
- [ ] Privacy policy clearly states: data use, retention period (7 years default), third-party sharing (none except required by law)
- [ ] All user data encrypted at rest (AES-256) and in transit (TLS 1.3)
- [ ] No data sold to third parties (explicit policy)
- [ ] Optional: Allow users to request human review of AI-processed messages (transparency)

**Dependencies**: Database encryption, data portability tools
**Constraints**:
- 7-year data retention required for legal purposes conflicts with "right to be forgotten" (legal review needed)
- Data deletion when co-parent relationship ends is complex (one user can't delete other's messages)
**Success Metrics**:
- Zero COPPA violations
- Zero GDPR complaints
- Privacy policy comprehension score >70% (user testing)
- SOC 2 Type II certification within 12 months

### Feature Category 7: Email Notifications
**Priority**: Medium (MVP Important but not critical)
**Timeline**: Phase 1 (MVP - Month 0-3)

#### Feature 7.1: Configurable Email Alerts
**User Story**: As a user (Mike) who doesn't check the app constantly, I want email notifications for new messages so that I can respond promptly without constantly monitoring the app.

**Acceptance Criteria**:
- [ ] Users receive email notification for: new messages, task assignments, task completions, room invitations
- [ ] Email preferences configurable: immediate, daily digest, or off (per notification type)
- [ ] Emails include message preview (first 100 characters) and link to platform
- [ ] Unsubscribe link in every email (CAN-SPAM compliance)
- [ ] Emails sent via Gmail with SPF/DKIM authentication (deliverability)

**Dependencies**: Email service (Nodemailer + Gmail), user preferences
**Constraints**:
- Email delivery not guaranteed (spam filters)
- Gmail daily sending limit: 500 emails/day (switch to SendGrid for scaling)
**Success Metrics**:
- 85% email delivery rate
- <2% unsubscribe rate
- 60% of users keep default email settings (indicates good defaults)

---

## 🏗️ System Architecture Principles

### Constitutional Principles (from `.specify/memory/constitution.md`)

**CRITICAL: These principles guide ALL development decisions for LiaiZen**

#### Immutable Principles

1. **Library-First Architecture** (Principle I)
   - **Co-Parenting Application**: All core features (AI mediation, contact management, task management) MUST be implemented as standalone libraries that can be tested independently
   - **Example**: AI mediation engine lives in `libs/ai-mediator/` with its own tests, independent of React frontend
   - **Benefits**: Enables future mobile app (React Native) to reuse same AI mediation logic without code duplication
   - **Exceptions**: None - even WebSocket logic must be library-first (enables future non-web interfaces like SMS, voice assistants)
   - **Rationale**: Standalone libraries allow audit and verification of AI mediation algorithms for transparency and user trust

2. **Test-First Development (TDD)** (Principle II)
   - **Minimum Coverage**: 80% for all code, 95% for AI mediation and security features (legal/safety-critical)
   - **Testing Philosophy**:
     - Unit tests for AI mediation accuracy (tone detection, rewrite quality)
     - Integration tests for WebSocket message delivery (zero message loss requirement)
     - E2E tests for critical user journeys (signup → invite → message → AI mediation)
     - Contract tests for API stability (third-party integrations depend on consistency)
   - **Co-Parenting Specific**: Test AI mediation with real-world hostile messages (curated dataset from family law professionals)
   - **Compliance**: All COPPA/GDPR features require test coverage proving compliance

3. **Contract-First Design** (Principle III)
   - **API Contract Standard**: OpenAPI 3.1 specification for all REST endpoints
   - **WebSocket Contract**: Documented Socket.io event schemas with versioning
   - **AI Mediation Contract**: Input/output schemas for tone analysis and rewriting (enables swapping AI providers)
   - **Data Format Contract**: JSON schemas for data portability and third-party integrations
   - **Versioning**: Semantic versioning (v1, v2) with 12-month deprecation period for breaking changes
   - **Rationale**: Consistent APIs enable future integrations with calendar apps, therapist portals, and other tools

#### Quality & Safety Principles

4. **Idempotent Operations** (Principle IV)
   - **Critical Idempotent Operations**:
     - Message sending (duplicate sends don't create duplicate messages)
     - Task completion (marking complete multiple times doesn't duplicate notifications)
     - Room invitation (re-sending invitation doesn't create multiple invitations)
     - AI mediation requests (same message analyzed multiple times returns consistent results)
   - **Co-Parenting Specific**: Message delivery must be idempotent to handle poor mobile connectivity (construction worker scenario - Mike persona)
   - **Rationale**: Reliability in real-world conditions with spotty connectivity and network interruptions

5. **Progressive Enhancement** (Principle V)
   - **Feature Flag Strategy**:
     - All new features behind feature flags (enable for beta users first)
     - AI mediation suggestions can be disabled per-user (low-conflict users like David may not need)
     - Premium features (document storage, expense tracking) gated by access tier
   - **Rollout Approach**:
     - Beta users (50 co-parenting pairs) → 1 week monitoring → 500 users → 1 month → full launch
     - AI model changes tested with 10% traffic before full rollout
   - **Co-Parenting Specific**: Conflict de-escalation prompts tunable per user (avoid patronizing low-conflict users)
   - **Critical Features**: Core AI mediation must remain stable and consistent for user trust

6. **Git Operation Approval** (Principle VI - NON-NEGOTIABLE)
   - **CRITICAL**: NO automatic git operations without explicit user approval
   - **Branch Strategy**:
     - `main` (production - deployed to coparentliaizen.com)
     - `staging` (pre-production testing)
     - `feature/###-feature-name` (numbered features from /specify command)
   - **Co-Parenting Specific**: All AI mediation algorithm changes require manual review before merge (safety-critical)
   - **Approval Process**: Agent must request permission before ANY git operation (branch creation, commits, pushes)

7. **Observability & Structured Logging** (Principle VII)
   - **Logging Standards**:
     - JSON format for all logs (machine-parseable for security audits)
     - PII redaction (never log message content, only metadata)
     - Structured fields: timestamp, user_id (hashed), event_type, outcome, duration_ms
   - **Monitoring Approach**:
     - Real-time alerts: Message delivery failure rate >1%, WebSocket disconnection rate >5%
     - Daily dashboards: AI mediation acceptance rate, sentiment improvement trends
     - Weekly reports: User growth, task completion rates, feature adoption metrics
   - **Co-Parenting Specific**: Track conflict de-escalation success rate (how often users accept "take a break" suggestion)
   - **Legal Compliance**: Audit logs for all data access (GDPR Article 30 compliance)

8. **Documentation Synchronization** (Principle VIII)
   - **Documentation Strategy**:
     - Every API endpoint documented in OpenAPI spec (auto-generated docs)
     - Every AI mediation algorithm explained in plain language (transparency for users and researchers)
     - User-facing help articles updated with every feature launch
   - **Update Triggers**:
     - Code merge → Update API docs
     - Feature launch → Update user help articles and in-app guidance
     - Legal compliance change → Update privacy policy and user notifications
   - **Co-Parenting Specific**: AI mediation documentation must explain logic clearly (build user trust and understanding)
   - **Living Documents**: PRD, CLAUDE.md, README.md updated within 24 hours of major feature launch

9. **Dependency Management** (Principle IX)
   - **Approved Dependencies**:
     - Frontend: React 18+, Socket.io-client, Tailwind CSS
     - Backend: Node.js 18+, Express, Socket.io, bcrypt, jsonwebtoken, OpenAI SDK
     - Database: SQLite (MVP), PostgreSQL (production)
   - **Version Pinning**: Exact versions in package.json (no caret/tilde) for legal reproducibility
   - **Security Audits**: Monthly `npm audit` checks, critical vulnerabilities patched within 48 hours
   - **Co-Parenting Specific**: OpenAI SDK version pinned to ensure consistent AI behavior (user trust and predictability)
   - **Rationale**: Exact dependency versions ensure consistent user experience and reliable AI mediation

#### Workflow & Delegation Principles

10. **Agent Delegation Protocol** (Principle X - CRITICAL)
    - **Agent Usage Policy**:
      - Frontend work → frontend-specialist agent
      - AI mediation logic → conflict-mediation-specialist agent (custom)
      - Legal compliance → family-law-compliance-specialist agent (custom)
      - Security/privacy → security-specialist + family-data-privacy-specialist agents (custom)
    - **Custom Agents for LiaiZen**:
      1. **co-parenting-ux-specialist**: Family-focused UI/UX, trauma-informed design
      2. **conflict-mediation-specialist**: AI tone analysis, de-escalation logic
      3. **communication-skill-specialist**: Teaching healthy communication patterns through AI, skill progression tracking
      4. **family-data-privacy-specialist**: COPPA/GDPR compliance, children's data protection
      5. **mobile-accessibility-specialist**: Mobile-first design, offline functionality (construction worker use case)
    - **Domain Triggers**: Any work on AI mediation, legal compliance, or children's data MUST delegate to specialized agent

11. **Input Validation & Output Sanitization** (Principle XI - SAFETY-CRITICAL)
    - **Validation Standards**:
      - All user message input limited to 5000 characters (prevent abuse)
      - Email addresses validated before invitation sending (prevent spam)
      - Contact information validated (phone format, email format)
      - Date inputs validated (due dates, event scheduling)
    - **Sanitization Requirements**:
      - Message content sanitized for XSS (no HTML tags allowed except basic formatting)
      - User-generated contact notes sanitized (prevent script injection)
      - File upload names sanitized (prevent directory traversal attacks)
      - AI prompts sanitized (prevent prompt injection attacks on OpenAI API)
    - **Co-Parenting Specific**:
      - Children's names/ages validated but NOT stored with tracking identifiers (COPPA)
      - Emergency contact numbers validated for format (ensure 911 calls work)
    - **Legal Rationale**: Message sanitization prevents one parent from injecting malicious code visible to other parent or attorneys

12. **Design System Compliance** (Principle XII)
    - **Design System**: Custom co-parenting design system (to be created)
      - **Color Palette**:
        - Primary: Calming blues/greens (reduce stress, promote cooperation)
        - Secondary: Warm neutrals (approachable, non-confrontational)
        - Accent: Success green (positive reinforcement for task completion)
        - Alert: Amber (de-escalation warnings), Red (emergencies only)
      - **Typography**:
        - Primary font: Sans-serif, high readability (accessibility for varying education levels)
        - Minimum 16px body text (mobile readability for construction sites - Mike persona)
      - **Spacing**: 8px base unit, generous touch targets (44px minimum for mobile)
    - **UI/UX Principles**:
      - **Trauma-Informed Design**: Avoid triggering colors (no aggressive reds), calm interactions
      - **Child-Centered Language**: All messaging emphasizes children's wellbeing
      - **Neutral Tone**: Platform language never "picks sides" between co-parents
      - **Progress Visualization**: Show communication improvement trends (positive reinforcement)
    - **Accessibility**:
      - WCAG 2.1 AA compliance minimum (ethical accessibility standard)
      - Screen reader support (visual impairments)
      - Voice-to-text for message composition (accessibility + construction worker use case)
      - Keyboard navigation (power users)
    - **Co-Parenting Specific**: Design must NOT feel "therapy-like" or stigmatizing (David persona concern)

13. **Feature Access Control** (Principle XIII)
    - **Access Tiers**:
      - **Free Tier**: Core messaging, AI mediation (unlimited), basic task management, 1 room, message search (last 90 days)
      - **Premium Tier** ($9.99/month): Unlimited rooms, calendar integration, unlimited message search, sentiment analytics dashboard, priority support, family network access (grandparents, stepparents)
      - **Professional Tier** ($19.99/month): Therapist portal access, advanced analytics, communication coaching tools, bulk client management
    - **Feature Gating Approach**:
      - Backend enforcement: PostgreSQL Row-Level Security (RLS) policies on premium features
      - Frontend enforcement: Upgrade prompts with clear value proposition ("Access unlimited message history - Upgrade to Premium")
      - Graceful degradation: Free users can still use core features (never block conflict resolution features behind paywall - ethical requirement)
    - **Co-Parenting Specific**:
      - AI mediation NEVER paywalled (ethical requirement - conflict reduction benefits children)
      - Message search limited to 90 days on free tier (encourages premium for long-term users)
      - Emergency features always free (child safety cannot be paywalled)
    - **Rationale**: Search limitation encourages premium adoption while ensuring recent communication history accessible to all

14. **AI Model Selection Protocol** (Principle XIV)
    - **Default Model**: Claude Sonnet 4.5 (best for coding tasks, agent work)
    - **AI Mediation Model** (User-Facing):
      - GPT-3.5 Turbo for tone analysis (cost-effective at ~$0.01/message, acceptable accuracy)
      - GPT-4 Turbo for message rewriting (higher quality rewrites, ~$0.05/message, use when user requests)
      - Claude Opus for safety-critical escalation (when mediation detects severe abuse, suicide risk)
    - **Model Escalation Triggers** (Development):
      - Use Opus 4.1 for: Security review, legal compliance logic, AI mediation algorithm design
      - Use Sonnet 4.5 for: Standard features, UI components, API endpoints
    - **Co-Parenting Specific**:
      - AI mediation model selection based on message severity (GPT-3.5 for routine, GPT-4 for high-conflict, Claude Opus for crisis)
      - Crisis detection (abuse, suicide, harm to children) escalates to Opus + human review
    - **Cost Management**: GPT-3.5 for 90% of messages keeps per-user AI cost <$1/month, sustainable for free tier

### Additional Co-Parenting Domain Principles (Beyond Constitution)

15. **Child-Centered Outcomes** (Co-Parenting Specific)
    - **Mandate**: Every feature must answer "How does this benefit the children?"
    - **Examples**:
      - Task completion reduces parental stress → children experience less conflict
      - AI mediation reduces hostile communication → children don't witness arguments
      - Improved communication helps parents make better decisions together → children get stable arrangements
    - **Compliance Check**: Feature specs must include "Child Benefit" section

16. **Conflict Reduction First** (Co-Parenting Specific)
    - **Mandate**: When features could reduce OR document conflict, prioritize reduction
    - **Examples**:
      - AI mediation suggestions shown BEFORE sending (prevention over documentation)
      - De-escalation prompts appear proactively (intervention over recording)
      - Task statistics displayed neutrally to avoid "scorekeeping" resentment
    - **Rationale**: Platform exists to improve co-parenting, not just document dysfunction

17. **Privacy by Default** (Co-Parenting Specific - COPPA/GDPR)
    - **Mandate**: Family data protection at every layer, children's data especially protected
    - **Requirements**:
      - No behavioral tracking of children (COPPA compliance)
      - Message content never sold or used for advertising (explicit policy)
      - Data encrypted at rest and in transit (AES-256, TLS 1.3)
      - Data retention: 7 years for legal purposes OR user deletion request (whichever comes first)
      - Third-party access only with both co-parent approval (attorney portal)
    - **Compliance Check**: All features must pass COPPA/GDPR review before launch

---

## 🔧 Technical Constraints

### Technology Stack (High-level Constraints Only)
**Note**: Specific implementation details belong in feature specs, not here.

- **Required Technologies**:
  - **Frontend**: React 18+ (existing codebase), Vite (build tool), Tailwind CSS (styling)
  - **Backend**: Node.js 18+ (existing), Express.js (REST API), Socket.io (WebSocket)
  - **Database**: SQLite (MVP/development), PostgreSQL (production migration required)
  - **AI Services**: OpenAI API (GPT-3.5 Turbo, GPT-4 Turbo), Anthropic Claude (for development agents)
  - **Email**: Nodemailer with Gmail SMTP (existing setup)
  - **Deployment**: Vercel (frontend), Railway (backend)

- **Prohibited Technologies**:
  - No client-side encryption libraries (messages must be AI-readable for mediation)
  - No blockchain/Web3 technologies (unnecessary complexity, legal ambiguity)
  - No ad networks or tracking SDKs (privacy policy prohibits third-party data sharing)
  - No SMS gateways requiring phone number storage (COPPA compliance concern)

- **Platform Requirements**:
  - **MVP**: Web (desktop + mobile responsive)
  - **Phase 2**: Native mobile apps (iOS, Android) using React Native for code reuse
  - **Future**: PWA with offline support for poor connectivity scenarios

### Performance Requirements
- **Response Time**:
  - API endpoints: <200ms p95 (fast enough for real-time feel)
  - WebSocket message delivery: <2 seconds p95 (acceptable for co-parenting coordination)
  - AI tone analysis: <3 seconds p95 (prevent user abandonment during composition)
  - Message search: <2 seconds for 10,000 messages (quick reference lookup)

- **Throughput**:
  - Support 10,000 concurrent WebSocket connections (MVP scale: 5,000 active users × 2 connections average)
  - Handle 100 messages/second peak (estimated from 10,000 users × 50 messages/day average)
  - AI API: 50 requests/second to OpenAI (rate limit consideration)

- **Availability**:
  - 99.5% uptime SLA (allows ~3.6 hours downtime/month)
  - Scheduled maintenance windows: Sunday 2-4am ET (lowest usage time)
  - Graceful degradation: Core messaging works even if AI mediation service is down

- **Scalability**:
  - Year 1: 10,000 MAU (MVP target)
  - Year 2: 50,000 MAU (10x growth buffer in architecture)
  - Year 3: 250,000 MAU (requires infrastructure redesign)
  - Data growth: Estimated 10 GB/year (10,000 users × 1 MB average storage)

### Security & Compliance
- **Authentication**:
  - JWT tokens with 24-hour expiration (balance security + UX)
  - Google OAuth (primary), Email/Password (secondary)
  - Optional 2FA via TOTP authenticator apps (no SMS due to COPPA)
  - Session management: httpOnly cookies for web, secure token storage for mobile

- **Authorization**:
  - Role-Based Access Control (RBAC): User, Co-Parent, Attorney (observer), Admin
  - PostgreSQL Row-Level Security (RLS) for data isolation between rooms
  - API-level authorization checks before database queries

- **Data Privacy**:
  - **COPPA Compliance**: No tracking of children under 13, parental consent mechanisms
  - **GDPR Compliance**: Data portability (export), right to erasure (with legal retention exceptions), data processing agreements
  - **SOC 2 Type II Target**: Within 12 months (required for attorney/enterprise adoption)

- **Encryption**:
  - At rest: AES-256 encryption for database (PostgreSQL native encryption)
  - In transit: TLS 1.3 for all API calls, WSS (WebSocket Secure) for real-time messaging
  - Note: NOT end-to-end encrypted (AI mediation requires server-side message access)

- **Audit Logging**:
  - All data access logged: user_id (hashed), action, resource, timestamp, IP address
  - Message sends/receives logged (metadata only, not content)
  - AI mediation requests logged with outcomes (for improvement and transparency)
  - Login attempts logged (security monitoring)
  - Data retention for audit logs: 7 years (GDPR compliance)

### Integration Requirements
- **External Systems**:
  - **OpenAI API**: GPT-3.5 Turbo (tone analysis), GPT-4 Turbo (message rewriting)
  - **Google OAuth**: User authentication
  - **Gmail SMTP**: Email notifications (migrate to SendGrid for scaling)
  - **Stripe** (Phase 2): Premium tier payment processing
  - **Google Calendar API** (Phase 2): Calendar synchronization
  - **Apple Calendar API** (Phase 2): Calendar synchronization

- **Data Import/Export**:
  - **Import**: CSV contact lists (optional convenience feature), calendar sync from Google/Apple Calendar
  - **Export**: JSON format for data portability (GDPR compliance)
  - **Export Frequency**: On-demand user requests (no scheduled exports)

- **Webhooks/Events**:
  - WebSocket events: message_sent, message_received, task_created, task_completed, user_joined, user_typing
  - Future: Webhook API for therapist portal integrations (Phase 3)

---

## 📊 Data & Analytics

### Core Entities

1. **User**
   - **Purpose**: Represents a parent using the platform (authenticated individual)
   - **Key Attributes**: email, password_hash, display_name, google_id (OAuth), created_at, last_login, access_tier (free/premium/professional), preferences (email notifications, AI settings)
   - **Relationships**: Member of Rooms (many-to-many), Creator of Messages/Tasks/Contacts
   - **Lifecycle**: Created at signup, soft-deleted on account deletion (7-year retention for legal), hard-deleted after retention period
   - **Access Control**: User can view/modify own profile, co-parent can view display_name only

2. **Room**
   - **Purpose**: Private communication space for two co-parents
   - **Key Attributes**: room_id, created_by, created_at, invitation_status (pending/accepted/declined), children_info (names/ages - COPPA-protected)
   - **Relationships**: Has 2 Members (Users), Contains Messages/Tasks/Contacts
   - **Lifecycle**: Created when user invites co-parent, persists indefinitely (legal record), requires both co-parent approval to delete
   - **Access Control**: Only two member co-parents can access, optional observer role (attorney) with both approvals

3. **Message**
   - **Purpose**: Communication between co-parents
   - **Key Attributes**: message_id, room_id, sender_id, content (encrypted at rest), timestamp, sentiment_score (-1 to +1), ai_mediated (boolean), read_status, edited_at
   - **Relationships**: Belongs to Room, Sent by User, May have AI_Mediation_Event
   - **Lifecycle**: Created when sent, never deleted (legal record), can be edited (with edit timestamp shown)
   - **Access Control**: Both room members can view, only sender can edit (within 5 minutes of sending)

4. **Task**
   - **Purpose**: Shared parenting responsibility tracking
   - **Key Attributes**: task_id, room_id, title, description, assigned_to_user_id, created_by, due_date, status (pending/completed), completed_at, recurrence_pattern (null/weekly/monthly)
   - **Relationships**: Belongs to Room, Assigned to User, Created by User
   - **Lifecycle**: Created anytime, completed when marked done, can be recurring (auto-creates new instance)
   - **Access Control**: Both room members can create/view/complete tasks

5. **Contact**
   - **Purpose**: Shared directory of people related to co-parenting (teachers, doctors, family)
   - **Key Attributes**: contact_id, room_id, name, role (teacher/doctor/family/emergency), phone, email, notes, added_by, added_at, last_modified_by
   - **Relationships**: Belongs to Room, Created/Modified by Users
   - **Lifecycle**: Created anytime, can be edited/deleted by either co-parent, backed up automatically
   - **Access Control**: Both room members can add/edit/delete contacts

6. **AI_Mediation_Event**
   - **Purpose**: Record of AI intervention on a message (for analysis and improvement)
   - **Key Attributes**: event_id, message_id, original_content (for analysis only), suggested_rewrite_1, suggested_rewrite_2, sentiment_before, sentiment_after, user_selected_option (1/2/none), intervention_type (blocked/suggested/allowed), communication_tip
   - **Relationships**: Linked to Message
   - **Lifecycle**: Created when AI analyzes message, retained for product improvement (anonymized after 90 days)
   - **Access Control**: Users can view their own mediation history in settings, aggregated stats shown in premium dashboard

### Analytics & Reporting

- **Key Reports**:
  - **User Dashboard**: Message count, task completion rate, sentiment trend (last 30 days), AI intervention frequency
  - **Premium Dashboard**: Detailed sentiment analysis, communication patterns, AI mediation learning curve, blocked message trends
  - **Therapist Dashboard** (Professional tier): Client communication progress, sentiment scores, response time metrics, communication skill development
  - **Admin Dashboard**: Platform health (MAU, message volume, AI API costs), user growth, feature adoption

- **Dashboard Requirements**:
  - **Real-time Metrics**: Active WebSocket connections, message delivery rate, AI API response time
  - **Daily Metrics**: New signups, invitation acceptance rate, task completion rate, AI interventions
  - **Weekly Metrics**: User retention cohorts, sentiment improvement trends, premium conversion rate
  - **Monthly Metrics**: Revenue (premium tier), churn rate, customer support tickets

- **Data Portability**:
  - **JSON**: Complete data export for GDPR compliance (messages, contacts, tasks, AI mediation history)
  - **CSV**: Contact lists, task lists (for spreadsheet analysis)
  - **API** (future): Therapist portal integrations, calendar sync, third-party tools

---

## 🚀 Release Strategy

### MVP (Minimum Viable Product)
**Target Date**: Month 3 (90 days from kickoff)
**Core Features** (Ruthlessly Scoped):
- Real-time WebSocket messaging with room-based privacy
- AI-powered message blocking and rewriting (GPT-3.5 Turbo) - blocks inappropriate messages, provides 1 tip + 2 rewrites
- Smart task onboarding (AI pre-populates welcome tasks, profile setup, contact uploads)
- Shared contact directory for co-parenting network
- Basic task management with assignments and due dates
- User authentication (JWT + Google OAuth)
- Room invitation system via email
- Message history search (last 90 days for free tier)
- Email notifications for messages and tasks
- Mobile-responsive web UI (Tailwind CSS)

**Success Criteria** (MVP Validation):
- 500 beta users onboarded (250 co-parenting pairs)
- 70% invitation acceptance rate (co-parents willing to join)
- AI blocks 40%+ of attempted hostile messages in first week (protection working)
- Users show 50% reduction in blocked messages by Month 2 (learning happening)
- 30% reduction in negative sentiment messages after 1 month (conflict reduction working)
- 80% of users send first message within 24 hours of joining (quick activation)
- <2 second message delivery latency for 95% of messages (performance acceptable)
- <3 second AI mediation response time for 95% of blocked messages
- Zero critical security incidents (COPPA/GDPR compliance proven)
- Net Promoter Score (NPS) >40 (users willing to recommend)

### Phase 2: Enhanced Features & Mobile Apps
**Target Date**: Month 6 (3 months after MVP)
**Features**:
- **Mobile Apps**: iOS and Android native apps (React Native) with push notifications
- **Calendar Integration**: Google Calendar and Apple Calendar 2-way sync
- **Advanced Task Management**: Recurring tasks, task templates, completion analytics
- **Premium Tier Launch**: Subscription payment via Stripe, unlimited message search, sentiment dashboard, family network access
- **Improved AI Mediation**: GPT-4 Turbo option for complex situations, adaptive learning improvements
- **Communication Progress Dashboard**: Visualizations showing skill improvement and reduced interventions over time
- **Voice-to-Text**: Message composition via voice (accessibility + construction worker use case)
- **Offline Mode**: Message queueing for areas with poor connectivity
- **3-hour response nudge**: Gentle prompts when co-parent hasn't responded

**Success Criteria** (Growth Validation):
- 10,000 Monthly Active Users (20x growth from MVP)
- 70% 3-month user retention (sticky product)
- 10% premium conversion rate (sustainable business model)
- Mobile app downloads: 5,000+ (iOS + Android combined)
- Calendar integration used by 40% of users (organizational value validated)

### Phase 3: Professional Features & Social Platform Evolution
**Target Date**: Month 12 (12 months from kickoff)
**Features**:
- **Therapist Portal**: Professional tier with bulk client management, advanced analytics, communication coaching insights
- **Document Storage**: Secure file uploads (medical records, school reports, shared documents)
- **Expense Tracking**: Shared expense ledger with receipt scanning and fair split calculations
- **Advanced Analytics**: Behavioral insights, conflict pattern recognition, communication skill progression
- **Therapist/Counselor Tools**: Professional oversight, progress tracking, intervention recommendations
- **Multi-Language Support**: Spanish, French (international expansion preparation)
- **Expanded Family Network**: Controlled access for grandparents, stepparents, extended family, adult children
- **Social Platform Features**: As children age, evolve from co-parenting tool to respectful family coordination platform

**Success Criteria** (Scale & Sustainability):
- 50,000 Monthly Active Users (5x growth from Phase 2)
- 50 attorney partnerships (legal validation and referral network)
- 15% premium conversion rate (improved value proposition)
- Professional tier: 100+ attorney subscriptions at $19.99/month
- SOC 2 Type II certification achieved (enterprise readiness)
- First court case where LiaiZen evidence is successfully admitted (legal validation)

---

## 🎨 Design Principles & UX Guidelines

### Design Philosophy
**Calm, Child-Centered, Trauma-Informed Design**

LiaiZen's design philosophy prioritizes reducing stress and promoting cooperation. The platform should feel like a "safe space" for difficult conversations, not a battleground. Design choices actively counteract the high emotions often present in co-parenting communication.

**Core Design Tenets**:
1. **Calming & Non-Confrontational**: Soft colors, generous whitespace, no aggressive visual elements
2. **Child-Centered Messaging**: Every UI element reminds parents why they're here (for their children's wellbeing)
3. **Neutral & Non-Judgmental**: Platform never "picks sides" or appears to favor one parent over another
4. **Encouraging & Positive**: Celebrate progress (sentiment improvement, task completion) with positive reinforcement
5. **Professional but Approachable**: Not "therapy-like" (stigmatizing) but not cold/corporate either
6. **Accessible to All**: Works for parents with varying tech skills, education levels, and abilities

### Accessibility Requirements
- **WCAG Compliance**: Level AA (ethical accessibility and broad usability standard)
- **Keyboard Navigation**: Fully supported for all features (power users, accessibility needs)
- **Screen Reader Support**: All interactive elements have ARIA labels, semantic HTML structure
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA standard)
- **Touch Targets**: Minimum 44x44px for all interactive elements (mobile accessibility)
- **Voice Input**: Support voice-to-text for message composition (accessibility + convenience)
- **Readable Fonts**: Sans-serif, minimum 16px body text, clear hierarchy

### Responsive Design
- **Supported Devices**:
  - **Desktop**: 1920x1080 and above (primary for attorneys, power users)
  - **Tablet**: iPad and Android tablets (occasional use)
  - **Mobile**: iPhone, Android phones (primary for most users - Sarah and Mike personas)

- **Breakpoints**:
  - Mobile: 320px - 767px (single column layout)
  - Tablet: 768px - 1023px (two column where appropriate)
  - Desktop: 1024px and above (multi-column dashboard)

- **Progressive Enhancement**:
  - Core messaging works on ALL devices (no feature degradation for critical functions)
  - Premium dashboards optimized for desktop (data visualization)
  - Mobile-first design approach (majority of users check platform on phone)

- **Mobile-Specific Considerations**:
  - Large touch targets (44px minimum) for construction site use (Mike persona)
  - Offline message queueing for poor connectivity areas
  - Voice-to-text for easier composition on mobile
  - Bottom navigation for thumb-reach ergonomics

---

## 🔄 Workflow Integration

### SDD Framework Integration
This PRD serves as the **Single Source of Truth (SSOT)** for:

1. **Specification Agent** (`/specify` command)
   - **References this PRD for**: User personas, feature descriptions, acceptance criteria
   - **User stories source**: Section "Core Features & Requirements" (Features 1.1 - 6.1)
   - **Requirements source**: Section "System Architecture Principles" (17 constitutional principles customized for co-parenting)
   - **Success metrics**: Section "Success Metrics" (Executive Summary + per-feature metrics)

2. **Planning Agent** (`/plan` command)
   - **Technical constraints from**: Section "Technical Constraints" (required/prohibited technologies, performance requirements)
   - **Architecture principles from**: Section "System Architecture Principles" (14 constitutional + 3 co-parenting specific)
   - **Integration requirements from**: Section "Technical Constraints > Integration Requirements" (OpenAI API, Google OAuth, email)
   - **Data model**: Section "Data & Analytics > Core Entities" (7 core entities)

3. **Custom Agents** (from Principle X)
   - **co-parenting-ux-specialist**: Family-focused UI/UX, trauma-informed design, child-centered language
   - **conflict-mediation-specialist**: AI tone analysis algorithms, de-escalation logic, sentiment scoring
   - **communication-skill-specialist**: Teaching communication patterns through AI, skill progression tracking, behavioral insights
   - **family-data-privacy-specialist**: COPPA/GDPR compliance, children's data protection, audit logging
   - **mobile-accessibility-specialist**: Mobile-first design, offline functionality, voice-to-text, accessibility

4. **Constitutional Customization**
   - **Action Required**: Update `.specify/memory/constitution.md` with 17 principles from this PRD's "System Architecture Principles" section
   - **Co-Parenting Domain Principles** (15-17) to be ADDED to constitution as project-specific amendments
   - **AI Model Selection** (Principle 14) to be customized for user-facing AI (GPT-3.5/GPT-4/Opus escalation)
   - **Review Timeline**: Within 48 hours of PRD approval

---

## ❓ Open Questions & Risks

### Open Questions

1. **How do we handle custody emergencies detected by AI?**
   - **Impact**: If AI detects abuse, suicide risk, or harm to children, what's our legal/ethical obligation?
   - **Owner**: Product Team + Legal Counsel
   - **Deadline**: Before MVP launch (liability exposure)
   - **Current Thinking**: Escalate to Claude Opus + human review, provide crisis resources, possibly contact authorities (requires legal guidance)

2. **What's our stance on legal requests for message content?**
   - **Impact**: Will we comply with valid legal requests (subpoenas, court orders)? How does this affect user trust?
   - **Owner**: Legal Counsel
   - **Deadline**: Before MVP launch (privacy policy must be clear)
   - **Current Thinking**: Comply with valid legal requirements but notify users when legally permissible (standard practice), clearly communicate data policies upfront

3. **Should we allow message deletion for abusive content?**
   - **Impact**: Conflicts with communication history but safety concern if one parent is abusive
   - **Owner**: Product Team + Safety Specialist
   - **Deadline**: Month 2 (before beta launch)
   - **Current Thinking**: Messages can be flagged/reported but not deleted by users (preserve history and context, but add human moderation layer for safety)

4. **How do we prevent platform abuse for harassment?**
   - **Impact**: Platform could be weaponized by abusive parent to harass other parent
   - **Owner**: Product Team + Safety Specialist
   - **Deadline**: Before MVP launch (safety-critical)
   - **Current Thinking**: Rate limiting, AI detection of harassment patterns, ability to temporarily "mute" notifications, escalation to human review

5. **What happens when children turn 18 and are no longer minors?**
   - **Impact**: COPPA protections no longer apply, but legal record may still be needed
   - **Owner**: Legal Counsel
   - **Deadline**: Month 6 (not urgent for MVP but needs policy)
   - **Current Thinking**: Data retained but children's info transitions to "adult child" status (no longer COPPA-protected)

### Risks & Mitigation

1. **Risk**: AI mediation suggests inappropriate rewrites (softens legitimate safety concerns)
   - **Likelihood**: Medium (AI limitations well-known)
   - **Impact**: High (could endanger children if abuse warnings are downplayed)
   - **Mitigation**:
     - Human review of AI suggestions before launch (curated test dataset)
     - User always sees original + rewrite side-by-side (never automatic rewriting)
     - Escalate severe language to human moderators (abuse, threats, suicide)
     - Continuous monitoring of AI suggestion acceptance rate and user feedback
   - **Owner**: conflict-mediation-specialist agent + Product Team

2. **Risk**: Co-parents refuse to join platform (low invitation acceptance rate)
   - **Likelihood**: High (adoption requires BOTH parents, not just one)
   - **Impact**: High (blocks MVP success criteria)
   - **Mitigation**:
     - Attorney/therapist partnerships (professionals recommend to keep communication productive)
     - Sample invitation templates that explain benefits to reluctant co-parent
     - "Single-user mode" allows one parent to use platform alone (tasks, contacts) until other joins
     - Clear value proposition: Learn better communication skills, reduce conflict, save money on mediation
   - **Owner**: Product Team + Marketing

3. **Risk**: Users have unrealistic expectations about AI mediation
   - **Likelihood**: Medium (users may expect AI to "fix" their co-parent's behavior)
   - **Impact**: Medium (user frustration, churn)
   - **Mitigation**:
     - Clear messaging: LiaiZen teaches YOU to communicate better, doesn't control the other person
     - Focus on skill development and personal growth, not changing the co-parent
     - Show progress metrics: "You've improved X% in constructive communication"
     - Set realistic expectations during onboarding
   - **Owner**: Product Team + UX Specialist

4. **Risk**: OpenAI API costs spiral out of control with user growth
   - **Likelihood**: Medium (AI cost per user could exceed revenue on free tier)
   - **Impact**: High (unsustainable unit economics)
   - **Mitigation**:
     - Use GPT-3.5 Turbo (not GPT-4) for 90% of requests (~$0.01 vs $0.05 per message)
     - Rate limit AI analysis (e.g., 50 mediation requests per user per month on free tier)
     - Cache common AI responses (e.g., "Thanks" always gets same suggestion)
     - Premium tier subsidizes free tier (unlimited AI mediation as premium feature)
   - **Owner**: Product Team + Finance

5. **Risk**: COPPA violation due to accidental children's data collection
   - **Likelihood**: Low (if proper safeguards)
   - **Impact**: Critical (up to $46,000 per violation, FTC enforcement)
   - **Mitigation**:
     - No tracking identifiers for children (names/ages stored but not behaviorally tracked)
     - Regular COPPA audits (quarterly compliance reviews)
     - family-data-privacy-specialist agent reviews all features touching children's data
     - Legal counsel review before any feature launch involving minors
     - Clear documentation of COPPA compliance measures
   - **Owner**: family-data-privacy-specialist + Legal Counsel

### Assumptions

- **Separated parents are willing to pay for co-parenting tools** (10% premium conversion assumption)
- **AI mediation is acceptable to users** (not seen as intrusive once they experience the benefits)
- **Family law attorneys and therapists will recommend platform to clients** (professional partnerships viable)
- **WebSocket infrastructure can scale to 10,000 concurrent connections** (Railway hosting assumption)
- **OpenAI API will remain available and stable** (third-party dependency risk)
- **Users will see measurable improvement in communication skills** (core value proposition)
- **Users have smartphones with modern browsers** (mobile-first assumption)
- **Both co-parents speak same language** (multi-language support is Phase 3, not MVP)

---

## 📚 Appendices

### Appendix A: Glossary
- **Co-Parent**: A parent who shares parenting responsibilities with a separated or divorced partner
- **Room**: Private communication space for two co-parents on LiaiZen platform
- **AI Mediation**: Real-time message analysis that blocks hostile messages and provides constructive rewrites
- **Message Blocking**: AI prevents inappropriate messages from being sent, requiring user to select a rewrite
- **Communication Tip**: Brief, actionable guidance shown when AI blocks a message (max 10 words)
- **Sentiment Score**: -1 (negative/hostile) to +1 (positive/supportive) measurement of message tone
- **Smart Tasks**: AI-generated onboarding tasks to help users set up their profile and context
- **Access Tier**: User's subscription level (Free, Premium, Professional)
- **COPPA**: Children's Online Privacy Protection Act (U.S. law protecting children under 13)
- **GDPR**: General Data Protection Regulation (EU privacy law)
- **SOC 2 Type II**: Security audit certification for service organizations
- **RLS**: Row-Level Security (PostgreSQL feature for data isolation)

### Appendix B: References
- **Existing Project Documentation**: `/Users/athenasees/Desktop/chat/README.md`, `/Users/athenasees/Desktop/chat/CLAUDE.md`
- **SDD Framework Constitution**: `/Users/athenasees/Desktop/chat/.specify/memory/constitution.md`
- **COPPA Compliance Guide**: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- **GDPR Official Text**: https://gdpr-info.eu/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Family Law Research**: To be added (competitive analysis of OurFamilyWizard, TalkingParents, AppClose)

### Appendix C: Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-24 | prd-specialist agent | Initial PRD creation with comprehensive co-parenting requirements |

---

## ✅ PRD Review Checklist

Before finalizing this PRD, ensure:

**Completeness**:
- [x] Executive summary clearly states vision, problem, and success metrics
- [x] All user personas documented with goals and pain points (4 personas: Sarah, Mike, Jessica, David)
- [x] Core features have acceptance criteria and success metrics (6 feature categories, 15 features total)
- [x] All 14 constitutional principles addressed with project-specific guidance PLUS 3 co-parenting principles
- [x] Technical constraints documented (required/prohibited technologies, performance, security, integrations)
- [x] Release strategy with MVP clearly defined (3 phases with success criteria)
- [x] Open questions identified with owners and deadlines (5 critical questions)

**Clarity**:
- [x] No ambiguous requirements (all testable and measurable)
- [x] Success metrics are quantifiable (30% sentiment reduction, 60% AI acceptance, 10,000 MAU, etc.)
- [x] Personas are specific and realistic (based on real co-parenting scenarios)
- [x] Feature priorities clearly marked (High/MVP, Medium, Low)
- [x] No implementation details (WHAT/WHY only, not HOW)

**Alignment**:
- [x] Goals align with vision and problem statement (conflict reduction, child-centered outcomes)
- [x] Features support defined user journeys (Sarah, Mike, David journeys map to features)
- [x] Success metrics measure stated goals (sentiment, AI acceptance, retention, NPS)
- [x] Constitutional principles don't conflict with requirements (17 principles all applicable)
- [x] Release phases are achievable given constraints (MVP in 3 months, Phase 2 in 6 months, Phase 3 in 12 months)

**Actionability**:
- [x] Specification agent can extract clear user stories (15 features with user stories + acceptance criteria)
- [x] Planning agent has sufficient constraints and principles (tech stack, performance, 17 principles)
- [x] Each feature can be broken into tasks (acceptance criteria provide task breakdown)
- [x] Dependencies are identified (per-feature dependencies documented)
- [x] Risks have mitigation plans (5 risks with owners and mitigation strategies)

**Stakeholder Review**:
- [ ] Product owner approved (PENDING - requires human review)
- [ ] Key stakeholders reviewed (PENDING - requires team review)
- [ ] Technical feasibility validated (PENDING - requires engineering review)
- [ ] Legal/compliance reviewed (PENDING - COPPA/GDPR requires legal counsel)
- [ ] Budget/resources confirmed (PENDING - requires finance/ops approval)

---

**Next Steps After PRD Approval**:
1. **Update Constitution** (`.specify/memory/constitution.md`) with 17 principles from this PRD (Principles 15-17 are NEW)
2. **Create Custom Agents**:
   - `/claude/agents/co-parenting-ux-specialist.md`
   - `/claude/agents/conflict-mediation-specialist.md`
   - `/claude/agents/family-law-compliance-specialist.md`
   - `/claude/agents/family-data-privacy-specialist.md`
   - `/claude/agents/mobile-accessibility-specialist.md`
3. **Run `/specify`** for each MVP feature (15 features total):
   - Feature 1.1: WebSocket-Based Messaging
   - Feature 1.2: Room-Based Privacy Model
   - Feature 1.3: Message History & Export
   - (continue for all 15 features)
4. **Set up Design System** (Principle XII): Create `design-system/` with co-parenting color palette, typography, components
5. **Configure CI/CD** for quality gates (Principles II, III, VIII): Test coverage >80%, contract validation, doc sync checks
6. **Legal Review**: COPPA/GDPR compliance audit, privacy policy draft, terms of service
7. **Attorney Partnerships**: Identify 3-5 family law firms for beta partnership and validation

---

*This PRD is a living document. Update it as the product evolves, maintaining version history for all changes.*

---

