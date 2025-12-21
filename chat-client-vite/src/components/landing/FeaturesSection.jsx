import React from 'react';
import { Heading } from '../ui';
import { valuePropIcons, featureIcons } from './icons.jsx';

/**
 * FeaturesSection - Value props and feature cards
 */
export function FeaturesSection() {
  return (
    <>
      {/* Value Proposition Cards */}
      <div
        className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24"
        data-section="value_proposition"
      >
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto px-4">
          <ValuePropCard
            icon="lock"
            title="Pro-active"
            description="develop a forward-thinking mindset"
          />
          <ValuePropCard
            icon="check"
            title="Removes Bias"
            description="Stay centered in the current conversation."
          />
          <ValuePropCard
            icon="book"
            title="Break Patterns"
            description="Form healthier communication habits"
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-20 px-4">
        <FeatureCard
          icon="chat"
          title="Instant Mediation"
          description="Real-time message filtering and tone adjustment to keep conversations respectful and productive"
          colorClass="from-teal-lightest to-teal-light"
          hoverColor="hover:border-teal-light"
        />
        <FeatureCard
          icon="clipboard"
          title="Keep Organized"
          description="Reduce confusion with automated updates."
          colorClass="from-[#D4F0EC] to-[#A8D9D3]"
          hoverColor="hover:border-[#A8D9D3]"
        />
        <FeatureCard
          icon="users"
          title="Adaptive Learning"
          description="Get relative insights based on your unique situation."
          colorClass="from-[#C0E9E3] to-[#8BCAC1]"
          hoverColor="hover:border-[#8BCAC1]"
        />
      </div>
    </>
  );
}

function ValuePropCard({ icon, title, description }) {
  return (
    <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-medium to-teal-dark rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          {valuePropIcons[icon]}
        </svg>
      </div>
      <Heading
        variant="small"
        color="dark"
        as="h3"
        className="mb-2 sm:mb-3 text-center sm:text-left"
      >
        {title}
      </Heading>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description, colorClass, hoverColor }) {
  return (
    <div
      className={`group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 ${hoverColor} transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-2`}
    >
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0`}
      >
        <svg
          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-teal-medium"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {featureIcons[icon]}
        </svg>
      </div>
      <Heading
        variant="small"
        color="teal-medium"
        as="h3"
        className="mb-2 sm:mb-3 text-center sm:text-left text-lg sm:text-xl"
      >
        {title}
      </Heading>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
        {description}
      </p>
    </div>
  );
}

export default FeaturesSection;
