/**
 * Observer Card Component
 * 
 * Displays Observer/Mediator feedback when a message triggers intervention.
 * Shows the structural analysis, axioms that fired, and alternative rewrites.
 */

import React from 'react';

export function ObserverCard({ observerData, originalText, onUseRewrite, onEditMyself, onSendOriginal }) {
  if (!observerData) return null;

  const { axiomsFired, explanation, tip, rewrite1, rewrite2, escalation } = observerData;

  return (
    <div className="mb-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-5 py-4 shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-orange-900 mb-1">
            Observer Feedback
          </h3>
          {axiomsFired && axiomsFired.length > 0 && (
            <div className="text-xs text-orange-700 mb-2">
              <span className="font-medium">Axioms fired:</span>{' '}
              {axiomsFired.join(', ')}
            </div>
          )}
          {escalation && (
            <div className="text-xs text-orange-700">
              <span className="font-medium">Risk:</span> {escalation.riskLevel} 
              {escalation.confidence > 0 && ` (${escalation.confidence}% confidence)`}
            </div>
          )}
        </div>
      </div>


      {/* Validation - friend-like acknowledgment */}
      {explanation && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">💭</span>
            <p className="text-sm text-gray-800 leading-snug italic">
              "{explanation}"
            </p>
          </div>
        </div>
      )}

      {/* Insight - practical advice */}
      {tip && (
        <div className="mb-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-xs font-semibold text-teal-700 mb-1">Why this matters:</p>
          <p className="text-sm text-teal-800">{tip}</p>
        </div>
      )}

      {/* Rewrites */}
      {(rewrite1 || rewrite2) && (
        <div className="space-y-2 mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Alternative ways to express this:</p>
          
          {rewrite1 && (
            <button
              type="button"
              onClick={() => onUseRewrite(rewrite1.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim())}
              className="w-full text-left p-3 bg-white border-2 border-teal-light rounded-lg hover:border-teal-medium hover:bg-teal-lightest transition-all text-sm text-gray-900 min-h-[44px]"
            >
              <div className="flex items-start gap-2">
                <span className="text-teal-medium font-semibold shrink-0">Option 1:</span>
                <span className="flex-1 leading-snug">{rewrite1.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim()}</span>
              </div>
            </button>
          )}

          {rewrite2 && (
            <button
              type="button"
              onClick={() => onUseRewrite(rewrite2.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim())}
              className="w-full text-left p-3 bg-white border-2 border-teal-light rounded-lg hover:border-teal-medium hover:bg-teal-lightest transition-all text-sm text-gray-900 min-h-[44px]"
            >
              <div className="flex items-start gap-2">
                <span className="text-teal-medium font-semibold shrink-0">Option 2:</span>
                <span className="flex-1 leading-snug">{rewrite2.replace(/^SENDER ALTERNATIVE #\d+:\s*/i, '').trim()}</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-orange-200">
        {onEditMyself && (
          <button
            type="button"
            onClick={onEditMyself}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            Edit Existing message
          </button>
        )}
        {onSendOriginal && (
          <button
            type="button"
            onClick={onSendOriginal}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors min-h-[44px]"
          >
            Send Original Anyway
          </button>
        )}
      </div>
    </div>
  );
}

