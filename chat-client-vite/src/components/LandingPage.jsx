import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button, Heading, SectionHeader } from './ui';
import { apiGet } from '../apiClient.js';
import {
  trackCTAClick,
  trackSectionView,
  trackConversion,
  trackFormSubmit,
  trackExitIntent,
  trackSignInModalOpen,
  trackScrollDepth,
  trackFAQExpand,
  trackTestimonialView,
  trackProductPreviewInteraction,
} from '../utils/analytics.js';

export function LandingPage({ onGetStarted }) {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = React.useState(false);
  const [showSignInModal, setShowSignInModal] = React.useState(false);
  const [showSignupModal, setShowSignupModal] = React.useState(false);
  const [remainingSpots, setRemainingSpots] = React.useState(null); // null = loading, number = loaded

  const {
    email: authEmail,
    password,
    username,
    isAuthenticated,
    isLoggingIn,
    isSigningUp,
    error: authError,
    setEmail: setAuthEmail,
    setPassword,
    setError: setAuthError,
    handleLogin,
    handleSignup,
  } = useAuth();

  // If authenticated, navigate to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      // Close modals if open
      setShowSignInModal(false);
      setShowSignupModal(false);
      // Navigate to dashboard (root path)
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Scroll tracking for sections
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

      // Track scroll depth milestones
      if (scrollPercent >= 25 && scrollPercent < 50) {
        trackScrollDepth(25);
      } else if (scrollPercent >= 50 && scrollPercent < 75) {
        trackScrollDepth(50);
      } else if (scrollPercent >= 75 && scrollPercent < 90) {
        trackScrollDepth(75);
      } else if (scrollPercent >= 90) {
        trackScrollDepth(90);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for section views AND fade-in animations
  React.useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3, // Trigger when 30% of section is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.dataset.section;
          if (sectionName) {
            trackSectionView(sectionName);
          }

          // Handle fade-in animations
          if (entry.target.dataset.animate === 'fade-in') {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        }
      });
    }, observerOptions);

    // Observe all sections with data-section attribute
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    // Observe all elements with fade-in animation
    const animateElements = document.querySelectorAll('[data-animate=\"fade-in\"]');
    animateElements.forEach((element) => observer.observe(element));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      animateElements.forEach((element) => observer.unobserve(element));
    };
  }, []);

  // Fetch user count to calculate remaining beta spots
  React.useEffect(() => {
    async function fetchUserCount() {
      try {
        const response = await apiGet('/api/stats/user-count');
        if (response.ok) {
          const data = await response.json();
          const userCount = data.count || 0;
          const remaining = Math.max(0, 100 - userCount); // Ensure it doesn't go below 0
          setRemainingSpots(remaining);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
        // On error, show "100" as default
        setRemainingSpots(100);
      }
    }

    fetchUserCount();

    // Refresh every 30 seconds to keep spots updated
    const interval = setInterval(fetchUserCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const result = await handleLogin(e);
    // If login was successful (result exists and has user or success property)
    if (result && (result.user || result.success !== false)) {
      // Close modal on successful login
      setShowSignInModal(false);
      setAuthEmail('');
      setPassword('');
      setAuthError('');
      trackConversion('sign_in_modal', 'login');
      // Note: Navigation will happen via useEffect when isAuthenticated becomes true
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const result = await handleSignup(e);
    // If signup was successful
    if (result && (result.user || result.success !== false)) {
      // Close modal on successful signup
      setShowSignupModal(false);
      setAuthEmail('');
      setPassword('');
      setAuthError('');
      trackConversion('signup_modal', 'signup');
      // Note: Navigation will happen via useEffect when isAuthenticated becomes true
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with newsletter service
    console.log('Newsletter signup:', email);
    trackFormSubmit('newsletter', 'email');
    setNewsletterSubmitted(true);
    setEmail('');
    setTimeout(() => setNewsletterSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img
                src="/assets/Logo.svg"
                alt="LiaiZen Logo"
                className="h-6 sm:h-7 w-auto"
              />
              <img
                src="/assets/wordmark.svg"
                alt="LiaiZen"
                className="h-7 sm:h-8 w-auto"
              />
            </div>

            {/* CTA Buttons - Design System */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => {
                  trackSignInModalOpen();
                  navigate('/signin');
                }}
                variant="ghost"
                size="small"
                className="text-teal-medium hover:text-teal-dark text-sm sm:text-base px-3 sm:px-4 py-2 min-h-[44px]"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  trackCTAClick('navigation', 'Get Started', 'header');
                  navigate('/signin');
                }}
                variant="teal-solid"
                size="small"
                className="text-sm sm:text-base px-3 sm:px-4 py-2 min-h-[44px]"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced background */}
      <div className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-teal-lightest/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 sm:mb-20" style={{ overflowX: 'visible' }}>
            {/* Top Label - Design System SectionHeader */}
            <div className="mb-6">
              <SectionHeader color="medium" size="base">
                AI Mediation & Guidance
              </SectionHeader>
            </div>

            {/* Main Headline - Design System Heading with serif */}
            <div className="mb-8">
              <Heading variant="hero" color="dark" as="h1" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                <span className="block sm:inline">Co-parenting</span>{' '}
                <span className="block sm:inline">communication,</span>
                <br className="hidden sm:block" />
                <em className="block sm:inline">without the cringe.</em>
              </Heading>
            </div>

            {/* Description Text */}
            <p className="text-lg sm:text-xl text-gray-700 mb-6 max-w-3xl leading-relaxed">
              LiaiZen prevents conflict in real time—so every message moves the conversation forward.
            </p>

            {/* Beta Notice - Enhanced urgency */}
            <div className="mb-8 inline-flex flex-wrap items-center gap-2 sm:gap-3 bg-gradient-to-r from-teal-lightest to-white px-3 sm:px-4 py-2 rounded-full border-2 border-teal-light shadow-sm max-w-full">
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-medium opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-medium"></span>
              </span>
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                Join Our Beta.
              </span>
              <span className="text-xs sm:text-sm font-bold text-teal-medium whitespace-nowrap">
                {remainingSpots !== null ? (
                  `Only ${remainingSpots} spot${remainingSpots !== 1 ? 's' : ''} left!`
                ) : (
                  'Limited spots available!'
                )}
              </span>
            </div>

            {/* Dual CTAs - Enhanced with gradients */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-4">
              <Button
                onClick={() => {
                  trackCTAClick('hero', 'Get Early Access', 'primary');
                  navigate('/signin');
                }}
                variant="teal-solid"
                size="large"
                className="w-full sm:w-auto bg-gradient-to-r from-teal-medium to-teal-dark hover:from-teal-dark hover:to-teal-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Early Access
              </Button>
              <Button
                onClick={() => {
                  trackCTAClick('hero', 'Learn More', 'secondary');
                  document.querySelector('[data-section="value_proposition"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                variant="teal-outline"
                size="large"
                className="w-full sm:w-auto border hover:bg-teal-lightest transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* The Real Problem Section - Enhanced with fade-in */}
          <div className="mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out" data-animate="fade-in">
            <div className="max-w-4xl mx-auto">
              <Heading variant="medium" color="dark" as="h2" className="mb-6 sm:mb-8 text-center leading-tight">
                <span className="block text-xl sm:text-2xl md:text-3xl font-light text-gray-700 mb-2 sm:mb-3">Finally, you can open a message from your co-parent and</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-teal-medium pb-2">
                  feel at ease.
                </span>
              </Heading>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="bg-white rounded-xl p-4 sm:p-6 border border-red-100">
                  <Heading variant="small" color="dark" as="h3" className="mb-4 sm:mb-5 text-lg sm:text-xl">Not This</Heading>
                  <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg">✗</span>
                      <span className="leading-relaxed">Reactively seeking expert intervention after conflict</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg">✗</span>
                      <span className="leading-relaxed">Waiting until therapy to unpack conflict</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg">✗</span>
                      <span className="leading-relaxed">Building a case against the other parent</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold text-lg">✗</span>
                      <span className="leading-relaxed">Relying on the court to decide what's best for your children</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <Heading variant="small" color="dark" as="h3" className="mb-4 sm:mb-5 text-lg sm:text-xl">This</Heading>
                  <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-teal-medium font-bold text-lg">✓</span>
                      <span className="leading-relaxed"><strong>Intercepting</strong> conflict before it escalates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-medium font-bold text-lg">✓</span>
                      <span className="leading-relaxed"><strong>Writing proactive messages</strong> that move things forward</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-medium font-bold text-lg">✓</span>
                      <span className="leading-relaxed"><strong>Keeping a neutral tone</strong> so you stay calm and defensible</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-medium font-bold text-lg">✓</span>
                      <span className="leading-relaxed"><strong>Staying calm and professional</strong> even when emotions run hot</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border-l-4 border-teal-medium p-4 sm:p-6 rounded-r-lg">
                <p className="text-gray-800 italic leading-relaxed text-base sm:text-lg">
                  "The conflict isn't happening in court—it's happening in the messages. And nothing we tried changed the way we talk to each other."
                </p>

              </div>
            </div>
          </div>

          {/* User Wish-List Section - Enhanced background pattern */}
          <div className="mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 text-gray-900 border border-gray-200 shadow-sm opacity-0 translate-y-4 transition-all duration-700 ease-out" data-animate="fade-in" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(197, 232, 228, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(197, 232, 228, 0.15) 0%, transparent 50%)' }}>
            <div className="max-w-5xl mx-auto">
              <Heading variant="medium" color="dark" as="h2" className="mb-6 sm:mb-8 text-center text-xl sm:text-2xl md:text-3xl">
                After talking to real co-parents, their needs couldn't be clearer:
              </Heading>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mt-6 sm:mt-8 md:mt-10 mb-6 sm:mb-8 md:mb-10">
                <div className="group bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I wish someone could rewrite the message before I send it."
                    </p>
                  </div>
                </div>

                <div className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I want communication that doesn't escalate every week."
                    </p>
                  </div>
                </div>

                <div className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I'm tired of paying thousands for things that don't actually change anything."
                    </p>
                  </div>
                </div>

                <div className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I want a tool that protects my sanity AND my reputation."
                    </p>
                  </div>
                </div>

                <div className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I need help staying calm when they trigger me."
                    </p>
                  </div>
                </div>

                <div className="group bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-light to-teal-medium rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <p className="text-base italic text-gray-700 flex-1 leading-relaxed">
                      "I want conversations that don't end up in court."
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 sm:mt-8 md:mt-10">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 px-4">
                  <span className="bg-gradient-to-r from-teal-medium via-teal-dark to-teal-medium bg-clip-text text-transparent">And that's exactly what LiaiZen was built for.</span>
                </p>
                <p className="text-base sm:text-lg md:text-xl text-gray-600">

                </p>
              </div>
            </div>
          </div>


          {/* Product Screenshot/Mockup Section - Fade-in animation */}
          <div className="mt-16 sm:mt-24 md:mt-32 mb-16 sm:mb-24 md:mb-32 opacity-0 translate-y-4 transition-all duration-700 ease-out" data-animate="fade-in">
            <div className="max-w-5xl mx-auto">
              <Heading variant="medium" color="dark" as="h2" className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl">
                Become a stronger communicator
              </Heading>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
                Real-time guidance that helps you find the right words — even when emotions are high.
              </p>

              {/* Product Mockup - Before/After Message Example */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  {/* Before - Reactive Message */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <Heading variant="small" color="dark" as="h3" className="text-base sm:text-lg">Before LiaiZen</Heading>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-red-200 shadow-sm">
                      <p className="text-sm sm:text-base text-gray-900 leading-relaxed italic">
                        "You're ALWAYS changing plans last minute! This is exactly why I can't trust you with anything. Maybe if you actually cared about our son you'd stick to the schedule for once."
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-red-700 bg-red-50 p-2 sm:p-3 rounded-lg">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span><strong>High conflict risk:</strong> Accusatory tone, personal attacks, likely to escalate</span>
                    </div>
                  </div>

                  {/* After - With LiaiZen */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#6dd4b0] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <Heading variant="small" color="teal-medium" as="h3" className="text-base sm:text-lg">With LiaiZen</Heading>
                    </div>
                    <div className="bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 border-2 border-teal-light shadow-sm">
                      <p className="text-sm sm:text-base text-gray-900 leading-relaxed">
                        "I noticed the schedule changed. For planning purposes, could we aim for 48-hour notice when possible?"
                      </p>
                    </div>
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-teal-medium bg-teal-lightest p-2 sm:p-3 rounded-lg">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Flexible &amp; collaborative:</strong> Neutral tone, focuses on problem-solving, invites collaboration</span>
                    </div>
                  </div>
                </div>

                {/* AI Assistance Badge */}
                <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 px-4">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-medium flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-center">AI rewrites your message in real-time—before emotions escalate</span>
                </div>
              </div>
            </div>
          </div>


          {/* Value Proposition Cards - streamlined */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24" data-section="value_proposition">
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto px-4">
              {/* Value Prop 1 */}
              <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-medium to-teal-dark rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <Heading variant="small" color="dark" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left">Pro-active</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">develop a forward-thinking mindset</p>
              </div>

              {/* Value Prop 2 */}
              <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-medium to-teal-dark rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Heading variant="small" color="dark" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left">Removes Bias</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                  Stay centered in the current conversation.
                </p>
              </div>

              {/* Value Prop 3 */}
              <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-medium transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-medium to-teal-dark rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <Heading variant="small" color="dark" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left">Break Patterns</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                  Form healthier communication habits
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid - Enhanced hover effects */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-20 px-4">
            {/* Feature 1 */}
            <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-teal-light transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-teal-lightest to-teal-light rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left text-lg sm:text-xl">Instant Mediation</Heading>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                Real-time message filtering and tone adjustment to keep conversations respectful and productive
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-[#A8D9D3] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#D4F0EC] to-[#A8D9D3] rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left text-lg sm:text-xl">Keep Organized</Heading>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                Reduce confusion with automated updates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-gray-200 hover:border-[#8BCAC1] transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#C0E9E3] to-[#8BCAC1] rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-center sm:text-left text-lg sm:text-xl">Adaptive Learning</Heading>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed text-center sm:text-left">
                Get relative insights based on your unique situation.
              </p>
            </div>
          </div>

          {/* Parallel Parenting / Emotional Toll Section - Enhanced depth */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-dark to-teal-medium rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-teal-dark shadow-xl relative overflow-hidden opacity-0 translate-y-4 transition-all duration-700 ease-out" data-animate="fade-in">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 40%)' }}></div>
            <div className="max-w-4xl mx-auto relative z-10 px-4">
              <Heading variant="medium" color="white" as="h2" className="mb-4 sm:mb-6 text-center text-white text-xl sm:text-2xl md:text-3xl">
                Parallel parenting avoids conflict — it doesn't dissolve it.
              </Heading>
              <p className="text-base sm:text-lg md:text-xl text-white/95 mb-6 sm:mb-8 md:mb-10 text-center max-w-2xl mx-auto leading-relaxed">
                When communication and expectations differ between households, kids feel the instability — and it shows up in their emotions and behavior.
              </p>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/20 shadow-sm">
                  <Heading variant="small" color="white" as="h3" className="mb-3 sm:mb-4 text-white text-lg sm:text-xl">Avoidance</Heading>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/95">
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">•</span>
                      <span className="leading-relaxed">Limits contact to prevent flare-ups</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">•</span>
                      <span className="leading-relaxed">Focuses on separation instead of collaboration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">•</span>
                      <span className="leading-relaxed">Creates two distinct parenting environments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">•</span>
                      <span className="leading-relaxed">Avoids triggers rather than resolving them</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/20 shadow-sm">
                  <Heading variant="small" color="white" as="h3" className="mb-3 sm:mb-4 text-white text-lg sm:text-xl">Prevention (LiaiZen Approach)</Heading>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/95">
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">✓</span>
                      <span className="leading-relaxed">Builds healthier communication habits in real time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">✓</span>
                      <span className="leading-relaxed">Encourages clarity, respect, and shared understanding</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">✓</span>
                      <span className="leading-relaxed">Creates consistent expectations across both homes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white font-semibold">✓</span>
                      <span className="leading-relaxed">Stops conflict at the language level before it escalates</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-6 border-2 border-white/25 shadow-sm">
                <p className="text-base sm:text-lg font-semibold mb-3 text-white leading-relaxed">
                  "I don't need a perfect co-parent. I just need peace, consistency, and the strength to raise my child with love—even when the drama tries to step in."
                </p>

              </div>
            </div>
          </div>

          {/* How It Works - With subtle background */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 opacity-0 translate-y-4 transition-all duration-700 ease-out" data-animate="fade-in">
            <Heading variant="medium" color="teal-medium" as="h2" className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4">
              How It Works
            </Heading>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
              Getting started is simple. Three steps to healthier co-parenting.
            </p>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-teal-lightest to-teal-light rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border-4 border-white shadow-md">
                  <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-teal-medium">1</span>
                </div>
                <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-lg sm:text-xl">Create Your Account</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Sign up in seconds. No credit card required. Your data is encrypted and secure.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-teal-light to-teal-medium rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border-4 border-white shadow-md">
                  <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-teal-medium">2</span>
                </div>
                <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-lg sm:text-xl">Invite Your Co-Parent</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Share a simple invite link. Both parents communicate on equal footing.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-teal-medium to-teal-dark rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border-4 border-white shadow-md">
                  <span className="text-xl sm:text-2xl md:text-3xl font-semibold text-teal-medium">3</span>
                </div>
                <Heading variant="small" color="teal-medium" as="h3" className="mb-2 sm:mb-3 text-lg sm:text-xl">Communicate Peacefully</Heading>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  AI helps you find common ground, meet in the middle, and keep conversations productive.
                </p>
              </div>
            </div>
            <div className="mt-8 sm:mt-10 md:mt-12 flex justify-center px-4">
              <Button
                onClick={() => {
                  trackCTAClick('how_it_works', 'Get Started', 'middle');
                  navigate('/signin');
                }}
                variant="teal-solid"
                size="large"
                className="w-full sm:w-auto bg-gradient-to-r from-teal-medium to-teal-dark hover:from-teal-dark hover:to-teal-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </Button>
            </div>
          </div>



          {/* Testimonials */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light" data-section="testimonials">
            <Heading variant="medium" color="teal-medium" as="h2" className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4">
              What Professionals Are Saying
            </Heading>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
              Early feedback from family professionals and co-parents
            </p>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic">
                  "This is an effective tool that family lawyers would welcome. As a family mediator for over 17 years, I think it is a great idea."
                </p>
                <p className="text-xs sm:text-sm font-semibold text-teal-medium">— Family Mediator</p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic">
                  "For our family, I could see this helping us adapt better to change. I think it's a great idea not only for my family, but for situations at work."
                </p>
                <p className="text-xs sm:text-sm font-semibold text-teal-medium">— Divorced Mom</p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic">
                  "I regularly see the impact of divorce on children who go to my school. An app like this would be extremely helpful for the parents and children."
                </p>
                <p className="text-xs sm:text-sm font-semibold text-teal-medium">— Minister & School Director</p>
              </div>

              {/* Testimonial 4 */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border-2 border-teal-light">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-teal-medium" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm sm:text-base text-teal-medium leading-relaxed mb-3 sm:mb-4 italic">
                  "Our biggest challenge is being on the same page about how our children should be raised. I could see this being helpful to find a middle ground."
                </p>
                <p className="text-xs sm:text-sm font-semibold text-teal-medium">— Divorced Mom</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24">
            <Heading variant="medium" color="teal-medium" as="h2" className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4">
              Frequently Asked Questions
            </Heading>
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 md:mb-12 text-center max-w-2xl mx-auto px-4">
              Everything you need to know about getting started
            </p>
            <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4">
              {/* FAQ 1 */}
              <details
                className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all"
                onToggle={(e) => {
                  if (e.target.open) {
                    trackFAQExpand('Is my information private and secure?');
                  }
                }}
              >
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  Is my information private and secure?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Absolutely. All communications are end-to-end encrypted, and we follow privacy-first design principles. Your data is never sold or shared with third parties. We take your family's privacy seriously.
                </p>
              </details>

              {/* FAQ 2 */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  What if my co-parent doesn't want to use it?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  LiaiZen works best when both parents participate, but you can still use features like task management, calendar organization, and contact management on your own. The platform is designed to make collaboration so easy that your co-parent may want to join once they see the benefits.
                </p>
              </details>

              {/* FAQ 3 */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  How does the AI mediation work?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Our AI analyzes tone and suggests alternative phrasing for messages that might escalate conflict. It provides neutral perspectives and keeps conversations productive and solution-focused, treating both parents equally.
                </p>
              </details>

              {/* FAQ 4 */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  Is this really free during beta?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Yes! Beta access is completely free with no credit card required. We're looking for families to help us test and improve LiaiZen. Your feedback is invaluable as we build the best co-parenting platform possible.
                </p>
              </details>

              {/* FAQ 5 */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  Can this be used for legal purposes?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  LiaiZen helps you communicate better and stay organized, which can support your co-parenting journey. While we provide tools that help document conversations and agreements, we recommend consulting with a legal professional for specific legal advice.
                </p>
              </details>

              {/* FAQ 6 */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  What happens after the beta period?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Beta testers will receive special pricing and early access to new features as a thank you for helping us improve. We'll notify you well in advance of any changes, and your data will always remain secure and accessible.
                </p>
              </details>

              {/* FAQ 7 - Beta Specific */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  How do I join the beta program?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Simply click "Start Free Beta Access" above and create your account. Beta access is completely free with no credit card required. You'll get full access to all features and can provide feedback to help us improve.
                </p>
              </details>



              {/* FAQ 9 - Beta Specific */}
              <details className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 hover:border-teal-light transition-all">
                <summary className="font-semibold text-base sm:text-lg text-teal-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-medium focus:ring-offset-2">
                  What if I find bugs or have suggestions?
                </summary>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                  We love feedback! As a beta tester, you'll have direct access to our team. You can report issues, suggest improvements, and help shape the future of LiaiZen. Your input directly influences what features we build next.
                </p>
              </details>
            </div>
          </div>

          {/* Co-Parenting Tips Section */}
          <div className="mt-12 sm:mt-16 md:mt-24 mb-12 sm:mb-16 md:mb-24 bg-gradient-to-br from-teal-lightest to-white rounded-xl p-4 sm:p-6 md:p-8 border-2 border-teal-light">
            <Heading variant="medium" color="teal-medium" as="h2" className="mb-3 sm:mb-4 text-center text-2xl sm:text-3xl md:text-4xl px-4">
              Co-Parenting Principles We Stand By
            </Heading>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 text-center max-w-2xl mx-auto px-4">
              Our approach is built on mutual respect, equality, and prevention
            </p>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
              {/* Tip 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Heading variant="small" color="teal-medium" as="h3" className="mb-2">No One Is Wrong</Heading>
                  <p className="text-gray-600 leading-relaxed">
                    Both parents have valid perspectives. We help you understand each other's viewpoints and find solutions that work for everyone.
                  </p>
                </div>
              </div>

              {/* Tip 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Heading variant="small" color="teal-medium" as="h3" className="mb-2">Treat Everyone Equal</Heading>
                  <p className="text-gray-600 leading-relaxed">
                    Fair communication means both parents have an equal voice. Our platform ensures balanced, respectful dialogue.
                  </p>
                </div>
              </div>

              {/* Tip 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Heading variant="small" color="teal-medium" as="h3" className="mb-2">Meet in the Middle</Heading>
                  <p className="text-gray-600 leading-relaxed">
                    Compromise isn't losing - it's winning together. We help you find common ground that puts your children first.
                  </p>
                </div>
              </div>

              {/* Tip 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-medium rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <Heading variant="small" color="teal-medium" as="h3" className="mb-2">Preserve Dignity</Heading>
                  <p className="text-gray-600 leading-relaxed">
                    Feel proud of how you responded — not ashamed of how you reacted.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Newsletter Signup */}
          <div className="mt-24 mb-24">
            <div className="max-w-2xl mx-auto text-center bg-white rounded-xl p-6 sm:p-8 border-2 border-teal-light shadow-sm">
              <Heading variant="medium" color="teal-medium" as="h2" className="mb-4">
                Stay Updated
              </Heading>
              <p className="text-lg text-gray-600 mb-8">
                Get co-parenting tips, product updates, and early access to new features
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-dark focus:outline-none text-base min-h-[44px]"
                />
                <Button
                  type="submit"
                  variant="teal-solid"
                  size="large"
                  className="whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </form>
              {newsletterSubmitted && (
                <p className="mt-4 text-teal-medium font-semibold">
                  ✓ Thank you for subscribing!
                </p>
              )}
            </div>
          </div>





        </div>
      </div>

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4DA8B0] to-[#4DA8B0] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <Heading variant="small" color="dark" as="h3">
                  Sign In
                </Heading>
              </div>
              <Button
                onClick={() => {
                  setShowSignInModal(false);
                  setAuthError('');
                  setAuthEmail('');
                  setPassword('');
                }}
                variant="ghost"
                size="small"
                className="text-2xl leading-none text-gray-500 hover:text-teal-medium p-1"
              >
                ×
              </Button>
            </div>
            <form onSubmit={handleSignInSubmit} className="px-6 py-5">
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="signin-email" className="block text-sm font-medium text-teal-medium mb-2">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark text-base min-h-[44px]"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="signin-password" className="block text-sm font-medium text-teal-medium mb-2">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark text-base min-h-[44px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  loading={isLoggingIn}
                  variant="teal-solid"
                  size="medium"
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSignInModal(false);
                    navigate('/signin');
                  }}
                  variant="ghost"
                  size="medium"
                >
                  New Account
                </Button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                Don't have an account? Click "New Account" to sign up.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 pb-24 md:pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4DA8B0] to-[#4DA8B0] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <Heading variant="small" color="dark" as="h3">
                  Create Account
                </Heading>
              </div>
              <Button
                onClick={() => {
                  setShowSignupModal(false);
                  setAuthError('');
                  setAuthEmail('');
                  setPassword('');
                }}
                variant="ghost"
                size="small"
                className="text-2xl leading-none text-gray-500 hover:text-teal-medium p-1"
              >
                ×
              </Button>
            </div>
            <form onSubmit={handleSignupSubmit} className="px-6 py-5">
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="signup-email" className="block text-sm font-medium text-teal-medium mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark text-base min-h-[44px]"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="signup-password" className="block text-sm font-medium text-teal-medium mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password (min 4 characters)"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-dark text-base min-h-[44px]"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isSigningUp}
                  loading={isSigningUp}
                  variant="teal-solid"
                  size="medium"
                  className="flex-1"
                >
                  Create Account
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowSignInModal(true);
                    setAuthError('');
                    setAuthEmail('');
                    setPassword('');
                  }}
                  variant="ghost"
                  size="medium"
                >
                  Sign In
                </Button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                Already have an account? Click "Sign In" to log in.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-teal-light py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/assets/Logo.svg"
                alt="LiaiZen Logo"
                className="h-8 w-auto"
              />
              <img
                src="/assets/wordmark.svg"
                alt="LiaiZen"
                className="h-10 w-auto"
              />
            </div>

            {/* Links */}
            <div className="flex gap-6 text-sm">
              <a href="/privacy" className="text-gray-600 hover:text-teal-medium transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-teal-medium transition-colors">
                Terms of Service
              </a>
              <a href="/contact.html" className="text-gray-600 hover:text-teal-medium transition-colors">
                Contact Us
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2025 LiaiZen. Making co-parenting peaceful, one conversation at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
