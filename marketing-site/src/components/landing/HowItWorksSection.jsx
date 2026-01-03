import React from 'react';
import { Button, Heading } from '../ui';
// Simple analytics - just console.log for now
const trackCTAClick = (location, label, type) =>
  console.log(`[Analytics] CTA click: ${location} - ${label} (${type})`);

/**
 * HowItWorksSection - 3-step process explanation
 */
export function HowItWorksSection({ scrollToWaitlistForm }) {
  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description:
        'Sign up in seconds. No credit card required. Your data is encrypted and secure.',
      gradient: 'from-teal-lightest to-teal-light',
    },
    {
      number: 2,
      title: 'Invite Your Co-Parent',
      description: 'Share a simple invite link. Both parents communicate on equal footing.',
      gradient: 'from-teal-light to-teal-medium',
    },
    {
      number: 3,
      title: 'Communicate Respectfully',
      description:
        'AI helps you find common ground, meet in the middle, and keep conversations productive.',
      gradient: 'from-teal-medium to-teal-dark',
    },
  ];

  const handleCTAClick = () => {
    trackCTAClick('how_it_works', 'Join the Waitlist', 'middle');
    scrollToWaitlistForm();
  };

  return (
    <div
      className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 opacity-0 translate-y-4 transition-all duration-700 ease-out"
      data-animate="fade-in"
    >
      <Heading
        variant="medium"
        color="teal-medium"
        as="h2"
        className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4"
      >
        How It Works
      </Heading>
      <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
        Getting started is simple. Three steps to healthier co-parenting.
      </p>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
        {steps.map(step => (
          <StepCard key={step.number} {...step} />
        ))}
      </div>

      <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col items-center px-4">
        <Button
          onClick={handleCTAClick}
          variant="teal-solid"
          size="large"
          className="w-full sm:w-auto bg-gradient-to-r from-teal-medium to-teal-dark hover:from-teal-dark hover:to-teal-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Join the Waitlist
        </Button>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, gradient }) {
  return (
    <div className="text-center">
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border-4 border-white shadow-md`}
      >
        <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-teal-medium">
          {number}
        </span>
      </div>
      <Heading
        variant="small"
        color="teal-medium"
        as="h3"
        className="mb-2 sm:mb-3 text-lg sm:text-xl"
      >
        {title}
      </Heading>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default HowItWorksSection;
