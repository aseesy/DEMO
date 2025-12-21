import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function ReactionVsResponse() {
  const meta = {
    title: (
      <>
        From Reaction to Response:{' '}
        <span className="text-teal-600">The Most Important Co-Parenting Skill</span>
      </>
    ),
    subtitle: 'Learn the pause technique that stops escalation in its tracks.',
    date: 'Dec 13, 2025',
    readTime: '6 min read',
  };

  const breadcrumbs = [
    { label: 'Resources', href: '/co-parenting-communication' },
    { label: 'Reaction vs Response' },
  ];

  const keyTakeaways = [
    'A <strong>reaction</strong> is automatic and driven by your nervous system. A <strong>response</strong> is chosen.',
    'The gap between stimulus and action is <strong>where conflict either escalates or resolves</strong>.',
    "You don't need to change how you feel—just <strong>when you act</strong> on it.",
  ];

  return (
    <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
      <h2>The Difference That Changes Everything</h2>
      <p>
        There's a moment between reading your co-parent's message and hitting send on your reply. In
        that moment, everything is decided: whether the conversation stays calm or spirals, whether
        you feel proud of your words later or wish you could take them back.
      </p>
      <p>
        Most co-parenting conflicts don't escalate because of what was said first. They escalate
        because of what came next—the reaction.
      </p>
      <p>
        Learning to transform reaction into response is the single most important communication
        skill you can develop. It won't change your co-parent. But it will change everything else.
      </p>

      <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
        <p className="font-medium text-gray-900 m-0 italic">
          "Between stimulus and response there is a space. In that space is our power to choose our
          response. In our response lies our growth and our freedom."
        </p>
        <p className="text-sm text-gray-500 mt-2 mb-0">— Viktor Frankl</p>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>Reaction vs. Response: What's the Difference?</h2>
      <p>The words sound similar, but they describe fundamentally different processes:</p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-red-50 rounded-lg p-5 border border-red-100">
            <h4 className="text-lg font-bold text-red-800 mb-3">Reaction</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Automatic, instinctive</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Driven by emotion and nervous system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Happens in milliseconds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Goal: Protect, defend, attack back</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>Often regretted later</span>
              </li>
            </ul>
          </div>
          <div className="bg-teal-50 rounded-lg p-5 border border-teal-100">
            <h4 className="text-lg font-bold text-teal-800 mb-3">Response</h4>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Deliberate, intentional</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Involves prefrontal cortex (thinking brain)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Requires a pause</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Goal: Achieve your actual objective</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>Aligned with your values</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p>A reaction says: "They attacked me, so I attack back."</p>
      <p>A response says: "They sent something difficult. What's my smartest move here?"</p>

      <h2>Why Reactions Feel So Right in the Moment</h2>
      <p>
        Here's the tricky part: reactions feel completely justified when they happen. Your co-parent
        said something hurtful, so of course you defended yourself. They were unfair, so you pointed
        out their unfairness. They made an accusation, so you made one back.
      </p>
      <p>
        This is your brain doing exactly what it evolved to do—protecting you from perceived
        threats. The problem is that{' '}
        <a
          href="/co-parenting-communication/emotional-triggers"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          co-parenting messages trigger threat responses
        </a>{' '}
        even when there's no actual danger.
      </p>
      <p>
        The threat-response system doesn't distinguish between a tiger attack and a
        passive-aggressive text. It just knows: something is wrong, act now.
      </p>

      <hr className="my-12 border-gray-100" />

      <h2>The Anatomy of the Pause</h2>
      <p>
        The pause is simple to describe and difficult to execute: it's the space between receiving a
        message and sending your reply.
      </p>
      <p>In that space, several things happen:</p>
      <ul className="marker:text-teal-500">
        <li>
          <strong>Adrenaline peaks and begins to fade</strong> – The initial surge subsides
        </li>
        <li>
          <strong>Prefrontal cortex comes back online</strong> – You can think strategically again
        </li>
        <li>
          <strong>Perspective expands</strong> – You see more options than fight or flight
        </li>
        <li>
          <strong>Goals become visible</strong> – You remember what you actually want
        </li>
      </ul>
      <p>
        The pause doesn't have to be long. Sometimes 30 seconds is enough. Sometimes you need 30
        minutes. The key is that the pause exists at all.
      </p>

      <h2>The Pause Technique: A Step-by-Step Guide</h2>
      <p>When you receive a triggering message, try this sequence:</p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Notice</p>
              <p className="text-gray-600 text-sm">
                Recognize that you've been triggered. Signs: racing heart, tight chest, urge to type
                immediately, thoughts like "How dare they" or "I need to set them straight."
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Name</p>
              <p className="text-gray-600 text-sm">
                Silently label what's happening: "I'm activated" or "My nervous system just got
                triggered." This creates distance between you and the reaction.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Breathe</p>
              <p className="text-gray-600 text-sm">
                Take three slow breaths. Exhale longer than you inhale. This physically activates
                your parasympathetic nervous system and reduces the stress response.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Wait</p>
              <p className="text-gray-600 text-sm">
                Put the phone down. Close the laptop. Walk away for at least 10 minutes. The goal is
                to let the initial cortisol spike pass before engaging.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              5
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Ask</p>
              <p className="text-gray-600 text-sm">
                Before typing, ask: "What do I actually need from this exchange?" Focus your message
                on that outcome, not on defending or attacking.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>What the Pause Makes Possible</h2>
      <p>
        When you pause before responding, you gain access to choices that don't exist in reaction
        mode:
      </p>
      <ul>
        <li>
          <strong>You can choose not to respond at all</strong> – Some messages don't require a
          reply
        </li>
        <li>
          <strong>You can respond only to the factual content</strong> – Ignore the emotional bait
        </li>
        <li>
          <strong>You can ask a clarifying question</strong> – Instead of assuming the worst
          interpretation
        </li>
        <li>
          <strong>You can acknowledge what's valid</strong> – Even if you disagree with the tone
        </li>
        <li>
          <strong>You can set a boundary calmly</strong> – Without escalating
        </li>
      </ul>
      <p>
        None of these options are available when you're in reaction mode. The pause creates them.
      </p>

      <hr className="my-12 border-gray-100" />

      <h2>Real Examples: Reaction vs. Response</h2>

      <div className="space-y-8 my-8">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-500 mb-2">They sent:</p>
          <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
            <p className="text-gray-900">
              "You ALWAYS do this. You can never just follow the schedule like a normal person."
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Reaction:</p>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-gray-900 text-sm">
                  "Normal? You want to talk about normal? You're the one who changed the schedule 4
                  times last month. Maybe look in the mirror before you start pointing fingers."
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600 mb-2">Response:</p>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                <p className="text-gray-900 text-sm">
                  "I hear that you're frustrated about the schedule. What specifically needs to be
                  adjusted for Saturday?"
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-500 mb-2">They sent:</p>
          <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
            <p className="text-gray-900">
              "The kids said you let them stay up until 11 on a school night. Great parenting."
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Reaction:</p>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-gray-900 text-sm">
                  "Don't lecture me about parenting. At least I actually spend quality time with
                  them instead of parking them in front of screens."
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600 mb-2">Response:</p>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                <p className="text-gray-900 text-sm">
                  "We had a special movie night. I'll make sure they're back on regular schedule
                  going forward."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-500 mb-2">They sent:</p>
          <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
            <p className="text-gray-900">
              "I shouldn't have to remind you about the doctor appointment. This is exactly why I
              can't rely on you for anything."
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-red-600 mb-2">Reaction:</p>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-gray-900 text-sm">
                  "You can't rely on ME? That's hilarious coming from you. Should I pull up the list
                  of things YOU'VE forgotten? Want to compare notes?"
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-teal-600 mb-2">Response:</p>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                <p className="text-gray-900 text-sm">
                  "You're right, I should have had it on my calendar. What time is the appointment?
                  I'll make sure I'm there."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p>
        Notice what the responses have in common: they address the actual issue without taking the
        bait. They don't defend, attack, or escalate. They move the conversation forward.
      </p>

      <hr className="my-12 border-gray-100" />

      <h2>Why This Is So Hard (And Why It's Worth It)</h2>
      <p>
        Let's be honest: choosing response over reaction can feel deeply unfair. Why should you have
        to be the calm one when they're the one being unreasonable? Why should you regulate when
        they won't?
      </p>
      <p>The answer isn't about fairness. It's about effectiveness.</p>
      <p>
        Reactions feel satisfying in the moment but create more problems. Responses feel harder but
        actually solve things. Every time you respond instead of react:
      </p>
      <ul>
        <li>The conflict resolves faster</li>
        <li>You feel better about yourself afterward</li>
        <li>Your children experience less tension</li>
        <li>
          Your{' '}
          <a
            href="/court-safe-co-parenting-messages"
            className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
          >
            communication record looks better
          </a>{' '}
          if it ever matters legally
        </li>
        <li>
          You're modeling{' '}
          <a
            href="/child-centered-co-parenting"
            className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
          >
            healthy communication for your kids
          </a>
        </li>
      </ul>
      <p>You're not doing it for them. You're doing it for you—and for your children.</p>

      <h2>How LiaiZen Helps You Pause</h2>
      <p>
        The hardest part of the pause is remembering to do it. When you're triggered, the last thing
        your brain wants is to slow down. It wants to act.
      </p>
      <p>
        <a
          href="/liaizen/how-ai-mediation-works"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          LiaiZen's AI mediation
        </a>{' '}
        builds the pause into the system:
      </p>
      <ul>
        <li>
          <strong>Automatic intervention</strong> –{' '}
          <a
            href="/liaizen/escalation-prevention"
            className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
          >
            Catches escalation
          </a>{' '}
          before you hit send
        </li>
        <li>
          <strong>Alternative suggestions</strong> – Shows you what a response (not reaction) could
          look like
        </li>
        <li>
          <strong>Pattern recognition</strong> – Helps you notice when you're triggered
        </li>
        <li>
          <strong>Skill building</strong> – Over time, you internalize the pause
        </li>
      </ul>
      <p>
        Think of it as training wheels for{' '}
        <a
          href="/co-parenting-communication/emotional-regulation"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          emotional regulation
        </a>
        . Eventually, you won't need the external support—but while you're building the skill, it's
        there to catch you.
      </p>

      <h2>Start Small</h2>
      <p>You don't have to master this overnight. Start with one practice:</p>
      <p>
        <strong>
          For the next week, wait 10 minutes before responding to any co-parent message that
          triggers you.
        </strong>
      </p>
      <p>
        That's it. Just 10 minutes. Notice what changes—in your messages, in their responses, in how
        you feel.
      </p>
      <p>
        The pause is where your power lives. Every time you use it, you're choosing who you want to
        be in this co-parenting relationship. Not a reactor. A responder.
      </p>

      {/* FAQ Section */}
      <div className="mt-16 pt-12 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1 h-8 bg-teal-500 rounded-full"></div>
          <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              What if they need an immediate answer?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              True emergencies are rare. For most messages, "I'll get back to you in an hour" is an
              acceptable response. If something genuinely can't wait, the{' '}
              <a
                href="/co-parenting-communication/pause-before-reacting"
                className="text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2"
              >
                30-second pause
              </a>{' '}
              is still possible—three deep breaths before typing.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Doesn't responding calmly just let them get away with being rude?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              A calm response isn't the same as acceptance. You can set boundaries firmly without
              escalating. "I'm happy to discuss schedule changes, but I won't respond to insults" is
              a response, not a reaction—and it's more effective than matching their energy.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              What if I've already sent a reaction?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              You can still course-correct. A follow-up message like "I reacted quickly earlier. Let
              me try again: [calmer version]" can de-escalate a conversation that's already started
              going sideways. It's not weakness—it's skill.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              How long until this becomes automatic?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              The pause never becomes fully automatic—that's actually the point. What changes is how
              quickly you can access it. With practice, you'll notice you're triggered earlier and
              pause more naturally. Most people see significant improvement within 4-8 weeks of
              consistent practice.
            </p>
          </div>
        </div>
      </div>
    </BlogArticleLayout>
  );
}
