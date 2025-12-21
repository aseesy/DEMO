import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function MentalHealthProtection() {
  const meta = {
    title: (
      <>
        How to Protect Your Mental Health <span className="text-teal-600">While Co-Parenting</span>
      </>
    ),
    subtitle:
      'Essential self-care strategies for parents in high-stress co-parenting relationships.',
    date: 'Dec 19, 2025',
    readTime: '8 min read',
  };

  const breadcrumbs = [
    { label: 'Resources', href: '/high-conflict-co-parenting' },
    { label: 'Mental Health Protection' },
  ];

  const keyTakeaways = [
    "Your mental health isn't a luxury—it's the <strong>foundation</strong> of your ability to parent well.",
    "Protection isn't selfish; it's <strong>necessary</strong> for you and your children.",
    'Small, consistent practices are more sustainable than <strong>dramatic interventions</strong>.',
  ];

  return (
    <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
      <h2>You Can't Pour From an Empty Cup</h2>
      <p>
        It's a cliché because it's true. When co-parenting drains you—when every message feels like
        a battle, when anxiety spikes at the sound of a notification, when you lie awake replaying
        conversations—your capacity to be present for your children diminishes.
      </p>
      <p>
        This isn't about being strong or weak.{' '}
        <a
          href="/high-conflict-co-parenting/why-it-feels-impossible"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          High-conflict co-parenting
        </a>{' '}
        is genuinely traumatic. The constant vigilance, the emotional volatility, the feeling of
        being attacked in your most vulnerable role—these take a measurable toll on your nervous
        system.
      </p>
      <p>
        Protecting your mental health isn't self-indulgence. It's survival. And it's the single most
        important thing you can do for your children.
      </p>

      <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
        <p className="font-medium text-gray-900 m-0 italic">
          "Your children don't need a perfect parent. They need a parent who isn't depleted. That
          starts with protecting yourself."
        </p>
      </div>

      <hr className="my-12 border-gray-100" />

      <h2>The Hidden Cost of Chronic Conflict</h2>
      <p>
        High-conflict co-parenting doesn't just stress you out in the moment. It creates a state of
        chronic activation that affects:
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Physical Health</h4>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>Disrupted sleep patterns</li>
              <li>Elevated cortisol levels</li>
              <li>Weakened immune function</li>
              <li>Tension headaches and muscle pain</li>
              <li>Digestive issues</li>
              <li>Cardiovascular strain</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-3">Mental & Emotional Health</h4>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>Anxiety and hypervigilance</li>
              <li>Depression and hopelessness</li>
              <li>Difficulty concentrating</li>
              <li>Emotional exhaustion</li>
              <li>Reduced patience and presence</li>
              <li>Identity erosion</li>
            </ul>
          </div>
        </div>
      </div>

      <p>
        These aren't signs of weakness—they're natural responses to an unnatural situation. Your
        body and mind are doing exactly what they're designed to do under sustained threat. The
        problem is that the "threat" isn't going away, so the stress response never fully turns off.
      </p>

      <h2>The Foundation: Recognizing Your Limits</h2>
      <p>
        Before strategies, there's recognition. Many parents in high-conflict situations push
        through exhaustion, telling themselves they have to be strong for their kids. But strength
        without limits isn't sustainable—it's a slow collapse.
      </p>
      <p>Signs you're approaching your limits:</p>
      <ul>
        <li>Dreading co-parent interactions more than usual</li>
        <li>Snapping at your children over small things</li>
        <li>Difficulty being present even when you're with them</li>
        <li>Feeling numb or detached</li>
        <li>Physical symptoms (fatigue, headaches, stomach issues)</li>
        <li>Ruminating on conflicts for hours or days</li>
        <li>Using substances or behaviors to cope (alcohol, scrolling, overworking)</li>
      </ul>
      <p>If you recognize these signs, you're not failing—you're human. And you need support.</p>

      <hr className="my-12 border-gray-100" />

      <h2>The Protection Framework</h2>
      <p>
        Mental health protection in high-conflict co-parenting works on three levels: boundaries,
        practices, and support.
      </p>

      <h3>Level 1: Boundaries</h3>
      <p>
        Boundaries aren't about controlling your co-parent—they're about controlling your exposure
        to stress.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Communication Boundaries</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Time Limits</p>
              <p className="text-gray-600 text-sm">
                Don't read or respond to co-parent messages outside set hours. Protect your
                mornings, evenings, and time with your children.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Channel Limits</p>
              <p className="text-gray-600 text-sm">
                Keep communication to one channel (text, email, or co-parenting app). Don't respond
                to multiple channels simultaneously.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Topic Limits</p>
              <p className="text-gray-600 text-sm">
                Stick to logistics only. Don't engage with emotional content, rehashing of the past,
                or character attacks.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Response Limits</p>
              <p className="text-gray-600 text-sm">
                Not every message needs a response.{' '}
                <a
                  href="/high-conflict-co-parenting/de-escalation-techniques"
                  className="text-teal-600 hover:text-teal-700 underline decoration-teal-200 underline-offset-2"
                >
                  Pure emotional content
                </a>{' '}
                with no logistical question can be left unanswered.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h3>Level 2: Daily Practices</h3>
      <p>
        Protection isn't a one-time intervention—it's a daily practice. Small, consistent actions
        compound over time.
      </p>

      <h4>Morning Anchoring</h4>
      <p>
        Before engaging with any co-parent communication, take 10 minutes for yourself. This could
        be:
      </p>
      <ul>
        <li>Meditation or deep breathing</li>
        <li>Physical movement (stretching, a short walk)</li>
        <li>Journaling or gratitude practice</li>
        <li>Simply sitting with coffee before the day begins</li>
      </ul>
      <p>The goal is to enter the day from a grounded state, not a reactive one.</p>

      <h4>The Buffer Zone</h4>
      <p>Create transition rituals between co-parent interactions and the rest of your life:</p>
      <ul>
        <li>
          <strong>After reading messages</strong> – Take three deep breaths before deciding how to
          respond
        </li>
        <li>
          <strong>After exchanges</strong> – Brief physical movement to discharge stress
        </li>
        <li>
          <strong>Before seeing your children</strong> – A mental reset so you're present with them,
          not carrying conflict
        </li>
      </ul>

      <h4>Evening Release</h4>
      <p>Whatever happened during the day, find a way to release it before sleep:</p>
      <ul>
        <li>Write down what's bothering you (then close the notebook)</li>
        <li>Talk to a supportive person</li>
        <li>Physical activity to metabolize stress hormones</li>
        <li>A firm "end time" for thinking about co-parenting issues</li>
      </ul>

      <hr className="my-12 border-gray-100" />

      <h3>Level 3: Support Systems</h3>
      <p>
        You cannot do this alone. High-conflict co-parenting requires external support—not because
        you're weak, but because humans aren't designed to handle sustained adversarial
        relationships in isolation.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Building Your Support Network</h4>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">Professional Support</p>
            <p className="text-gray-600 text-sm">
              A therapist experienced in high-conflict divorce or co-parenting can provide tools,
              perspective, and a safe space to process. This isn't about fixing you—it's about
              having expert support for an objectively difficult situation.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">Personal Support</p>
            <p className="text-gray-600 text-sm">
              Friends and family who listen without judgment, provide reality checks when you need
              them, and remind you of who you are outside this conflict. Choose people who support
              you without inflaming the situation.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">Community Support</p>
            <p className="text-gray-600 text-sm">
              Support groups (online or in-person) for parents in similar situations. There's power
              in knowing you're not alone and learning from others who've navigated similar
              dynamics.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="font-medium text-gray-900 mb-2">Professional Boundaries</p>
            <p className="text-gray-600 text-sm">
              Family lawyers, mediators, or parenting coordinators when needed. Sometimes
              professional intervention creates boundaries that you can't establish alone.
            </p>
          </div>
        </div>
      </div>

      <h2>The Things That Actually Help</h2>
      <p>
        Beyond frameworks, here are specific interventions that parents in high-conflict situations
        find most helpful:
      </p>

      <h3>Physical Regulation</h3>
      <p>Your body holds stress. Moving it releases that stress in ways that thinking cannot:</p>
      <ul className="marker:text-teal-500">
        <li>
          <strong>Exercise</strong> – Any form that you'll actually do consistently
        </li>
        <li>
          <strong>Cold exposure</strong> – Cold showers or face washing reset the nervous system
        </li>
        <li>
          <strong>Breathwork</strong> – Extended exhales activate the parasympathetic system
        </li>
        <li>
          <strong>Sleep</strong> – Protect it fiercely; nothing else works without it
        </li>
      </ul>

      <h3>Mental Boundaries</h3>
      <p>
        Your co-parent doesn't just live in messages—they can live in your head. Techniques for
        mental boundaries:
      </p>
      <ul className="marker:text-teal-500">
        <li>
          <strong>Scheduled worry time</strong> – Give yourself 15 minutes to think about
          co-parenting issues, then stop
        </li>
        <li>
          <strong>Containment visualization</strong> – Imagine putting the conflict in a box,
          closing it, and setting it aside
        </li>
        <li>
          <strong>Reality anchoring</strong> – When ruminating, list five things you can see, four
          you can hear, three you can touch
        </li>
        <li>
          <strong>Identity preservation</strong> – Regular engagement with parts of yourself that
          have nothing to do with being a co-parent
        </li>
      </ul>

      <h3>Emotional Processing</h3>
      <p>The feelings need somewhere to go. Suppression doesn't work; healthy expression does:</p>
      <ul className="marker:text-teal-500">
        <li>
          <strong>Journaling</strong> – Write the angry letter you'll never send
        </li>
        <li>
          <strong>Therapy</strong> – A professional space to process without burden on friends
        </li>
        <li>
          <strong>Creative outlets</strong> – Art, music, writing—anything that transforms emotion
          into something else
        </li>
        <li>
          <strong>Physical release</strong> – Sometimes you just need to punch a pillow or scream in
          the car
        </li>
      </ul>

      <hr className="my-12 border-gray-100" />

      <h2>What Your Children Need From You</h2>
      <p>
        Protecting your mental health isn't separate from being a good parent—it's essential to it.
        What your children actually need:
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-8">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">A regulated parent</p>
              <p className="text-gray-600 text-sm">
                Children feel their parent's emotional state. Your calm is their calm.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">A present parent</p>
              <p className="text-gray-600 text-sm">
                Being physically there while mentally replaying conflict isn't presence. They need
                your full attention.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">A stable home</p>
              <p className="text-gray-600 text-sm">
                When one environment is chaotic, the other being stable matters even more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Protection from conflict</p>
              <p className="text-gray-600 text-sm">
                They shouldn't see your stress, hear the arguments, or feel caught in the middle.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Permission to love both parents</p>
              <p className="text-gray-600 text-sm">
                Your ability to manage your emotions allows them to have a relationship with both of
                you without guilt.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p>
        You can only provide these things if you're taking care of yourself. Self-care isn't
        selfish—it's the foundation of being the parent your children need.
      </p>

      <h2>How LiaiZen Supports Your Mental Health</h2>
      <p>
        Co-parenting communication is often the primary source of stress.{' '}
        <a
          href="/liaizen/how-ai-mediation-works"
          className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
        >
          LiaiZen
        </a>{' '}
        was designed to reduce that burden:
      </p>
      <ul>
        <li>
          <strong>Creates distance</strong> – The AI buffer gives you space to process before
          responding
        </li>
        <li>
          <strong>Reduces reactive cycles</strong> –{' '}
          <a
            href="/liaizen/escalation-prevention"
            className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
          >
            Catching escalation
          </a>{' '}
          before it happens means fewer draining conflicts
        </li>
        <li>
          <strong>
            Supports{' '}
            <a
              href="/co-parenting-communication/emotional-regulation"
              className="text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-2 font-medium"
            >
              emotional regulation
            </a>
          </strong>{' '}
          – The pause and reframe suggestions help you stay calm
        </li>
        <li>
          <strong>Provides documentation</strong> – Knowing everything is recorded reduces anxiety
          about disputes
        </li>
        <li>
          <strong>Protects your time</strong> – Efficient, focused communication means less time
          spent in conflict
        </li>
      </ul>
      <p>
        The goal isn't to make co-parenting easy—it's to make it sustainable. Every bit of stress
        you don't carry is energy available for your children and yourself.
      </p>

      <h2>The Long Game</h2>
      <p>
        High-conflict co-parenting is often a marathon, not a sprint. Your children may be young,
        and you may have years of co-parenting ahead. Protecting your mental health isn't about
        surviving the next crisis—it's about maintaining yourself over the long haul.
      </p>
      <p>What sustainable protection looks like:</p>
      <ul>
        <li>Gradually strengthening boundaries as you learn what works</li>
        <li>Building support systems that can be there for years</li>
        <li>Developing practices that become automatic</li>
        <li>Recognizing your progress, even when things are hard</li>
        <li>Accepting that some days will be better than others</li>
      </ul>
      <p>
        You're not failing if this is hard. It <em>is</em> hard. The goal isn't perfection—it's
        persistence. Staying present, staying regulated, staying you.
      </p>
      <p>
        Your children will remember not that you had a perfect co-parenting relationship, but that
        you were there for them. That you were calm in the chaos. That you protected them—by
        protecting yourself.
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
              I feel guilty taking time for myself when I should be with my kids. Is that normal?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Completely normal—and worth examining. Time for yourself isn't time away from your
              kids in any meaningful sense. A depleted parent provides less than a rested one. The
              quality of time with your children matters more than the quantity. Taking care of
              yourself makes that quality time possible.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              I can't afford therapy. What are my options?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Many communities have sliding-scale therapy, support groups, or community mental
              health services. Online therapy platforms often cost less than traditional therapy.
              Books on high-conflict co-parenting, online communities, and self-guided resources can
              also help. Start where you can—any support is better than none.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              My co-parent criticizes me for "not being available" when I set communication
              boundaries. What do I do?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Their criticism of your boundaries doesn't make them invalid. You can acknowledge
              their frustration without changing your boundary: "I understand you'd prefer immediate
              responses. I'm available for non-emergency communication between [hours]." Their
              discomfort with your boundaries is theirs to manage.
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              When should I consider medication for anxiety or depression?
            </h4>
            <p className="text-gray-600 leading-relaxed">
              If anxiety or depression is significantly impacting your daily functioning, ability to
              parent, work, or maintain relationships, it's worth discussing with a doctor or
              psychiatrist. Medication isn't a failure—it's a tool. Many parents find that
              medication provides enough relief to engage with therapy and other practices more
              effectively.
            </p>
          </div>
        </div>
      </div>
    </BlogArticleLayout>
  );
}
