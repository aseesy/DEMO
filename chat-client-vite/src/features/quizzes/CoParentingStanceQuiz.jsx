import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const questions = [
  {
    id: 1,
    title: 'The Schedule Change',
    scenario:
      'You receive a text: "My sister is in town for one night only. Can I keep the kids until 8:00 PM tonight instead of 5:00 PM?" Your first thought is:',
    options: [
      {
        letter: 'A',
        text: 'How will my child feel about missing out on seeing their aunt?',
        type: 'child-centered',
      },
      {
        letter: 'B',
        text: 'We have a 5:00 PM transition for a reason; keeping things consistent is safer for everyone.',
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: 'Here they go again, expecting me to be the flexible one while they do whatever they want.',
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: "I'll check my evening plans—if I'm free, it's no big deal to accommodate the family time.",
        type: 'collaborative',
      },
    ],
  },
  {
    id: 2,
    title: 'The Unshared Detail',
    scenario:
      "You find out from your child that they went to a birthday party over the weekend at the other parent's house, but you weren't told about it. Your reaction is:",
    options: [
      {
        letter: 'A',
        text: "I'm glad they had fun; I don't need to know every detail of their time away.",
        type: 'collaborative',
      },
      {
        letter: 'B',
        text: 'I feel uneasy; I need to know who my child is around and where they are for their safety.',
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: 'I feel excluded; it feels like the other parent is trying to build a life that erases me.',
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: 'I\'ll mention it later: "I heard about the party! I\'d love a heads-up next time so I can help with a gift."',
        type: 'child-centered',
      },
    ],
  },
  {
    id: 3,
    title: 'The Digital Tone',
    scenario:
      'You receive an email that starts with: "You forgot to pack the cleats again. This is getting ridiculous." Your drafting process begins with:',
    options: [
      {
        letter: 'A',
        text: 'Focusing strictly on the facts: "Cleats are in the car. I can drop them off at 4:00."',
        type: 'boundary-focused',
      },
      {
        letter: 'B',
        text: 'Defending myself: "I was rushing because you were late picking them up. You forget things too."',
        type: 'conflict-oriented',
      },
      {
        letter: 'C',
        text: "Deciding not to reply at all to show them that I won't be spoken to that way.",
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: 'Pausing to consider that their frustration might be about their own stress, not just the cleats.',
        type: 'collaborative',
      },
    ],
  },
  {
    id: 4,
    title: 'The School Event',
    scenario:
      "It's the night of the school play. You arrive and see your co-parent sitting in the third row. You:",
    options: [
      {
        letter: 'A',
        text: 'Head straight to the third row to sit together; the child needs to see us as a unified front.',
        type: 'child-centered',
      },
      {
        letter: 'B',
        text: "Find a seat several rows away; it's better to avoid any chance of awkwardness or tension.",
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: 'Wave politely from a distance, then find your own space to enjoy the show.',
        type: 'collaborative',
      },
      {
        letter: 'D',
        text: 'Sit elsewhere and keep an eye on who they are talking to or what they are doing.',
        type: 'conflict-oriented',
      },
    ],
  },
  {
    id: 5,
    title: 'The Childhood Narrative',
    scenario:
      'When your child asks, "Why can\'t you and [Other Parent] just live together?" you usually say:',
    options: [
      {
        letter: 'A',
        text: '"We both love you very much, and we\'ve decided we are better parents when we have our own homes."',
        type: 'child-centered',
      },
      {
        letter: 'B',
        text: '"Because we don\'t get along, and it\'s much more peaceful this way."',
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: '"You\'ll have to ask [Other Parent] about that; they were the one who made that choice."',
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: '"Sometimes families change shape, but we are still a team that looks out for you."',
        type: 'collaborative',
      },
    ],
  },
  {
    id: 6,
    title: 'The "Fairness" Lens',
    scenario: 'When you think about the parenting agreement or court order, you see it as:',
    options: [
      {
        letter: 'A',
        text: 'A baseline or "safety net" to use only when we can\'t agree on something ourselves.',
        type: 'collaborative',
      },
      {
        letter: 'B',
        text: 'The ultimate authority that must be followed to the letter to ensure things are fair.',
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: 'A list of rules that the other parent is constantly trying to find loopholes in.',
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: 'A professional framework that helps us keep our emotions out of the logistics.',
        type: 'child-centered',
      },
    ],
  },
  {
    id: 7,
    title: 'The Sick Day',
    scenario:
      'Your child wakes up with a fever on the morning of a transition day. Your first instinct is:',
    options: [
      {
        letter: 'A',
        text: 'To call the other parent and ask: "What do you think is best for [Child] right now? Should they stay put?"',
        type: 'collaborative',
      },
      {
        letter: 'B',
        text: "To tell the other parent they have to keep them, as it's their scheduled time and I have work.",
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: "To keep the child here; I don't trust the other parent to handle medical needs as well as I do.",
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: 'To follow the schedule regardless; transitions happen unless a doctor says otherwise.',
        type: 'boundary-focused',
      },
    ],
  },
  {
    id: 8,
    title: 'The Financial Friction',
    scenario:
      "A new school expense comes up that isn't explicitly mentioned in your agreement. You:",
    options: [
      {
        letter: 'A',
        text: 'Pay it myself to avoid the headache of a conversation that might turn into an argument.',
        type: 'conflict-oriented',
      },
      {
        letter: 'B',
        text: 'Send a factual request for half the cost, attaching the receipt and a deadline.',
        type: 'boundary-focused',
      },
      {
        letter: 'C',
        text: 'Suggest a quick phone call to discuss how we want to handle school costs moving forward.',
        type: 'collaborative',
      },
      {
        letter: 'D',
        text: 'Assume the other parent will refuse to pay, so I prepare a list of reasons why they should.',
        type: 'conflict-oriented',
      },
    ],
  },
  {
    id: 9,
    title: 'The Parenting Style Clash',
    scenario:
      'You learn the other parent allows more screen time or a later bedtime than you do. You:',
    options: [
      {
        letter: 'A',
        text: 'Accept that "Different House, Different Rules" is a necessary part of this journey.',
        type: 'collaborative',
      },
      {
        letter: 'B',
        text: 'Send them an article about the dangers of screen time to show them why their choice is wrong.',
        type: 'conflict-oriented',
      },
      {
        letter: 'C',
        text: 'Try to have a high-level conversation about aligning our "Top 3" house rules for the child\'s sake.',
        type: 'child-centered',
      },
      {
        letter: 'D',
        text: 'Tighten the rules at my house to "make up" for the lack of discipline at theirs.',
        type: 'boundary-focused',
      },
    ],
  },
  {
    id: 10,
    title: 'The Motivation Narrative',
    scenario:
      'When your co-parent makes a mistake (like forgetting a permission slip), you believe it happened because:',
    options: [
      {
        letter: 'A',
        text: 'They are likely overwhelmed and just made a human error, like we all do.',
        type: 'collaborative',
      },
      {
        letter: 'B',
        text: "They are irresponsible and don't take their role as a parent seriously enough.",
        type: 'conflict-oriented',
      },
      {
        letter: 'C',
        text: 'They do it to get a reaction out of me or to make me look like the "organized" one.',
        type: 'conflict-oriented',
      },
      {
        letter: 'D',
        text: "They aren't prioritizing the child's needs as much as their own personal life.",
        type: 'boundary-focused',
      },
    ],
  },
];

const stanceDescriptions = {
  'child-centered': {
    title: 'Child-Centered Co-Parent',
    description:
      "You consistently prioritize your child's emotional wellbeing and experience above all else. You think first about how decisions and situations affect your child, and you're willing to set aside personal feelings to create a positive environment for them.",
    strengths: [
      "Strong focus on child's emotional needs",
      'Ability to set aside personal grievances for your child',
      "Natural instinct to protect your child's relationship with both parents",
    ],
    growth: [
      'Remember to also set healthy boundaries for yourself',
      "Ensure you're not over-accommodating at the expense of your own wellbeing",
      'Balance child-focus with practical co-parenting logistics',
    ],
  },
  collaborative: {
    title: 'Collaborative Co-Parent',
    description:
      "You approach co-parenting as a team effort, even when it's difficult. You tend to assume good intentions, look for compromise, and maintain open communication. You see flexibility as a strength rather than a weakness.",
    strengths: [
      'Excellent at finding middle ground',
      'Maintains respectful communication',
      'Adapts well to changing circumstances',
      'Models healthy conflict resolution for your child',
    ],
    growth: [
      "Ensure collaboration doesn't become over-accommodation",
      'Maintain clear boundaries when needed',
      'Trust your instincts when something feels off',
    ],
  },
  'boundary-focused': {
    title: 'Boundary-Focused Co-Parent',
    description:
      'You value structure, consistency, and clear expectations. You rely on agreements and schedules to maintain stability and reduce conflict. You believe that clear boundaries protect everyone involved.',
    strengths: [
      'Creates predictable environment for your child',
      'Reduces ambiguity and potential for conflict',
      'Maintains emotional boundaries effectively',
      'Provides stability through structure',
    ],
    growth: [
      'Consider when flexibility might benefit your child',
      'Balance structure with responsiveness to changing needs',
      'Watch for rigidity that might create unnecessary friction',
    ],
  },
  'conflict-oriented': {
    title: 'Guarded Co-Parent',
    description:
      "You may be carrying wounds from past conflicts that affect how you interpret your co-parent's actions. This is understandable—co-parenting after separation is hard. However, this lens can sometimes escalate situations unnecessarily.",
    strengths: [
      'Highly attuned to potential problems',
      'Strong protective instincts',
      'Recognizes patterns quickly',
    ],
    growth: [
      'Practice assuming neutral (not negative) intent',
      'Consider whether past hurts are influencing current interpretations',
      'Focus on the present situation rather than past grievances',
      "LiaiZen's AI mediation can help reframe messages before sending",
    ],
  },
};

export function CoParentingStanceQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = type => {
    const newAnswers = { ...answers, [currentQuestion]: type };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResults = () => {
    const counts = {
      'child-centered': 0,
      collaborative: 0,
      'boundary-focused': 0,
      'conflict-oriented': 0,
    };

    Object.values(answers).forEach(type => {
      counts[type]++;
    });

    // Find the dominant stance
    const dominant = Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a));

    // Find secondary stance (if any)
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const secondary = sorted[1][1] >= 3 ? sorted[1] : null;

    return { counts, dominant: dominant[0], secondary: secondary ? secondary[0] : null };
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    const results = calculateResults();
    const dominantStance = stanceDescriptions[results.dominant];
    const secondaryStance = results.secondary ? stanceDescriptions[results.secondary] : null;

    return (
      <div className="h-dvh bg-gradient-to-b from-white to-teal-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/assets/Logo.svg" alt="LiaiZen" className="h-8 w-8" />
              <span className="text-xl font-semibold text-[#275559]">
                Li
                <span className="bg-gradient-to-r from-[#4DA8B0] to-[#46BD92] bg-clip-text text-transparent">
                  ai
                </span>
                Zen
              </span>
            </Link>
            <Link to="/quizzes" className="text-teal-600 hover:text-teal-800 text-sm font-medium">
              ← Back to Quizzes
            </Link>
          </div>
        </header>

        {/* Results */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Results</h1>
            <p className="text-gray-600">Based on your answers, here's your co-parenting stance</p>
          </div>

          {/* Primary Stance */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4">
                Primary Stance
              </span>
              <h2 className="text-2xl font-bold text-gray-900">{dominantStance.title}</h2>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">{dominantStance.description}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {dominantStance.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Areas for Growth
                </h3>
                <ul className="space-y-2">
                  {dominantStance.growth.map((item, i) => (
                    <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Secondary Stance */}
          {secondaryStance && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium mb-3">
                Secondary Tendency
              </span>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{secondaryStance.title}</h3>
              <p className="text-gray-600 text-sm">{secondaryStance.description}</p>
            </div>
          )}

          {/* Score Breakdown */}
          <div className="bg-white rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">Your Response Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(results.counts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-40">
                    {stanceDescriptions[type].title}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-500 rounded-full h-2 transition-all"
                      style={{ width: `${(count / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8">{count}/10</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">
              Ready to Improve Your Co-Parenting Communication?
            </h3>
            <p className="text-teal-100 mb-6">
              LiaiZen's AI-powered mediation helps you communicate more effectively, no matter your
              stance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-6 py-3 bg-white text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
              >
                Try LiaiZen Free
              </Link>
              <button
                onClick={restartQuiz}
                className="px-6 py-3 bg-teal-400 text-white rounded-lg font-medium hover:bg-teal-300 transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="h-dvh bg-gradient-to-b from-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/Logo.svg" alt="LiaiZen" className="h-8 w-8" />
            <span className="text-xl font-semibold text-[#275559]">
              Li
              <span className="bg-gradient-to-r from-[#4DA8B0] to-[#46BD92] bg-clip-text text-transparent">
                ai
              </span>
              Zen
            </span>
          </Link>
          <Link to="/quizzes" className="text-teal-600 hover:text-teal-800 text-sm font-medium">
            ← Back to Quizzes
          </Link>
        </div>
      </header>

      {/* Quiz Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-4">
              {question.title}
            </span>
            <p className="text-lg text-gray-800 leading-relaxed">{question.scenario}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map(option => (
              <button
                key={option.letter}
                onClick={() => handleAnswer(option.type)}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-gray-100 group-hover:bg-teal-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 group-hover:text-teal-700 transition-colors">
                    {option.letter}
                  </span>
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
                    {option.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation hint */}
        {currentQuestion > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="text-gray-500 hover:text-teal-600 text-sm"
            >
              ← Go back to previous question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CoParentingStanceQuiz;
