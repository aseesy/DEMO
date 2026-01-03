import React from 'react';
import { Heading } from '../ui';
// Simple analytics - just console.log for now
const trackFAQExpand = question => console.log(`[Analytics] FAQ expand: ${question}`);

/**
 * FAQSection - Frequently asked questions
 */
export function FAQSection() {
  const faqs = [
    {
      question: 'Is my information private and secure?',
      answer:
        "Absolutely. All communications are end-to-end encrypted, and we follow privacy-first design principles. Your data is never sold or shared with third parties. We take your family's privacy seriously.",
      tracked: true,
    },
    {
      question: "What if my co-parent doesn't want to use it?",
      answer:
        'LiaiZen works best when both parents participate, but you can still use features like task management, calendar organization, and contact management on your own. The platform is designed to make collaboration so easy that your co-parent may want to join once they see the benefits.',
    },
    {
      question: 'How does the AI mediation work?',
      answer:
        'Our AI analyzes tone and suggests alternative phrasing for messages that might escalate conflict. It provides neutral perspectives and keeps conversations productive and solution-focused, treating both parents equally.',
    },
    {
      question: 'Is this really free during beta?',
      answer:
        "Yes! Beta access is completely free with no credit card required. We're looking for families to help us test and improve LiaiZen. Your feedback is invaluable as we build the best co-parenting platform possible.",
    },
    {
      question: 'Can this be used for legal purposes?',
      answer:
        'LiaiZen helps you communicate better and stay organized, which can support your co-parenting journey. While we provide tools that help document conversations and agreements, we recommend consulting with a legal professional for specific legal advice.',
    },
    {
      question: 'What happens after the beta period?',
      answer:
        "Beta testers will receive special pricing and early access to new features as a thank you for helping us improve. We'll notify you well in advance of any changes, and your data will always remain secure and accessible.",
    },
    {
      question: 'How do I join the beta program?',
      answer:
        'Simply click "Start Free Beta Access" above and create your account. Beta access is completely free with no credit card required. You\'ll get full access to all features and can provide feedback to help us improve.',
    },
    {
      question: 'What if I find bugs or have suggestions?',
      answer:
        "We love feedback! As a beta tester, you'll have direct access to our team. You can report issues, suggest improvements, and help shape the future of LiaiZen. Your input directly influences what features we build next.",
    },
  ];

  return (
    <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24">
      <Heading
        variant="medium"
        color="teal-medium"
        as="h2"
        className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4"
      >
        Frequently Asked Questions
      </Heading>
      <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
        Everything you need to know about getting started
      </p>
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4">
        {faqs.map((faq, i) => (
          <FAQItem key={i} {...faq} />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer, tracked }) {
  const handleToggle = e => {
    if (tracked && e.target.open) {
      trackFAQExpand(question);
    }
  };

  return (
    <details
      className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all"
      onToggle={tracked ? handleToggle : undefined}
    >
      <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
        {question}
      </summary>
      <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">{answer}</p>
    </details>
  );
}

export default FAQSection;
