import React from 'react';
import { Link } from 'react-router-dom';
import { BlogArticleLayout } from './BlogArticleLayout';
import whyArgumentsRepeatImage from '../../assets/blog/why_arguments_repeat_vector.png';
import gameTheoryMatrix from '../../assets/blog/game_theory_matrix.png';

export function WhyArgumentsRepeat() {
    const meta = {
        title: <>The Co-Parent's Dilemma: <span className="text-teal-600">Why Negotiation Feels Like War (And How to Find Peace)</span></>,
        subtitle: "Discover why simple conversations turn into emotional tug-of-wars, the psychological traps keeping you stuck, and five powerful reframes to find your way back to win-win.",
        date: "Dec 10, 2025",
        readTime: "8 min read",
        heroImage: whyArgumentsRepeatImage,
        heroImageAlt: "Understanding the co-parent's dilemma"
    };

    const breadcrumbs = [
        { label: "Resources", href: "/co-parenting-communication" },
        { label: "Co-Parenting Communication" }
    ];

    const keyTakeaways = [
        "<strong>The Sunset/Sunrise Problem:</strong> You and your co-parent can witness the same event and derive completely opposite—yet logical—truths.",
        "<strong>Loss Aversion:</strong> Your brain processes compromise as a \"loss,\" making collaboration feel like surrender even when it's the best path.",
        "<strong>The Override:</strong> Five specific mental reframes can help you stay in win-win mode when your biology screams \"protect yourself.\""
    ];

    return (
        <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
            <p className="text-lg text-gray-700 leading-relaxed">
                Have you ever started a conversation with your co-parent expecting a simple, logical negotiation, only to find yourself locked in an emotional tug-of-war ten minutes later?
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
                It is a frustratingly common dynamic. You walk away thinking, <em>"How can they be so unreasonable?"</em> Meanwhile, they are likely thinking the exact same thing about you.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed">
                For the longest time, I wondered why this happens even when both parents love their children. The answer, it turns out, isn't that one person is "bad" or "wrong." The answer lies in how our brains process reality.
            </p>

            <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
                <p className="font-medium text-gray-900 m-0 italic">
                    We are stuck in a psychological trap, but the good news is that once you see the trap, you can step out of it.
                </p>
            </div>

            <hr className="my-12 border-gray-100" />

            <h2>The Hidden Truth: The "Sunset/Sunrise" Problem</h2>
            <p>
                The first discovery we need to make is about perspective. In psychology, there is a concept called <strong>Naive Realism</strong>. It is the natural human tendency to believe that we see the world objectively—exactly as it is. Therefore, we assume that if the other person disagrees with us, they must be uninformed, irrational, or biased.
            </p>

            <p>
                Think of it as the "Sunset/Sunrise" problem.
            </p>

            <p>
                Imagine a late drop-off or a missed school flyer. Two people witness this exact same event but derive two opposing, yet seemingly logical, truths:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-8">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">Parent A sees:</p>
                    <p className="text-gray-600 italic">"A simple, human mistake."</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">Parent B sees:</p>
                    <p className="text-gray-600 italic">"A blatant lack of respect."</p>
                </div>
            </div>

            <p>
                When you add a history of broken trust to this mix, your brain adds a filter called <strong>Negativity Bias</strong>. Evolution has hard-wired the human brain to prioritize "threat" over "reward" to ensure survival. This is why your amygdala reacts intensely to a perceived slight in a text message, while completely overlooking a cooperative gesture.
            </p>

            <p>
                This combination of different perspectives and biological defensiveness lands you squarely in what I call <strong>The Co-parent's Dilemma</strong>.
            </p>

            <hr className="my-12 border-gray-100" />

            <h2>The Biological Hurdle: Why "Winning" Feels Safer</h2>
            <p>
                In this dilemma, you generally have two choices:
            </p>

            <ol className="list-decimal list-inside space-y-2 my-6 text-gray-700">
                <li><strong>Collaborate:</strong> Give a little to get a little, reaching a happy medium.</li>
                <li><strong>Turn against each other:</strong> Fight for what is "rightfully yours."</li>
            </ol>

            <p>
                Logically, we know collaboration is better. But if you choose the second path, someone has to take the loss. And in co-parenting, those losses usually become heavy burdens that the children have to carry.
            </p>

            {/* Game Theory Matrix */}
            <div className="my-10">
                <img
                    src={gameTheoryMatrix}
                    alt="Co-Parenting Game Theory Matrix showing the outcomes of cooperation vs domination"
                    className="w-full rounded-xl shadow-lg"
                />
                <p className="text-center text-sm text-gray-500 mt-3 italic">The Co-Parent's Dilemma: Why collaboration is logical but feels impossible</p>
            </div>

            <p>
                So, why is it so hard to just collaborate?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-amber-800 mb-1">The "Aha!" Moment</p>
                        <p className="text-amber-900">The desire to protect your children often gets overridden by your own need for survival. Your brain processes a compromise as a "loss," and loss is biologically processed as a threat.</p>
                    </div>
                </div>
            </div>

            <p>
                This is <strong>Loss Aversion</strong>. It's a cornerstone of behavioral economics suggesting that the pain of losing something is psychologically about <em>twice as powerful</em> as the pleasure of gaining the same thing. Giving up an hour of parenting time feels twice as bad as gaining an hour feels good.
            </p>

            <hr className="my-12 border-gray-100" />

            <h2>The Solution: 5 Ways to Override Your Instincts</h2>
            <p>
                Ultimately, a win/win scenario is the best outcome for your family. However, because of your wiring, <em>it won't feel like the best outcome</em> in the heat of the moment.
            </p>

            <p>
                Staying in a win-win mindset when your biology is screaming "protect yourself" is hard work. It requires a mental override—a way to trick your brain out of the short-term fight and into the long-term build.
            </p>

            <p>
                Here are five specific reframes to help you rediscover your power and anchor yourself in the bigger picture.
            </p>

            {/* Reframe 1 */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <h3 className="text-xl font-bold text-teal-800 m-0">Shift from the Finite to the Infinite Game</h3>
                </div>
                <p className="text-gray-700 mb-4">
                    Most arguments feel high-stakes because we treat them like a "Finite Game"—a match with a winner, a loser, and a final buzzer. If you lose the argument about the holiday schedule, it feels like "game over."
                </p>
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-2">The Reframe:</p>
                    <p className="text-gray-700 mb-3">Realize you are playing an <strong>Infinite Game</strong>. The goal isn't to win the Tuesday text exchange; the goal is to keep the game (your child's development) going for 20 years.</p>
                    <p className="font-semibold text-teal-700 mb-2">The Check:</p>
                    <p className="text-gray-600 italic">"Does winning this battle help me win the war for my child's mental health?"</p>
                </div>
            </div>

            {/* Reframe 2 */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <h3 className="text-xl font-bold text-teal-800 m-0">The "Future-Retro" Perspective</h3>
                </div>
                <p className="text-gray-700 mb-4">
                    It is easy to get tunnel vision on the resources right in front of you—the $50 for the cleats or the 2 hours on Sunday. But there are invisible resources that are arguably more valuable: your child's trust and your own peace.
                </p>
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-2">The Check:</p>
                    <p className="text-gray-700">Project yourself 15 years into the future. Imagine your child is graduating. Will this specific disagreement matter? If the answer is no, it is a depreciable asset. Don't spend your expensive emotional energy on it. Save your capital for the things that <em>will</em> be remembered.</p>
                </div>
            </div>

            {/* Reframe 3 */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <h3 className="text-xl font-bold text-teal-800 m-0">Audit Your "Emotional Accounting"</h3>
                </div>
                <p className="text-gray-700 mb-4">
                    We tend to keep a mental ledger of debts: <em>"I was flexible last week, so they owe me this week."</em> When the other person doesn't pay up, we feel cheated.
                </p>
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-2">The Reframe:</p>
                    <p className="text-gray-700">Stop viewing flexibility as a loan. View it as an <strong>investment in the ecosystem</strong>. You aren't doing it for <em>them</em>; you are doing it to lower the toxicity levels in the water your child swims in. When you view kindness as a gift to your child rather than a favor to your ex, you stop waiting for a "thank you" that might never come.</p>
                </div>
            </div>

            {/* Reframe 4 */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                    <h3 className="text-xl font-bold text-teal-800 m-0">The Somatic "Circuit Breaker"</h3>
                </div>
                <p className="text-gray-700 mb-4">
                    Your body usually knows you are leaving the "win-win" zone before your brain does. A tight chest, shallow breathing, or a clenched jaw are the first signs that your amygdala is hijacking the bus.
                </p>
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-2">The Check:</p>
                    <p className="text-gray-700">Before you hit send on a reply, do a quick body scan. If you are physically tense, you are likely in "survival mode." In that state, you are biologically incapable of seeing the win-win. <strong>Step away. The most productive thing you can do in that moment is nothing.</strong></p>
                </div>
            </div>

            {/* Reframe 5 */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-bold shrink-0">5</div>
                    <h3 className="text-xl font-bold text-teal-800 m-0">Separate the Intent from the Impact</h3>
                </div>
                <p className="text-gray-700 mb-4">
                    Naive Realism makes us assume that if their action hurt us, their <em>intention</em> was to hurt us. This is often false. They might be disorganized, stressed, or oblivious—not malicious.
                </p>
                <div className="bg-white rounded-lg p-4 border border-teal-100">
                    <p className="font-semibold text-teal-700 mb-2">The Reframe:</p>
                    <p className="text-gray-700 mb-3">Try on the "Benevolent Translator" hat. Ask yourself, <em>"Is there a generous explanation for this?"</em></p>
                    <div className="space-y-2 text-sm">
                        <p><strong>Impact:</strong> They didn't call back.</p>
                        <p><strong>Fear Story:</strong> They are ignoring me to be controlling.</p>
                        <p><strong>Generous Story:</strong> They are overwhelmed at work and forgot.</p>
                    </div>
                    <p className="text-gray-600 mt-3 italic">Even if the generous story isn't 100% true, believing it keeps <em>you</em> calm, which keeps <em>you</em> in the driver's seat.</p>
                </div>
            </div>

            <hr className="my-12 border-gray-100" />

            {/* Final Discovery */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">The Final Discovery: Peace is a Practice, Not a Destination</h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Knowledge is the antidote to the chaos. When you understand that your co-parent isn't necessarily a villain, but a human struggling with the same Naive Realism and Loss Aversion that you are, the game changes. You stop reacting to the "sunset" and start building a new horizon.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
                It won't be easy, and you won't get it right every time. But every time you choose to pause, reframe, and override your biology, you are doing more than just avoiding an argument—you are actively constructing a foundation of peace for your children to stand on. And that is a victory worth every bit of the effort.
            </p>

            <hr className="my-12 border-gray-100" />

            {/* CTA to Quiz */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 my-8 text-white">
                <h3 className="text-2xl font-bold mb-3">Ready to Put This Into Practice?</h3>
                <p className="text-teal-100 mb-6">
                    The first step in changing a pattern is understanding where you currently stand. Take our quick assessment to discover your natural co-parenting stance and get personalized insights.
                </p>
                <Link
                    to="/quizzes/co-parenting-stance"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                >
                    Take the Co-Parenting Stance Assessment
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 pt-12 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-1 h-8 bg-teal-500 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h3>
                </div>

                <div className="grid gap-6">
                    <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">What is Naive Realism?</h4>
                        <p className="text-gray-600 leading-relaxed">Naive Realism is the psychological tendency to believe we see the world objectively and as it truly is. This leads us to assume that people who disagree with us must be uninformed, irrational, or biased—when in reality, they're processing the same events through their own equally valid lens.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Why does compromise feel like losing?</h4>
                        <p className="text-gray-600 leading-relaxed">This is due to Loss Aversion—a principle from behavioral economics showing that the pain of losing something feels about twice as intense as the pleasure of gaining the same thing. Your brain literally processes "giving up" parenting time as a threat, even when the trade-off benefits everyone.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">What's the difference between a Finite and Infinite Game?</h4>
                        <p className="text-gray-600 leading-relaxed">A Finite Game has clear rules, winners, losers, and an endpoint (like a tennis match). An Infinite Game has no final winner—the goal is to keep playing (like raising a child). When you treat co-parenting arguments as finite games to "win," you sacrifice the infinite game of your child's long-term wellbeing.</p>
                    </div>
                </div>
            </div>
        </BlogArticleLayout>
    );
}
