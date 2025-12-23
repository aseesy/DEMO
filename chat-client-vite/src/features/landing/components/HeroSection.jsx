import React from 'react';
import { Button, SectionHeader } from '../../../components/ui';

/**
 * HeroSection - Main landing page hero with waitlist form
 */
export function HeroSection({
  familiesHelped,
  waitlistEmail,
  setWaitlistEmail,
  waitlistSubmitting,
  waitlistSuccess,
  waitlistError,
  handleWaitlistSubmit,
  heroFormRef,
}) {
  return (
    <div className="pt-6 sm:pt-12 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-teal-lightest/30 to-white overflow-hidden relative">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#0f766e 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      ></div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-0 sm:mb-8 lg:mb-0 flex flex-col lg:flex-row lg:items-center lg:gap-8 xl:gap-16">
          {/* Left Column - Text Content */}
          <div className="flex-1 lg:flex-[1.2] xl:flex-[1.3] relative z-10">
            {/* Logo */}
            <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <img src="/assets/Logo.svg" alt="LiaiZen Logo" className="h-12 sm:h-14 w-auto" />
                <img src="/assets/wordmark.svg" alt="LiaiZen" className="h-12 sm:h-14 w-auto" />
              </div>
              <SectionHeader color="medium" size="base">
                AI Mediation & Guidance
              </SectionHeader>
            </div>

            {/* Main Headline */}
            <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] font-medium text-teal-dark tracking-tight">
                <span className="font-sans block sm:inline">Co-parenting,</span>
                <br className="hidden sm:block" />
                <em className="font-serif block sm:inline text-teal-medium">without the cringe.</em>
              </h1>
            </div>

            {/* Mobile/Tablet Image */}
            <div className="flex lg:hidden justify-center my-8 md:my-10 animate-fade-in mx-auto w-full max-w-[280px] md:max-w-md">
              <img
                src="/assets/family-exchange.svg"
                alt="Co-parents peacefully exchanging child during custody transition"
                className="w-full h-auto scale-x-[-1]"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                }}
              />
            </div>

            {/* Description */}
            <p
              className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-xl leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              LiaiZen prevents conflict in real time—so every message is constructive.
            </p>

            {/* Social Proof + Urgency */}
            <SocialProofBadges familiesHelped={familiesHelped} />

            {/* Waitlist Form */}
            <WaitlistForm
              waitlistEmail={waitlistEmail}
              setWaitlistEmail={setWaitlistEmail}
              waitlistSubmitting={waitlistSubmitting}
              waitlistSuccess={waitlistSuccess}
              waitlistError={waitlistError}
              handleWaitlistSubmit={handleWaitlistSubmit}
              heroFormRef={heroFormRef}
            />

            {/* Trust Signals */}
            <TrustSignals />
          </div>

          {/* Right Column - Desktop Image */}
          <DesktopHeroImage />
        </div>
      </div>
    </div>
  );
}

function SocialProofBadges({ familiesHelped }) {
  return (
    <div
      className="mb-8 sm:mb-10 flex flex-col sm:flex-row items-center sm:items-center gap-4 animate-fade-in-up"
      style={{ animationDelay: '0.4s' }}
    >
      {/* Families Helped Badge */}
      <div className="flex items-center gap-3 text-sm text-gray-600 bg-white/50 backdrop-blur-sm p-1.5 pr-4 rounded-full border border-gray-100 shadow-sm">
        <div className="flex -space-x-3">
          <div className="w-9 h-9 rounded-full bg-teal-light border-2 border-white flex items-center justify-center text-xs font-bold text-teal-dark shadow-sm">
            J
          </div>
          <div className="w-9 h-9 rounded-full bg-teal-medium border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm">
            M
          </div>
          <div className="w-9 h-9 rounded-full bg-teal-dark border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm">
            S
          </div>
        </div>
        <span className="font-medium">
          {familiesHelped !== null ? `${familiesHelped}+` : '47+'} families joined
        </span>
      </div>

      {/* Beta Notice */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
        </span>
        <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
          Beta Access Starting Soon!
        </span>
      </div>
    </div>
  );
}

function WaitlistForm({
  waitlistEmail,
  setWaitlistEmail,
  waitlistSubmitting,
  waitlistSuccess,
  waitlistError,
  handleWaitlistSubmit,
  heroFormRef,
}) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      {!waitlistSuccess ? (
        <form
          onSubmit={e => handleWaitlistSubmit(e, 'hero')}
          className="w-full max-w-md"
          ref={heroFormRef}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={waitlistSubmitting}
              className="flex-[2] min-w-0 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-medium focus:ring-4 focus:ring-teal-light/20 focus:outline-none text-base transition-all bg-white shadow-sm disabled:bg-gray-50 placeholder:text-gray-400"
            />
            <Button
              type="submit"
              disabled={waitlistSubmitting}
              variant="teal-solid"
              size="medium"
              className="w-full sm:w-auto bg-teal-medium hover:bg-teal-dark transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap py-2 px-5 text-sm font-medium rounded-full border-none"
            >
              {waitlistSubmitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
          {waitlistError && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {waitlistError}
            </p>
          )}
        </form>
      ) : (
        <div className="w-full max-w-md bg-teal-50 border border-teal-100 rounded-xl p-5 text-center shadow-sm animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-teal-600"
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
            <span className="text-lg font-bold text-teal-800">You're on the list!</span>
          </div>
          <p className="text-sm text-teal-600">
            Watch your inbox. We'll be in touch soon with your invite.
          </p>
        </div>
      )}
    </div>
  );
}

function TrustSignals() {
  return (
    <div
      className="mt-6 sm:mt-8 flex flex-nowrap items-center justify-between sm:justify-start gap-x-2 sm:gap-x-6 text-[10px] min-[380px]:text-xs sm:text-sm text-gray-500 font-medium animate-fade-in-up whitespace-nowrap"
      style={{ animationDelay: '0.6s' }}
    >
      <span className="flex items-center gap-1 sm:gap-2">
        <svg
          className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Easy to Use
      </span>
      <span className="flex items-center gap-1 sm:gap-2">
        <svg
          className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        Co-Parent Founder
      </span>
      <span className="flex items-center gap-1 sm:gap-2">
        <svg
          className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Secure & Private
      </span>
    </div>
  );
}

function DesktopHeroImage() {
  return (
    <div className="hidden lg:block flex-1 ml-auto relative">
      {/* Organic blob background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] z-0 pointer-events-none opacity-60">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#F0FDFA"
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.5C93.5,8.2,82.2,20.7,71.5,31.7C60.9,42.7,50.9,52.2,39.9,59.3C28.9,66.4,16.9,71.1,3.4,65.2C-10.1,59.3,-25.1,42.8,-38.3,29.9C-51.5,17,-62.9,7.7,-64.8,-3.3C-66.7,-14.3,-59.1,-27,-49.6,-38.3C-40.1,-49.6,-28.7,-59.5,-16.4,-63.9C-4.1,-68.3,9.1,-67.2,22.4,-66.1L44.7,-76.4Z"
            transform="translate(100 100) scale(1.1)"
          />
        </svg>
      </div>
      <img
        src="/assets/family-exchange.svg"
        alt="Co-parents peacefully exchanging child during custody transition"
        className="relative z-10 w-full max-w-lg xl:max-w-xl scale-x-[-1] animate-float mx-auto mix-blend-multiply"
        style={{
          animationDuration: '6s',
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        }}
      />
    </div>
  );
}

export default HeroSection;
