import React from 'react';
import { Button } from '../ui';
import { trackCTAClick } from '../../utils/analytics.js';

/**
 * StickyMobileCTA - Fixed bottom CTA bar for mobile
 */
export function StickyMobileCTA({ show, scrollToWaitlistForm }) {
  const handleClick = () => {
    trackCTAClick('sticky_mobile', 'Join the Waitlist', 'sticky');
    scrollToWaitlistForm();
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-nav bg-white border-t-2 border-teal-light shadow-lg transform transition-transform duration-300 pb-safe ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ zIndex: 'var(--z-nav)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-teal-800 truncate">Be the first to try LiaiZen</p>
          <p className="text-xs text-teal-600">Official launch coming soon!</p>
        </div>
        <Button
          onClick={handleClick}
          variant="teal-solid"
          size="small"
          className="flex-shrink-0 bg-teal-medium hover:bg-teal-dark border-none px-3 py-1.5 text-xs font-medium shadow-sm rounded-full tracking-normal"
        >
          Join the Waitlist
        </Button>
      </div>
    </div>
  );
}

export default StickyMobileCTA;
