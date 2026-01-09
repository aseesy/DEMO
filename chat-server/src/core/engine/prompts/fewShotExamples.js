/**
 * Few-Shot Examples for AI Mediation
 *
 * These examples teach the AI the constitution principles through demonstration
 * rather than embedding the full constitution in every prompt.
 *
 * @module liaizen/core/prompts/fewShotExamples
 */

/**
 * Intervention examples showing proper validation, questions, and rewrites
 */
const interventionExamples = [
  {
    input: {
      message: 'You never let me see the kids on time!',
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Scheduling conflict about pickup times',
    },
    output: {
      action: 'INTERVENE',
      escalation: {
        riskLevel: 'medium',
        confidence: 85,
        reasons: ['absolute statement', 'blame language'],
      },
      intervention: {
        validation:
          "It's frustrating when schedules don't align with your expectations, especially when you've planned your time around seeing the kids.",
        refocusQuestions: [
          'What do you really need from them right now - an apology or just better consistency?',
          'Could the delay be about their situation, not about you?',
          'Will this matter in a week, or is there a bigger pattern to address?',
        ],
        rewrite1:
          "I'd really appreciate sticking to the schedule so I can make the most of my time with them.",
        rewrite2:
          'Could we work together to make sure pickups happen on time? It helps me plan better.',
      },
    },
  },
  {
    input: {
      message: "Tell your dad he needs to pay up or I'm taking you to court",
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Child support payment discussion',
    },
    output: {
      action: 'INTERVENE',
      escalation: {
        riskLevel: 'high',
        confidence: 95,
        reasons: ['threat', 'using child as messenger', 'ultimatum'],
      },
      intervention: {
        validation:
          "Financial stress creates urgency, and it's natural to want to protect your child's needs. Using threats and involving the child puts them in an unfair position.",
        refocusQuestions: [
          'What outcome would actually help here - payment or acknowledgment?',
          'Is there a way to address this directly without involving the child?',
          'What kind of co-parent do you want to be in this moment?',
        ],
        rewrite1:
          'I need to discuss the payment schedule with you directly. Can we set up a time to talk about this?',
        rewrite2:
          "Let me handle the money conversations directly. Our child doesn't need to be in the middle of this.",
      },
    },
  },
  {
    input: {
      message: "You're such a bitch for changing the schedule without asking",
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Schedule change without consultation',
    },
    output: {
      action: 'INTERVENE',
      escalation: {
        riskLevel: 'high',
        confidence: 90,
        reasons: ['name-calling', 'contempt', 'blame'],
      },
      intervention: {
        validation:
          "When you say 'you're such a bitch' to Bob, this name-calling shuts down any chance of being heard, so your actual concerns about schedule changes won't get addressed. It disrupts his ability to respond constructively to your legitimate need for better communication.",
        refocusQuestions: [
          'What do you really need - an apology, better communication, or just to be included in decisions?',
          'Could this be about their situation (work, other commitments) rather than about you?',
          'Would this phrasing achieve your goal of being included in schedule decisions?',
        ],
        rewrite1:
          "I'm feeling frustrated that the schedule changed without us discussing it first. Can we talk about how to handle changes going forward?",
        rewrite2:
          'When plans change without checking in, it makes it hard for me to plan. Could we agree to discuss schedule changes before making them?',
      },
    },
  },
];

/**
 * Stay Silent examples showing when NOT to intervene
 */
const staySilentExamples = [
  {
    input: {
      message: 'Could we swap weekends? I have a work trip coming up',
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Scheduling request',
    },
    output: {
      action: 'STAY_SILENT',
      escalation: {
        riskLevel: 'low',
        confidence: 95,
        reasons: ['polite request', 'logistics coordination'],
      },
    },
  },
  {
    input: {
      message:
        'Emma mentioned she has a doctor appointment next week. Do you want me to take her or would you prefer to?',
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Medical coordination',
    },
    output: {
      action: 'STAY_SILENT',
      escalation: {
        riskLevel: 'low',
        confidence: 90,
        reasons: ['informational', 'collaborative question'],
      },
    },
  },
  {
    input: {
      message: "I know it's your night but could I pick her up early? She has a school project due",
      sender: 'Alice',
      receiver: 'Bob',
      context: 'Flexible scheduling request',
    },
    output: {
      action: 'STAY_SILENT',
      escalation: {
        riskLevel: 'low',
        confidence: 85,
        reasons: ["acknowledges other parent's time", 'polite request'],
      },
    },
  },
];

/**
 * Comment examples showing when to add brief guidance without blocking
 */
const commentExamples = [
  {
    input: {
      message: 'I really need you to be more reliable',
      sender: 'Alice',
      receiver: 'Bob',
      context: 'General reliability concern',
    },
    output: {
      action: 'COMMENT',
      escalation: {
        riskLevel: 'low',
        confidence: 70,
        reasons: ['vague criticism', 'could be more specific'],
      },
      intervention: {
        comment:
          "Being specific about what you need helps: 'I need you to arrive on time for pickups' is clearer than 'be more reliable.'",
      },
    },
  },
];

/**
 * Get few-shot examples for prompt injection
 * Returns formatted examples string for inclusion in prompts
 * @param {number} count - Number of examples per category (default: 1)
 */
function getFewShotExamples(count = 1) {
  const examples = [];

  // Add one intervention example (most important for teaching intervention format)
  if (count >= 1 && interventionExamples.length > 0) {
    const ex = interventionExamples[0];
    examples.push(
      `EXAMPLE - INTERVENE:\n` +
        `Input: "${ex.input.message}"\n` +
        `Output: ${JSON.stringify(ex.output, null, 2)}`
    );
  }

  // Add one stay silent example (shows when NOT to intervene)
  if (count >= 1 && staySilentExamples.length > 0) {
    const ex = staySilentExamples[0];
    examples.push(
      `EXAMPLE - STAY_SILENT:\n` +
        `Input: "${ex.input.message}"\n` +
        `Output: ${JSON.stringify(ex.output, null, 2)}`
    );
  }

  return examples.join('\n\n');
}

module.exports = {
  interventionExamples,
  staySilentExamples,
  commentExamples,
  getFewShotExamples,
};
