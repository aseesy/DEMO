/**
 * AuthHeader - Logo and branding for auth pages
 */

import React from 'react';

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
        <img
          src="/assets/Logo.svg"
          alt="LiaiZen Logo"
          className="h-12 sm:h-14 w-auto transition-transform hover:scale-105"
        />
        <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-14 sm:h-16 w-auto" />
      </div>
      <p className="text-sm sm:text-base text-gray-600 font-medium mb-3 text-center">
        Collaborative Parenting
      </p>
    </div>
  );
}

export default AuthHeader;
