import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function WhatKidsNeed() {
  const meta = {
    title: (
      <>
        What Children Need Most{' '}
        <span className="text-teal-600">During High-Conflict Co-Parenting</span>
      </>
    ),
    subtitle: "It's not perfect parents—it's stability. Here's how to provide it.",
    date: 'Dec 22, 2025',
    readTime: '7 min read',
  };

  const breadcrumbs = [
    { label: 'Resources', href: '/child-centered-co-parenting' },
    { label: 'What Kids Need' },
  ];

  const keyTakeaways = [
    "Children don't need their parents to get along. They need to be <strong>kept out of adult conflict</strong>.",
    "Stability isn't about perfection—it's about <strong>predictability and presence</strong>.",
    "Your child's relationship with their other parent is <strong>not about you</strong>.",
  ];

  return (
    <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
      <h2>What Children Actually Need (Not What We Assume)</h2>
      <p>
        When parents ask what their children need during a difficult co-parenting situation, they
        often expect the answer to involve the other parent—that the kids need mom and dad to get
        along, to become friends, to create seamless holidays together.
      </p>
      <p>
        That's not what the research shows. Children can thrive with parents who can't stand each
        other—if certain conditions are met. And those conditions are entirely within each parent's
        individual control.
      </p>
      <p>
        This is actually good news. You don't need your co-parent's cooperation to give your
        children what they need most. You can do this on your own.
      </p>

      <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
        <p className="font-medium text-gray-900 m-0 italic">
          "Children don't need their parents to be partners. They need to not be soldiers in their
          parents' war."
        </p>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>The Core Needs</h2>
      <p>
        Research on children of divorce and high-conflict families points to consistent themes.
        These are the needs that, when met, predict resilience and healthy development:
      </p>

      <h3>1. Freedom from Loyalty Conflicts</h3>
      <p>
        Children experience loyalty conflicts when they feel that loving one parent betrays the
        other. This happens when parents:
      </p>
      <ul>
        <li>Speak negatively about the other parent in front of children</li>
        <li>Ask children to keep secrets</li>
        <li>Interrogate children about the other household</li>
        <li>Show distress when children express love for the other parent</li>
        <li>Compete for the child's affection</li>
      </ul>
      <p>
        <strong>What children need:</strong> Explicit permission to love both parents freely. "I'm
        glad you had fun with Dad this weekend" costs nothing and means everything.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Phrases That Free Children from Loyalty Conflicts
        </h4>
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-gray-900">"It's good that you love your mom/dad. I want you to."</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-gray-900">
              "Tell me about your weekend" (without interrogation or commentary)
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-gray-900">
              "Whatever happens between me and your mom/dad, we both love you."
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-gray-900">
              "You don't have to choose sides. You're allowed to love both of us."
            </p>
          </div>
        </div>
      </div>

      <h3>2. Protection from Adult Conflict</h3>
      <p>
        Children are not equipped to process adult relationship conflicts. When they're exposed to
        arguments, hostile texts, or even tense exchanges during handoffs, their nervous systems
        register threat.
      </p>
      <p>
        <strong>What children need:</strong> To be completely shielded from the conflict between
        their parents. This means:
      </p>
      <ul>
        <li>Never arguing in front of them (including "quiet" tension they can feel)</li>
        <li>Never letting them see hostile messages</li>
        <li>Neutral or positive handoffs</li>
        <li>Not using them as messengers between households</li>
        <li>Not venting about your co-parent within earshot</li>
      </ul>
      <p>
        Children should experience their parents' conflict the way they experience their parents'
        finances: they know it exists, but the details are handled by adults.
      </p>

      <h3>3. One Stable, Regulated Parent</h3>
      <p>
        Research consistently shows that children's outcomes improve dramatically when they have at
        least one{' '}
        <a
          href="/co-parenting-communication/emotional-regulation"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          emotionally regulated
        </a>{' '}
        parent. This person provides:
      </p>
      <ul>
        <li>A calm presence when the child is distressed</li>
        <li>Predictable emotional responses</li>
        <li>Modeling of healthy stress management</li>
        <li>A stable home base</li>
      </ul>
      <p>
        <strong>What children need:</strong> You don't need to be perfect. You need to be the
        steadier presence—the one who doesn't spiral, who doesn't vent to them, who stays regulated
        even when the other parent doesn't.
      </p>

      <hr className="my-12 border-gray-100" />

      <h3>4. Predictability and Routine</h3>
      <p>
        Chaos is hard for developing brains. When children can't predict what's coming—which parent
        will pick them up, what mood that parent will be in, whether there will be a fight at
        handoff—their stress systems stay activated.
      </p>
      <p>
        <strong>What children need:</strong>
      </p>
      <ul>
        <li>Consistent schedules (even if the other household isn't consistent, yours can be)</li>
        <li>Stable routines at each home</li>
        <li>Advance notice of changes when possible</li>
        <li>Reliability—you do what you say you'll do</li>
      </ul>
      <p>
        Predictability creates safety. When children know what to expect, they can relax and just be
        kids.
      </p>

      <h3>5. Their Childhood Preserved</h3>
      <p>
        Children in high-conflict situations often grow up too fast. They become caretakers of their
        parents' emotions, mediators of adult disputes, or the confidants who carry burdens they
        shouldn't know about.
      </p>
      <p>
        <strong>What children need:</strong> To remain children. This means:
      </p>
      <ul>
        <li>Not being your emotional support</li>
        <li>Not knowing the details of your conflicts</li>
        <li>Not carrying messages between parents</li>
        <li>Not being asked to take sides</li>
        <li>Having age-appropriate concerns, not adult worries</li>
      </ul>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-red-800 mb-4">Roles Children Should Never Have</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg p-4 border border-red-100">
            <p className="font-medium text-gray-900 mb-2">The Messenger</p>
            <p className="text-gray-600 text-sm">
              "Tell your dad he needs to pay me back for the school trip."
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-100">
            <p className="font-medium text-gray-900 mb-2">The Spy</p>
            <p className="text-gray-600 text-sm">
              "What did Mom say about me?" "Who was at Dad's house?"
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-100">
            <p className="font-medium text-gray-900 mb-2">The Confidant</p>
            <p className="text-gray-600 text-sm">
              "Your father is so difficult. You're the only one who understands."
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-100">
            <p className="font-medium text-gray-900 mb-2">The Caretaker</p>
            <p className="text-gray-600 text-sm">
              "Are you okay, Mom?" (worrying about parent's emotional state)
            </p>
          </div>
        </div>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>What Children Don't Need (But Parents Often Think They Do)</h2>

      <h3>They Don't Need Parents Who Are Friends</h3>
      <p>
        Friendly co-parenting is wonderful when possible. But children can thrive with parents who
        communicate minimally, businesslike, even coldly—as long as the children themselves are kept
        out of it.
      </p>
      <p>
        What matters isn't the warmth between parents; it's the absence of active conflict that
        children witness or feel caught between.
      </p>

      <h3>They Don't Need to Understand "What Really Happened"</h3>
      <p>
        It's tempting to want children to know "the truth" about the other parent, especially when
        you feel wronged. But children don't benefit from adult information. They benefit from being
        allowed to form their own relationships with each parent.
      </p>
      <p>
        Your version of events may be completely accurate. It still doesn't help your child to hear
        it.
      </p>

      <h3>They Don't Need Equal Everything</h3>
      <p>
        Fair doesn't always mean equal. Children need quality time with each parent more than
        perfectly balanced schedules. They need homes that feel like home more than identical rules.
      </p>
      <p>
        Focus on what happens during your time with them, not on matching what happens elsewhere.
      </p>

      <h2>The One Thing You Can Do Today</h2>
      <p>
        If you take nothing else from this article, take this: examine your interactions for any
        way—however small—that your children might be feeling the weight of adult conflict.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">A Self-Check</h4>
        <p className="text-gray-600 mb-4">Ask yourself honestly:</p>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-gray-400">○</span>
            <span>
              Have I said anything negative about their other parent in front of them recently?
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gray-400">○</span>
            <span>
              Do I ask questions about the other household that are really about my conflict, not
              their wellbeing?
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gray-400">○</span>
            <span>Could they feel my tension or anxiety around handoffs or communication?</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gray-400">○</span>
            <span>Have I ever used them to pass messages to the other parent?</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-gray-400">○</span>
            <span>Do they know details about the conflict that children shouldn't know?</span>
          </li>
        </ul>
        <p className="text-gray-600 mt-4">
          If you answered yes to any of these, you have an immediate opportunity to protect your
          children better. Not by being perfect—by being more intentional.
        </p>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>How LiaiZen Helps You Focus on Your Children</h2>
      <p>
        <a
          href="/liaizen/how-ai-mediation-works"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          LiaiZen
        </a>{' '}
        is designed to reduce the burden of co-parent conflict so you have more energy for what
        matters: your children.
      </p>
      <ul>
        <li>
          <strong>Less escalation</strong> – Lower-conflict communication means less stress that
          children sense
        </li>
        <li>
          <strong>Faster resolution</strong> – Disputes resolved quickly mean less time in conflict
          mode
        </li>
        <li>
          <strong>Better documentation</strong> – Clear records mean fewer disputes about what was
          agreed
        </li>
        <li>
          <strong>
            <a
              href="/co-parenting-communication/emotional-regulation"
              className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
            >
              Supported regulation
            </a>
          </strong>{' '}
          – You stay calmer, which means your children feel calmer
        </li>
      </ul>
      <p>
        The goal isn't to fix your co-parenting relationship—it's to minimize its intrusion into
        your children's lives and your presence with them.
      </p>

      <h2>They're Watching and Learning</h2>
      <p>
        Here's what your children will remember: not whether their parents were together or apart,
        but how they felt in each home. Not whether mom and dad got along, but whether they felt
        safe, loved, and free to be children.
      </p>
      <p>
        You can't control your co-parent. But you can control the home you create, the stability you
        provide, and the example you set.
      </p>
      <p>That's not everything. But it's enough.</p>

      {/* FAQ Section */}
      <div className="mt-16 pt-12 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1 h-8 bg-teal-500 rounded-full"></div>
          <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              My co-parent doesn't shield the kids from conflict. What can I do?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Focus on your household. One home that's a conflict-free zone is better than none. Be
              the stable, regulated parent your children need. You can also address specific
              behaviors through co-parenting coordination or mediation, but ultimately you can't
              control what happens in the other home—only in yours.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              My child asks questions about why we're not together. What do I say?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Age-appropriate honesty without blame works best: "Mom and Dad work better living in
              different houses, but we both love you." Avoid details, avoid blame, and reassure them
              it's not their fault and they don't have to choose sides.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              My child seems to prefer the other parent. Is that my fault?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Children's preferences fluctuate for many reasons—it doesn't necessarily reflect your
              parenting. Focus on being present and consistent in your time with them. Avoid
              competing for their affection; it puts them in an impossible position. If you're
              concerned about alienation, consult a family therapist.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              How do I handle it when my child repeats negative things about me that they heard at
              the other house?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Stay calm. Don't defend yourself extensively or attack the other parent in response. A
              simple "I hear you, and I understand that's what you heard. What do you think?" can
              open dialogue without fueling conflict. If it's persistent, address it privately with
              your co-parent or through a mediator.
            </p>
          </div>
        </div>
      </div>
    </BlogArticleLayout>
  );
}
