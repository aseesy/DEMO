import React from 'react';
import { Heading } from '../ui';
import { principleIcons } from './icons.jsx';

/**
 * PrinciplesSection - Co-parenting principles
 */
export function PrinciplesSection() {
  const principles = [
    {
      icon: 'check',
      title: 'No One Is Wrong',
      description:
        "Both parents have valid perspectives. We help you understand each other's viewpoints and find solutions that work for everyone.",
    },
    {
      icon: 'users',
      title: 'Treat Everyone Equal',
      description:
        'Fair communication means both parents have an equal voice. Our platform ensures balanced, respectful dialogue.',
    },
    {
      icon: 'map',
      title: 'Meet in the Middle',
      description:
        "Compromise isn't losing - it's winning together. We help you find common ground that puts your children first.",
    },
    {
      icon: 'shield',
      title: 'Preserve Dignity',
      description: 'Feel proud of how you responded — not ashamed of how you reacted.',
    },
  ];

  return (
    <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light">
      <Heading
        variant="medium"
        color="teal-medium"
        as="h2"
        className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4"
      >
        Co-Parenting Principles We Stand By
      </Heading>
      <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 text-center max-w-2xl mx-auto px-4">
        Our approach is built on mutual respect, equality, and prevention
      </p>
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
        {principles.map((principle, i) => (
          <PrincipleCard key={i} {...principle} />
        ))}
      </div>
    </div>
  );
}

function PrincipleCard({ icon, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {principleIcons[icon]}
          </svg>
        </div>
      </div>
      <div>
        <Heading variant="small" color="teal-medium" as="h3" className="mb-2">
          {title}
        </Heading>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default PrinciplesSection;
