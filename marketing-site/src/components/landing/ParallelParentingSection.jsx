import React from 'react';
import { Heading } from '../ui';

/**
 * ParallelParentingSection - Dark section comparing avoidance vs prevention
 */
export function ParallelParentingSection() {
  return (
    <div
      className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-dark to-teal-medium rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-teal-dark shadow-xl relative overflow-hidden opacity-0 translate-y-4 transition-all duration-700 ease-out"
      data-animate="fade-in"
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 40%)',
        }}
      ></div>

      <div className="max-w-4xl mx-auto relative z-10 px-4">
        <Heading
          variant="medium"
          color="white"
          as="h2"
          className="mb-4 sm:mb-6 text-center text-white text-xl sm:text-2xl md:text-3xl"
        >
          Parallel parenting avoids conflict — it doesn't dissolve it.
        </Heading>
        <p className="text-base sm:text-lg md:text-xl text-white/95 mb-6 sm:mb-8 md:mb-10 text-center max-w-2xl mx-auto leading-relaxed">
          When communication and expectations differ between households, kids feel the instability —
          and it shows up in their emotions and behavior.
        </p>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ApproachCard
            title="Avoidance"
            items={[
              'Limits contact to prevent flare-ups',
              'Focuses on separation instead of collaboration',
              'Creates two distinct parenting environments',
              'Avoids triggers rather than resolving them',
            ]}
          />
          <ApproachCard
            title="Prevention (LiaiZen Approach)"
            isPositive
            items={[
              'Builds healthier communication habits in real time',
              'Encourages clarity, respect, and shared understanding',
              'Creates consistent expectations across both homes',
              'Stops conflict at the language level before it escalates',
            ]}
          />
        </div>

        <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/25 shadow-sm">
          <p className="text-base sm:text-lg font-semibold mb-3 text-white leading-relaxed">
            "I don't need a perfect co-parent. I just need peace, consistency, and the strength to
            raise my child with love—even when the drama tries to step in."
          </p>
        </div>
      </div>
    </div>
  );
}

function ApproachCard({ title, items, isPositive }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/20 shadow-sm">
      <Heading
        variant="small"
        color="white"
        as="h3"
        className="mb-3 sm:mb-4 text-white text-lg sm:text-xl"
      >
        {title}
      </Heading>
      <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/95">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-white font-semibold">{isPositive ? '✓' : '•'}</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParallelParentingSection;
