import React from 'react';
import {
  HeroSection,
  ProblemSection,
  WishListSection,
  ProductMockupSection,
  FeaturesSection,
  ParallelParentingSection,
  HowItWorksSection,
  TestimonialsSection,
  FAQSection,
  PrinciplesSection,
  ResourcesSection,
  Footer,
  StickyMobileCTA,
  useLandingPageState,
} from './components';

/**
 * LandingPage - Main landing page component
 * Composes all landing page sections using state colocation
 */
export function LandingPage() {
  const {
    familiesHelped,
    showStickyMobileCTA,
    heroFormRef,
    waitlistEmail,
    setWaitlistEmail,
    waitlistSubmitting,
    waitlistSuccess,
    waitlistError,
    handleWaitlistSubmit,
    scrollToWaitlistForm,
  } = useLandingPageState();

  return (
    <div className="min-h-dvh bg-white">
      {/* Hero Section */}
      <HeroSection
        familiesHelped={familiesHelped}
        waitlistEmail={waitlistEmail}
        setWaitlistEmail={setWaitlistEmail}
        waitlistSubmitting={waitlistSubmitting}
        waitlistSuccess={waitlistSuccess}
        waitlistError={waitlistError}
        handleWaitlistSubmit={handleWaitlistSubmit}
        heroFormRef={heroFormRef}
      />

      {/* Main Content Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The Real Problem Section */}
        <ProblemSection />

        {/* User Wish-List Section */}
        <WishListSection />

        {/* Product Mockup Section */}
        <ProductMockupSection />

        {/* Value Props & Features */}
        <FeaturesSection />

        {/* Parallel Parenting Section */}
        <ParallelParentingSection />

        {/* How It Works */}
        <HowItWorksSection scrollToWaitlistForm={scrollToWaitlistForm} />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Co-Parenting Principles */}
        <PrinciplesSection />
      </div>

      {/* Resources Section */}
      <ResourcesSection />

      {/* Footer */}
      <Footer />

      {/* Sticky Mobile CTA */}
      {!waitlistSuccess && (
        <StickyMobileCTA show={showStickyMobileCTA} scrollToWaitlistForm={scrollToWaitlistForm} />
      )}
    </div>
  );
}

export default LandingPage;
