import React from 'react';
import { Heading } from '../../../components/ui';

/**
 * ProblemSection - "The Real Problem" comparison section
 */
export function ProblemSection() {
  return (
    <div
      className="mt-8 sm:mt-12 md:mt-16 mb-16 sm:mb-24 md:mb-32 bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out"
      data-animate="fade-in"
    >
      <div className="max-w-4xl mx-auto">
        <Heading
          variant="medium"
          color="dark"
          as="h2"
          className="mb-6 sm:mb-8 text-center leading-tight"
        >
          <span className="block text-2xl sm:text-3xl md:text-4xl font-medium text-teal-medium pb-2">
            Finally, feel at ease when you open a message.
          </span>
        </Heading>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
          {/* Not This */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-red-100">
            <Heading
              variant="small"
              color="dark"
              as="h3"
              className="mb-4 sm:mb-5 text-lg sm:text-xl"
            >
              Not This
            </Heading>
            <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
              <ProblemItem negative text="Reactively seeking expert intervention after conflict" />
              <ProblemItem negative text="Waiting until therapy to unpack conflict" />
              <ProblemItem negative text="Building a case against the other parent" />
              <ProblemItem
                negative
                text="Relying on the court to decide what's best for your children"
              />
            </ul>
          </div>

          {/* This */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            <Heading
              variant="small"
              color="dark"
              as="h3"
              className="mb-4 sm:mb-5 text-lg sm:text-xl"
            >
              This
            </Heading>
            <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
              <ProblemItem
                text={
                  <>
                    <strong>Intercepting</strong> conflict before it escalates
                  </>
                }
              />
              <ProblemItem
                text={
                  <>
                    <strong>Writing proactive messages</strong> that move things forward
                  </>
                }
              />
              <ProblemItem
                text={
                  <>
                    <strong>Keeping a neutral tone</strong> so you stay calm and defensible
                  </>
                }
              />
              <ProblemItem
                text={
                  <>
                    <strong>Staying calm and professional</strong> even when emotions run hot
                  </>
                }
              />
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 border-l-4 border-teal-medium p-4 sm:p-6 rounded-r-lg">
          <p className="text-gray-800 italic leading-relaxed text-base sm:text-lg">
            "The conflict isn't happening in court—it's happening in the messages. And nothing we
            tried changed the way we talk to each other."
          </p>
        </div>
      </div>
    </div>
  );
}

function ProblemItem({ negative, text }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`${negative ? 'text-red-500' : 'text-teal-medium'} font-bold text-lg`}>
        {negative ? '✗' : '✓'}
      </span>
      <span className="leading-relaxed">{text}</span>
    </li>
  );
}

export default ProblemSection;
