import React from 'react';
import { Heading } from '../ui';

/**
 * ProductMockupSection - Before/After message comparison
 */
export function ProductMockupSection() {
  return (
    <div
      className="mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 opacity-0 translate-y-4 transition-all duration-700 ease-out"
      data-animate="fade-in"
    >
      <div className="max-w-5xl mx-auto">
        <Heading
          variant="medium"
          color="dark"
          as="h2"
          className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl"
        >
          Become a stronger communicator
        </Heading>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
          Real-time guidance that helps you find the right words — even when emotions are high.
        </p>

        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Before */}
            <BeforeExample />
            {/* After */}
            <AfterExample />
          </div>

          {/* AI Badge */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 px-4">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-center">
              AI rewrites your message in real-time—before emotions escalate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforeExample() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <Heading variant="small" color="dark" as="h3" className="text-base sm:text-lg">
          Before LiaiZen
        </Heading>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-red-200 shadow-sm">
        <p className="text-sm sm:text-base text-gray-900 leading-relaxed italic">
          "You're ALWAYS changing plans last minute! This is exactly why I can't trust you with
          anything. Maybe if you actually cared about our son you'd stick to the schedule for once."
        </p>
      </div>
      <div className="flex items-start gap-2 text-xs sm:text-sm text-red-700 bg-red-50 p-2 sm:p-3 rounded-lg">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          <strong>High conflict risk:</strong> Accusatory tone, personal attacks, likely to escalate
        </span>
      </div>
    </div>
  );
}

function AfterExample() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#6dd4b0] flex items-center justify-center flex-shrink-0">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <Heading variant="small" color="teal-medium" as="h3" className="text-base sm:text-lg">
          With LiaiZen
        </Heading>
      </div>
      <div className="bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 border-2 border-teal-light shadow-sm">
        <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
          "I noticed the schedule changed. For planning purposes, could we aim for 48-hour notice
          when possible?"
        </p>
      </div>
      <div className="flex items-start gap-2 text-xs sm:text-sm text-teal-medium bg-teal-lightest p-2 sm:p-3 rounded-lg">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          <strong>Flexible &amp; collaborative:</strong> Neutral tone, focuses on problem-solving,
          invites collaboration
        </span>
      </div>
    </div>
  );
}

export default ProductMockupSection;
