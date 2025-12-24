/**
 * Observer Card Component
 *
 * Displays Observer/Mediator feedback when a message triggers intervention.
 * Shows validation message and alternative rewrites with improved visual hierarchy.
 */

import React from 'react';

export function ObserverCard({ observerData, originalText, onUseRewrite, onEditMyself }) {
  if (!observerData) return null;

  const { axiomsFired, explanation, tip, refocusQuestions, rewrite1, rewrite2, escalation } =
    observerData;

  return (
    <div className="mb-4 rounded-xl border-2 border-teal-light bg-white px-4 sm:px-6 py-4 shadow-lg mx-auto max-w-full">
      {/* Validation - Primary message: AI directly talking to user, understanding and helping */}
      {explanation && (
        <div className="mb-6">
          <p className="text-base sm:text-lg text-gray-900 leading-relaxed font-serif italic wrap-break-word">
            {explanation}
          </p>
        </div>
      )}

      {/* Refocus Section - Questions to help shift thinking */}
      {refocusQuestions && refocusQuestions.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
            Refocus
          </h3>
          <ul className="space-y-2">
            {refocusQuestions.map((question, index) => (
              <li key={index} className="flex items-start gap-2 text-amber-900">
                <span className="text-amber-600 mt-0.5">•</span>
                <span className="text-sm leading-relaxed">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rewrites Section - Secondary: actionable alternatives */}
      {(rewrite1 || rewrite2) && (
        <div className="space-y-3">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-teal-dark uppercase tracking-wide">
              Alternative ways to express this:
            </h3>
          </div>

          <div className="space-y-3">
            {rewrite1 && (
              <button
                type="button"
                onClick={() =>
                  onUseRewrite(rewrite1.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim())
                }
                className="w-full text-left p-4 bg-teal-lightest border-2 border-teal-light rounded-lg hover:border-teal-medium hover:bg-white hover:shadow-md transition-all duration-200 text-sm text-gray-900 min-h-[44px] wrap-break-word group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-teal-dark font-semibold shrink-0 text-xs uppercase tracking-wide">
                    Option 1
                  </span>
                  <span className="flex-1 leading-relaxed wrap-break-word">
                    {rewrite1.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim()}
                  </span>
                </div>
              </button>
            )}

            {rewrite2 && (
              <button
                type="button"
                onClick={() =>
                  onUseRewrite(rewrite2.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim())
                }
                className="w-full text-left p-4 bg-teal-lightest border-2 border-teal-light rounded-lg hover:border-teal-medium hover:bg-white hover:shadow-md transition-all duration-200 text-sm text-gray-900 min-h-[44px] wrap-break-word group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-teal-dark font-semibold shrink-0 text-xs uppercase tracking-wide">
                    Option 2
                  </span>
                  <span className="flex-1 leading-relaxed wrap-break-word">
                    {rewrite2.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim()}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actions - Tertiary: optional edit action */}
      {onEditMyself && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onEditMyself}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
