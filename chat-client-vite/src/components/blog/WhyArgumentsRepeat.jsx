import React from 'react';
import { Link } from 'react-router-dom';
import { BlogArticleLayout } from './BlogArticleLayout';
import whyArgumentsRepeatImage from '../../assets/blog/why_arguments_repeat_vector.png';
import emotionalSecurityImage from '../../assets/blog/emotional_security_theory.png';

export function WhyArgumentsRepeat() {
    const meta = {
        title: <>The Argument Cycle: <span className="text-teal-600">A Strategic and Biological Analysis of Co-Parenting</span></>,
        subtitle: "Stuck in a high-conflict co-parenting loop? Discover the neurobiology of conflict and how Game Theory can help you shift from a \"win-lose\" trap to a child-centered \"win-win.\"",
        date: "Dec 10, 2025",
        readTime: "6 min read",
        heroImage: whyArgumentsRepeatImage,
        heroImageAlt: "Strategic analysis of the co-parenting argument cycle"
    };

    const breadcrumbs = [
        { label: "Resources", href: "/co-parenting-communication" },
        { label: "Co-Parenting Communication" }
    ];

    const keyTakeaways = [
        "Co-parenting conflicts often follow <strong>Game Theory patterns</strong>—understanding them reveals the path to Win-Win.",
        "<strong>Negativity Bias</strong> is biological: your brain is wired to prioritize threats over cooperation.",
        "Children suffer from <strong>Interparental Conflict</strong>, not separation itself—your communication strategy matters."
    ];

    return (
        <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
            <p className="text-lg text-gray-700 leading-relaxed">
                In high-stakes co-parenting, transitions often devolve into negotiations over scarce resources: time, financial capital, and emotional bandwidth. When communication breaks down, it is rarely due to a lack of love for the child, but rather a failure to understand the mathematical and biological traps of the "Argument Cycle."
            </p>

            <hr className="my-12 border-gray-100" />

            <h2>1. The Mathematics of Conflict: Non-Zero-Sum Games</h2>
            <p>
                In classical Game Theory, the Prisoner's Dilemma provides a framework for understanding co-parenting dynamics. Many parents operate under the illusion of a <strong>"Zero-Sum Game,"</strong> where one parent's gain (e.g., an extra holiday) is perceived as the other's absolute loss.
            </p>

            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 my-8">
                <h4 className="font-bold text-gray-900 mb-4">The Four Situations of Co-Parenting Game Theory:</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <span className="text-red-700 font-semibold">Situation 1:</span>
                        <p className="text-sm text-gray-700 mt-1">Parent A "wins" at Parent B's expense</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <span className="text-red-700 font-semibold">Situation 2:</span>
                        <p className="text-sm text-gray-700 mt-1">Parent B "wins" at Parent A's expense</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <span className="text-orange-700 font-semibold">Situation 3:</span>
                        <p className="text-sm text-gray-700 mt-1">Nash Equilibrium of Total Loss—both depleted</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                        <span className="text-teal-700 font-semibold">Situation 4:</span>
                        <p className="text-sm text-gray-700 mt-1">Win-Win—the only sustainable outcome</p>
                    </div>
                </div>
            </div>

            <p>
                According to game theory research, when two parties in a long-term relationship (like co-parents) prioritize individual "wins" (Situations 1 and 2), they inevitably reach <strong>Situation 3: The Nash Equilibrium of Total Loss</strong>. In this state, both parties have depleted their legal funds, emotional resilience, and co-parenting efficacy.
            </p>

            <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
                <p className="font-medium text-gray-900 m-0 italic">
                    "The Win-Win (Situation 4) is the only mathematically sustainable outcome for a 10-to-20-year parenting horizon."
                </p>
            </div>

            <hr className="my-12 border-gray-100" />

            <h2>2. The Biological Imperative: Why We Are Wired to Fight</h2>
            <p>
                It is a common misconception that high-conflict parents are simply "difficult." Neurobiology offers a different explanation: <strong>Negativity Bias</strong>.
            </p>
            <p>
                Evolution has hard-wired the human brain to prioritize "threat" over "reward" to ensure survival. Research in neuroscience suggests that the amygdala reacts more intensely to a perceived slight in a text message than to a cooperative gesture.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 my-8">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-amber-800 mb-1">The Neuroscience Reality</p>
                        <p className="text-amber-900">Pain feels more intense and lasting than pleasure. This is why a single critical text can overshadow weeks of smooth co-parenting.</p>
                    </div>
                </div>
            </div>

            <p>
                Breaking the cycle requires <strong>Cognitive Reframing</strong>—using the prefrontal cortex to override the survival-based "fight or flight" response triggered by a co-parent. This is not about suppressing emotion; it's about creating space between stimulus and response.
            </p>

            <hr className="my-12 border-gray-100" />

            <h2>3. The Sunset/Sunrise Paradox: Naive Realism</h2>
            <p>
                In psychology, <strong>Naive Realism</strong> is the human tendency to believe that we see the world objectively, while those who disagree with us are uninformed or biased.
            </p>
            <p>
                This is the "Sunset/Sunrise" problem: two people can witness the same event (a late drop-off or a missed school flyer) and derive two diametrically opposed, yet internally logical, truths.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-8">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">Parent A sees:</p>
                    <p className="text-gray-600 italic">"They were 15 minutes late again—complete disrespect for my time."</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">Parent B sees:</p>
                    <p className="text-gray-600 italic">"Traffic was terrible and I texted ahead—they're overreacting as usual."</p>
                </div>
            </div>

            <p>
                <strong>The breakthrough:</strong> Recognizing that your co-parent's perspective is a product of their own unique "data set" (upbringing, fears, and experiences) allows you to move from judgment to observation.
            </p>

            <hr className="my-12 border-gray-100" />

            <h2>4. Emotional Security Theory: The Impact on the Stakeholder</h2>
            <p>
                Data from <strong>Emotional Security Theory (EST)</strong> indicates that children do not suffer primarily from the fact of separation, but from <strong>Interparental Conflict (IPC)</strong>.
            </p>
            <p>
                Children are the ultimate "stakeholders" in the co-parenting game. When parents engage in adversarial stances, the child's "security resources" are diverted toward managing parental stress rather than developmental growth.
            </p>

            {/* Emotional Security Theory Infographic */}
            <div className="my-10">
                <img
                    src={emotionalSecurityImage}
                    alt="Emotional Security Theory: The Child's Compass - comparing High Conflict/Adversarial IPC outcomes (threatened security, increased child distress, emotional reactivity, behavioral problems) versus Low Conflict/Cooperative IPC outcomes (secure attachment, stable adjustment, emotional regulation, resilience, positive co-parenting alliance)"
                    className="w-full rounded-xl shadow-lg"
                />
                <p className="text-center text-sm text-gray-500 mt-3 italic">The Child's Compass: How interparental conflict affects child adjustment</p>
            </div>

            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6 my-8">
                <h4 className="font-bold text-teal-800 mb-3">What Research Shows:</h4>
                <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Children's wellbeing correlates more strongly with <em>conflict level</em> than with family structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Reduced interparental conflict leads to better academic and social outcomes</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Children model their future relationship patterns on observed parental dynamics</span>
                    </li>
                </ul>
            </div>

            <hr className="my-12 border-gray-100" />

            <h2>Conclusion: Shifting the Strategy</h2>
            <p>
                Breaking the Argument Cycle is not an act of surrender; it is a <strong>high-level strategic shift</strong>. It requires the willpower to move from a fear-based survival mindset to a logic-based cooperative mindset.
            </p>
            <p>
                By centering decisions on the child's emotional stability, you are not "giving in"—you are investing in the only resource that truly matters.
            </p>

            <div className="bg-white border-l-4 border-teal-500 shadow-sm p-6 my-8 rounded-r-lg">
                <p className="font-medium text-gray-900 m-0 italic">
                    "The win is not defeating your co-parent. The win is raising a secure, thriving child."
                </p>
            </div>

            <hr className="my-12 border-gray-100" />

            {/* CTA to Quiz */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 my-8 text-white">
                <h3 className="text-2xl font-bold mb-3">Empower Your Strategy</h3>
                <p className="text-teal-100 mb-6">
                    The first step in breaking a cycle is identifying your position within it. Discover if your current approach is based on structural logic, protective fear, or integrated peace.
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
                        <h4 className="text-lg font-bold text-gray-900 mb-2">What is the Nash Equilibrium in co-parenting?</h4>
                        <p className="text-gray-600 leading-relaxed">In game theory, it's the point where both parties have optimized for individual gain but ended up worse off than if they had cooperated. In co-parenting, this often manifests as depleted finances, emotional exhaustion, and damaged family relationships.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Why does my co-parent seem to misunderstand everything I say?</h4>
                        <p className="text-gray-600 leading-relaxed">Naive Realism and Negativity Bias work together: your co-parent's brain is primed to detect threats, and they genuinely believe their interpretation is objective. Understanding this biology helps move from frustration to strategic communication.</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">How does parental conflict affect children?</h4>
                        <p className="text-gray-600 leading-relaxed">Research shows children are impacted more by interparental conflict than by separation itself. When exposed to ongoing conflict, children divert emotional resources from development to managing parental stress, affecting their academic, social, and emotional growth.</p>
                    </div>
                </div>
            </div>
        </BlogArticleLayout>
    );
}
