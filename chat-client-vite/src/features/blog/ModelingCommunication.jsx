import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function ModelingCommunication() {
  const meta = {
    title: (
      <>
        How to Model Healthy Communication <span className="text-teal-600">for Your Kids</span>
      </>
    ),
    subtitle:
      "Your children are watching. Here's how to show them what healthy boundaries look like.",
    date: 'Dec 24, 2025',
    readTime: '7 min read',
  };

  const breadcrumbs = [
    { label: 'Resources', href: '/child-centered-co-parenting' },
    { label: 'Modeling Communication' },
  ];

  const keyTakeaways = [
    'Children learn more from watching you <strong>handle conflict</strong> than from any conversation about it.',
    'You can model healthy communication <strong>even in a high-conflict relationship</strong>.',
    "Every time you choose <strong>response over reaction</strong>, you're teaching your children a skill they'll use forever.",
  ];

  return (
    <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
      <h2>The Invisible Curriculum</h2>
      <p>
        Your children are absorbing lessons from you constantly—not through the things you tell
        them, but through what you show them. The way you handle difficult conversations, manage
        frustration, and navigate conflict is writing a textbook in their minds about how
        relationships work.
      </p>
      <p>
        This is both sobering and empowering. Sobering because it means every text you write, every
        sigh you breathe, every reaction you have is being cataloged. Empowering because it means
        you have an opportunity—right now, in every interaction—to teach them something better than
        what the conflict itself might suggest.
      </p>
      <p>
        You may not be able to give them cooperative co-parents. But you can give them a model of
        how to handle difficult relationships with grace.
      </p>

      <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
        <p className="font-medium text-gray-900 m-0 italic">
          "Children have never been very good at listening to their elders, but they have never
          failed to imitate them."
        </p>
        <p className="text-sm text-gray-500 mt-2 mb-0">— James Baldwin</p>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>What Children Learn From Watching</h2>
      <p>Without a single word of instruction, children learn from observation:</p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">How to Handle Anger</p>
            <p className="text-gray-600 text-sm">
              When you feel angry at your co-parent, do you explode? Withdraw? Or find a way to
              express yourself that respects both your needs and your boundaries?
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">What Boundaries Look Like</p>
            <p className="text-gray-600 text-sm">
              Can you set limits calmly? Do you stick to them? Do you apologize for having needs?
              Your boundary-setting becomes their template.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">How to Disagree</p>
            <p className="text-gray-600 text-sm">
              Does disagreement equal conflict? Or can two people disagree while remaining
              respectful? The pattern you model becomes their default.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">What's Worth Fighting About</p>
            <p className="text-gray-600 text-sm">
              Do small things become big battles? Or do you pick your battles strategically? They're
              learning when to engage and when to let go.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">How to Recover</p>
            <p className="text-gray-600 text-sm">
              After difficult interactions, can you return to baseline? Can you move on without
              holding grudges? This resilience is learned by watching.
            </p>
          </div>
        </div>
      </div>

      <h2>The Challenge: Modeling Well in a Difficult Situation</h2>
      <p>
        Here's the hard part: you're trying to model healthy communication while in a relationship
        that may be anything but healthy. Your co-parent may not be cooperating. The situation may
        be genuinely unfair.
      </p>
      <p>
        This creates an unusual teaching opportunity. Your children will face difficult
        relationships in their lives—impossible bosses, frustrating family members, challenging
        friendships. What you model isn't how to have a perfect relationship. It's how to maintain
        your own integrity when the other person isn't cooperating.
      </p>
      <p>That's actually a more valuable lesson.</p>

      <hr className="my-12 border-gray-100" />

      <h2>Five Things You Can Model Today</h2>

      <h3>1. Pausing Before Reacting</h3>
      <p>
        When something triggers you—a text, a comment, a situation—your children learn from how you
        handle that moment. If they see you take a breath, put down your phone, and respond later,
        they're learning that{' '}
        <a
          href="/co-parenting-communication/reaction-vs-response"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          reaction isn't mandatory
        </a>
        .
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">What This Looks Like</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-red-600 mb-2">What they see if you react:</p>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-gray-900 text-sm">
                Your body tenses. You mutter under your breath. You start typing immediately. The
                rest of the evening, you're distracted and tense.
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-teal-600 mb-2">What they see if you pause:</p>
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
              <p className="text-gray-900 text-sm">
                You glance at your phone, put it away, and continue what you were doing. Later, they
                see you respond calmly. The evening continues normally.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p>
        The{' '}
        <a
          href="/co-parenting-communication/pause-before-reacting"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          pause
        </a>{' '}
        teaches them: you don't have to react instantly. You can choose your response.
      </p>

      <h3>2. Boundaries Without Drama</h3>
      <p>
        Setting boundaries doesn't require anger, justification, or long explanations. It can be
        simple and calm. When your children see you maintain limits without escalating, they learn
        that boundaries are normal, not aggressive.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Boundary Modeling</h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-red-600 mb-2">
              Dramatic boundary-setting (teaches conflict):
            </p>
            <p className="text-gray-900 bg-red-50 p-3 rounded border border-red-100">
              "I can't believe your father is asking this AGAIN. He knows I have plans. He always
              does this. Fine, tell him I said no and he needs to respect my time."
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-teal-600 mb-2">
              Calm boundary-setting (teaches healthy limits):
            </p>
            <p className="text-gray-900 bg-teal-50 p-3 rounded border border-teal-100">
              (To co-parent, privately): "That time doesn't work for me. Here's what I can do
              instead."
            </p>
          </div>
        </div>
      </div>

      <h3>3. Speaking Neutrally About Their Other Parent</h3>
      <p>
        Whatever you feel about your co-parent, your children need to form their own relationship
        with both of you. When you speak neutrally—or even positively—about their other parent,
        you're teaching them that people can disagree and still respect each other.
      </p>
      <p>
        This doesn't mean pretending everything is fine. It means keeping adult conflict adult-sized
        and letting children have their own experiences.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">The Neutral Approach</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-red-500 font-bold">✗</span>
            <span>"Your dad always does this. He doesn't care about anyone but himself."</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-500 font-bold">✓</span>
            <span>"There's been a change in plans. You'll see Dad tomorrow instead."</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-500 font-bold">✗</span>
            <span>"I can't believe Mom signed you up for that. Did she even ask me?"</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-teal-500 font-bold">✓</span>
            <span>"I heard you're doing soccer! That sounds fun."</span>
          </div>
        </div>
      </div>

      <h3>4. Emotional Recovery</h3>
      <p>
        Children need to see that difficult emotions can be felt, processed, and moved through. If
        they only see you stuck in resentment or constantly triggered, they learn that emotional
        wounds are permanent.
      </p>
      <p>
        When you model recovery—handling a difficult interaction and then returning to your
        baseline, enjoying your evening, being present—you teach them that setbacks don't have to
        derail you.
      </p>

      <h3>5. Taking Responsibility</h3>
      <p>
        When you make mistakes—because you will—acknowledging them models something powerful.
        Children who see their parents own their mistakes learn that imperfection is normal and
        fixable.
      </p>
      <p>
        "I was more short-tempered than I wanted to be earlier. That wasn't about you—I was dealing
        with something stressful. I'm sorry."
      </p>
      <p>
        This teaches them: adults make mistakes, apologize, and move on. That's how it's supposed to
        work.
      </p>

      <hr className="my-12 border-gray-100" />

      <h2>What Your Children Don't Need to See</h2>
      <p>Modeling healthy communication includes knowing what to keep private:</p>

      <div className="bg-red-50 border border-red-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-red-800 mb-4">Keep These Private</h4>
        <ul className="text-gray-700 space-y-2">
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>The content of your conflicts with
            their other parent
          </li>
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>Financial disputes and child
            support discussions
          </li>
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>Legal matters and court
            proceedings
          </li>
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>Your emotional processing of the
            co-parent relationship
          </li>
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>Text exchanges or emails with your
            co-parent
          </li>
          <li>
            <span className="text-red-500 font-bold mr-2">✗</span>Your complaints about the other
            parent's behavior
          </li>
        </ul>
      </div>

      <p>
        These aren't your children's burdens to carry. Process them with friends, therapists,
        support groups—anyone but your children.
      </p>

      <h2>The Long-Term Impact</h2>
      <p>The communication skills you model now will echo through your children's lives:</p>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-6 my-8">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">In Their Future Relationships</p>
              <p className="text-gray-600 text-sm">
                They'll have a template for how to disagree respectfully, set boundaries, and
                navigate conflict without destruction.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">In Their Workplaces</p>
              <p className="text-gray-600 text-sm">
                Professional relationships require exactly these skills: handling difficult people,
                maintaining composure, communicating clearly under stress.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">In Their Own Parenting</p>
              <p className="text-gray-600 text-sm">
                How you handle this will influence how they handle their own difficult family
                situations someday.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">In Their Self-Image</p>
              <p className="text-gray-600 text-sm">
                Watching a parent handle difficulty with grace teaches them that they, too, can
                handle difficult things.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>How LiaiZen Supports Better Modeling</h2>
      <p>
        The hardest part of modeling healthy communication is doing it in real-time, when you're
        activated, when your nervous system is screaming at you to react.{' '}
        <a
          href="/liaizen/how-ai-mediation-works"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          LiaiZen
        </a>{' '}
        helps by:
      </p>
      <ul>
        <li>
          <strong>Creating automatic pauses</strong> – The{' '}
          <a
            href="/liaizen/escalation-prevention"
            className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
          >
            intervention
          </a>{' '}
          gives you time to choose response over reaction
        </li>
        <li>
          <strong>Offering calm alternatives</strong> – When you're activated, you see what a
          regulated response looks like
        </li>
        <li>
          <strong>Reducing overall conflict</strong> – Less conflict means fewer difficult modeling
          moments
        </li>
        <li>
          <strong>
            Supporting your{' '}
            <a
              href="/co-parenting-communication/emotional-regulation"
              className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
            >
              regulation
            </a>
          </strong>{' '}
          – When you're calmer, you model calmness
        </li>
      </ul>
      <p>
        Think of it as training wheels for the communication patterns you want to model. Over time,
        those patterns become natural—and your children absorb them without knowing they're being
        taught.
      </p>

      <hr className="my-12 border-gray-100" />

      <h2>You're Teaching Right Now</h2>
      <p>
        In every moment of co-parenting communication—every text you write, every reaction you have,
        every handoff you navigate—your children are learning something. You get to decide what.
      </p>
      <p>
        You can't control your co-parent. You can't create a perfect situation. But you can be the
        person who shows your children that difficult relationships can be handled with dignity,
        that boundaries can be set without warfare, that disagreement doesn't have to mean
        destruction.
      </p>
      <p>
        That's not a consolation prize. That's the real gift—one that will outlast this co-parenting
        relationship and shape who your children become.
      </p>
      <p>You're already teaching. The only question is what the lesson will be.</p>

      {/* FAQ Section */}
      <div className="mt-16 pt-12 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-1 h-8 bg-teal-500 rounded-full"></div>
          <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              My co-parent models terrible communication. Won't that cancel out what I model?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Children learn from contrast as well as example. Seeing two different approaches gives
              them perspective and choice. Research shows that having one parent who models healthy
              communication is protective, even when the other doesn't. You can't control what they
              learn elsewhere, but your modeling still matters.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              What if I've already modeled badly? Have I damaged them?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Children are resilient, and patterns can change. If you've modeled unhealthy
              communication in the past, starting to model healthier patterns now still helps. You
              can even acknowledge the change: "I'm working on handling things more calmly." That
              itself models growth and self-improvement.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Should I explicitly teach my children about healthy communication?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Age-appropriate conversations can help, but modeling matters more than instruction.
              Children rarely learn communication skills from lectures—they learn from watching.
              That said, naming what you're doing ("I'm going to take a breath before I respond")
              can help them connect your behavior to something they can practice themselves.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              How do I handle it when my kids tell me about bad behavior they witnessed at the other
              home?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Listen without amplifying. Validate their feelings ("That sounds like it was
              stressful") without badmouthing the other parent ("Your dad is so terrible"). Help
              them process the experience without making it bigger. If there are safety concerns,
              address those appropriately—but most of the time, kids need empathy, not alignment
              against their other parent.
            </p>
          </div>
        </div>
      </div>
    </BlogArticleLayout>
  );
}
