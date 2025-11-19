import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
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
  const [email, setEmail] = React.useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = React.useState(false);
  const [showSignInModal, setShowSignInModal] = React.useState(false);
  const [showExitIntent, setShowExitIntent] = React.useState(false);
  const [exitIntentEmail, setExitIntentEmail] = React.useState('');
  
  const {
    email: authEmail,
    password,
    username,
    isAuthenticated,
    isLoggingIn,
    error: authError,
    setEmail: setAuthEmail,
    setPassword,
    setError: setAuthError,
    handleLogin,
  } = useAuth();

  // If authenticated, hide landing page
  React.useEffect(() => {
    if (isAuthenticated) {
      onGetStarted();
    }
  }, [isAuthenticated, onGetStarted]);

  // Exit intent detection
  React.useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !showExitIntent && !isAuthenticated) {
        trackExitIntent();
        setShowExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [showExitIntent, isAuthenticated]);

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

  // Intersection Observer for section views
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
        }
      });
    }, observerOptions);

    // Observe all sections with data-section attribute
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const result = await handleLogin(e);
    if (result && isAuthenticated) {
      trackConversion('sign_in_modal', 'login');
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/TransB.svg"
                alt="@TransB"
                className="h-12 sm:h-16 w-auto"
              />
              <img
                src="/assets/LZlogo.svg"
                alt="LiaiZen"
                className="h-14 sm:h-20 w-auto"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  trackSignInModalOpen();
                  setShowSignInModal(true);
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-[#275559] rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 transition-all border-2 border-[#275559] shadow-sm hover:shadow-md"
              >
                Sign In
              </button>
            <button
                onClick={() => {
                  trackCTAClick('navigation', 'Get Started', 'header');
                  onGetStarted();
                }}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#275559] text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-[#1f4447] transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Beta Badge with Urgency */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E6F7F5] to-[#C5E8E4] rounded-full mb-6 border border-[#A8D9D3] animate-pulse">
              <span className="text-2xl">🎉</span>
              <span className="text-sm font-semibold text-[#275559]">Join Our Beta Program • Limited Spots Available</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#275559] mb-6 leading-tight">
              Cringe-Worthy Co-Parenting Messages?{' '}
              <span className="text-[#4DA8B0]">We Get It.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              LiaiZen prevents conflict in real time—so every message moves the conversation forward, not backward.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <button
                onClick={() => {
                  trackCTAClick('hero', 'Get Started', 'primary');
                  onGetStarted();
                }}
                className="px-10 py-5 bg-gradient-to-r from-[#4DA8B0] to-[#3d8a92] text-white rounded-2xl font-bold text-lg sm:text-xl hover:from-[#3d8a92] hover:to-[#2d6d75] transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform w-full sm:w-auto"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  trackCTAClick('hero', 'See How It Works', 'secondary');
                  document.querySelector('[data-section="value_proposition"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-10 py-5 bg-white text-[#275559] rounded-2xl font-bold text-lg sm:text-xl border-2 border-[#4DA8B0] hover:bg-[#E6F7F5] transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                See How It Works
              </button>
            </div>

            {/* Microcopy */}
            <p className="text-base text-slate-600 font-medium mb-8">
              No lawyers, no $400/hr mediators. Just instant help before things escalate.
            </p>

            {/* Hero Visual Element - Calm/Peace Illustration */}
            <div className="mt-12 relative">
              <div className="max-w-3xl mx-auto">
                {/* Placeholder for hero image - Recommended: Calm co-parents communicating, parent with phone looking peaceful, or abstract calm/buffer visual */}
                <div className="bg-gradient-to-br from-[#E6F7F5] via-white to-[#C5E8E4] rounded-3xl p-12 border-2 border-[#A8D9D3] relative overflow-hidden">
                  {/* Decorative elements suggesting calm/protection */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#4DA8B0]/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#275559]/10 rounded-full blur-3xl"></div>

                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-6 border-4 border-[#C5E8E4]">
                      {/* Shield with checkmark - represents protection */}
                      <svg className="w-16 h-16 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600 italic">
                      Your buffer between inbox chaos and inner peace
                    </p>
                  </div>
                </div>

                {/* Image suggestion comment for future */}
                {/*
                  RECOMMENDED IMAGES TO ADD HERE:
                  - Diverse parent looking at phone with relieved/calm expression
                  - Split screen: stressed parent → peaceful parent after using LiaiZen
                  - Abstract illustration: storm cloud → calm sky
                  - Parent and child together, parent looking at peace (not at phone)
                  - Simple illustration of message bubbles with AI filter between them
                */}
              </div>
            </div>
          </div>

          {/* The Real Problem Section - NEW */}
          <div className="mt-24 mb-24 bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 sm:p-12 border border-slate-200">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-6 text-center">
                Finally, you can look at messages from your co-parent<br />
                <span className="text-[#4DA8B0]">without feeling sick to your stomach.</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border-2 border-red-100">
                  <h3 className="font-bold text-lg text-slate-900 mb-4">What Doesn't Work:</h3>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>$250–$400/hr mediators</strong> aren't there when the message hits your phone</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>Therapy</strong> helps you cope—but doesn't rewrite your next text</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>Co-parenting apps</strong> track the conflict but don't prevent it</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-500 font-bold">✗</span>
                      <span><strong>Court orders</strong> don't eliminate emotional triggers</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-xl p-6 border-2 border-[#4DA8B0]">
                  <h3 className="font-bold text-lg text-[#275559] mb-4">What Actually Works:</h3>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-[#4DA8B0] font-bold">✓</span>
                      <span><strong>Intercepting</strong> conflict before it escalates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4DA8B0] font-bold">✓</span>
                      <span><strong>Writing proactive messages</strong> that move things forward</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4DA8B0] font-bold">✓</span>
                      <span><strong>Keeping a neutral tone</strong> so you stay calm and defensible</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#4DA8B0] font-bold">✓</span>
                      <span><strong>Focusing on the child's best interest</strong> even when emotions run hot</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl">
                <p className="text-slate-800 italic">
                  "The conflict isn't happening in court—it's happening in the messages. And nothing we tried changed the way we talk to each other."
                </p>
                <p className="text-sm text-slate-600 mt-2">— High-conflict co-parent, Reddit</p>
              </div>
            </div>
          </div>

          {/* Value Proposition Section */}
          <div className="mt-24 mb-24" data-section="value_proposition">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-12 text-center">
              Finally. A Tool That Actually Does Something.
            </h2>
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* Value Prop 1 */}
              <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 border-2 border-[#C5E8E4] hover:border-[#4DA8B0] transition-all shadow-sm hover:shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-[#4DA8B0] to-[#6dd4b0] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Prevents Hostile Exchanges</h3>
                <p className="text-gray-700 leading-relaxed">
                  AI-powered mediation stops hostile exchanges before they damage your co-parenting relationship
                </p>
              </div>

              {/* Value Prop 2 */}
              <div className="bg-gradient-to-br from-[#D4F0EC] to-white rounded-3xl p-8 border-2 border-[#A8D9D3] hover:border-[#4DA8B0] transition-all shadow-sm hover:shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-[#3d8a92] to-[#4DA8B0] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Protects Children</h3>
                <p className="text-gray-700 leading-relaxed">
                  Keep your children safe from parental conflict with child-focused communication
                </p>
              </div>

              {/* Value Prop 3 */}
              <div className="bg-gradient-to-br from-[#C0E9E3] to-white rounded-3xl p-8 border-2 border-[#8BCAC1] hover:border-[#4DA8B0] transition-all shadow-sm hover:shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2d6d75] to-[#3d8a92] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Promotes Collaboration</h3>
                <p className="text-gray-700 leading-relaxed">
                  Smart tools help you solve problems together, not against each other
                </p>
              </div>

              {/* Value Prop 4 */}
              <div className="bg-gradient-to-br from-[#A8D9D3] to-white rounded-3xl p-8 border-2 border-[#6EBBB0] hover:border-[#4DA8B0] transition-all shadow-sm hover:shadow-lg">
                <div className="w-14 h-14 bg-gradient-to-br from-[#1f4447] to-[#275559] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Educational Support</h3>
                <p className="text-gray-700 leading-relaxed">
                  Learn about child psychology and healthy communication patterns that work
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mt-20">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all shadow-sm hover:shadow-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#E6F7F5] to-[#C5E8E4] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#275559] mb-3">AI-Mediated Chat</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time message filtering and tone adjustment to keep conversations respectful and child-focused
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-gray-100 hover:border-[#A8D9D3] transition-all shadow-sm hover:shadow-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4F0EC] to-[#A8D9D3] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#275559] mb-3">Smart Task Manager</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize schedules, custody arrangements, and shared responsibilities in one place
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-gray-100 hover:border-[#8BCAC1] transition-all shadow-sm hover:shadow-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#C0E9E3] to-[#8BCAC1] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#275559] mb-3">Contact Hub</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep track of teachers, doctors, and everyone important in your child's life
              </p>
            </div>
          </div>

          {/* Parallel Parenting / Emotional Toll Section - NEW */}
          <div className="mt-32 mb-24 bg-gradient-to-br from-[#275559] to-[#3d8a92] rounded-3xl p-8 sm:p-12 text-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-center">
                Stuck in Parallel Parenting? You're Not Alone.
              </h2>
              <p className="text-xl text-white/90 mb-8 text-center max-w-2xl mx-auto">
                You didn't want it this way. You wanted to co-parent as a team. But here you are—limiting contact just to protect your sanity.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="font-bold text-lg mb-4">You Know This Feeling:</h3>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-start gap-3">
                      <span>•</span>
                      <span>That split-second dread when you see their name on your phone</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>•</span>
                      <span>Walking on eggshells with every word, knowing anything can explode</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>•</span>
                      <span>Feeling triggered and hating yourself for reacting</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>•</span>
                      <span>Lying awake replaying conversations, crafting perfect responses you'll never send</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="font-bold text-lg mb-4">What You Actually Need:</h3>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-start gap-3">
                      <span>✓</span>
                      <span>A buffer between you and the chaos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>✓</span>
                      <span>Help staying calm when they know exactly how to push your buttons</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>✓</span>
                      <span>Messages that say what you mean without handing them ammunition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span>✓</span>
                      <span>To stop feeling crazy, overwhelmed, and alone in this</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <p className="text-lg font-semibold mb-2">
                  "I don't need a perfect co-parent. I just need peace, consistency, and the strength to raise my child with love—even when the drama tries to step in."
                </p>
                <p className="text-sm text-white/80">— Co-parent, Facebook support group</p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-32 mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4 text-center">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              Getting started is simple. Three steps to healthier co-parenting.
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E6F7F5] to-[#C5E8E4] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                  <span className="text-3xl font-bold text-[#275559]">1</span>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Create Your Account</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sign up in seconds. No credit card required. Your data is encrypted and secure.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#C5E8E4] to-[#A8D9D3] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                  <span className="text-3xl font-bold text-[#275559]">2</span>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Invite Your Co-Parent</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share a simple invite link. Both parents communicate on equal footing.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#A8D9D3] to-[#8BCAC1] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                  <span className="text-3xl font-bold text-[#275559]">3</span>
                </div>
                <h3 className="text-xl font-bold text-[#275559] mb-3">Communicate Peacefully</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI helps you find common ground, meet in the middle, and keep conversations productive.
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof Section - Beta Community */}
          <div className="mt-32 mb-24" data-section="social_proof">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4">
                Join Our Growing Beta Community
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Be part of building the future of respectful co-parenting communication
              </p>
            </div>

            {/* Beta Benefits */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
              <div className="bg-white rounded-2xl p-6 border-2 border-[#C5E8E4] text-center shadow-sm">
                <div className="text-4xl mb-3">🎯</div>
                <div className="font-semibold text-[#275559] mb-2">Early Access</div>
                <div className="text-sm text-gray-600">Be among the first to experience real-time AI mediation</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#C5E8E4] text-center shadow-sm">
                <div className="text-4xl mb-3">💡</div>
                <div className="font-semibold text-[#275559] mb-2">Shape the Future</div>
                <div className="text-sm text-gray-600">Your feedback directly influences how we build LiaiZen</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-[#C5E8E4] text-center shadow-sm">
                <div className="text-4xl mb-3">🎁</div>
                <div className="font-semibold text-[#275559] mb-2">Free Forever Access</div>
                <div className="text-sm text-gray-600">Beta testers get special lifetime benefits</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-32 mb-24 bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4]" data-section="testimonials">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4 text-center">
              What Professionals Are Saying
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              Early feedback from family professionals and co-parents
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C5E8E4]">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "This is an effective tool that family lawyers would welcome. As a family mediator for over 17 years, I think it is a great idea."
                </p>
                <p className="text-sm font-semibold text-[#275559]">— Family Mediator</p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C5E8E4]">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "For our family, I could see this helping us adapt better to change. I think it's a great idea not only for my family, but for situations at work."
                </p>
                <p className="text-sm font-semibold text-[#275559]">— Divorced Mom</p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C5E8E4]">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "I regularly see the impact of divorce on children who go to my school. An app like this would be extremely helpful for the parents and children."
                </p>
                <p className="text-sm font-semibold text-[#275559]">— Minister & School Director</p>
              </div>

              {/* Testimonial 4 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#C5E8E4]">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-5 h-5 text-[#4DA8B0]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 italic">
                  "Our biggest challenge is being on the same page about how our children should be raised. I could see this being helpful to find a middle ground."
                </p>
                <p className="text-sm font-semibold text-[#275559]">— Divorced Mom</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-32 mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4 text-center">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl mx-auto">
              Everything you need to know about getting started
            </p>
            <div className="max-w-3xl mx-auto space-y-4">
              {/* FAQ 1 */}
              <details
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all"
                onToggle={(e) => {
                  if (e.target.open) {
                    trackFAQExpand('Is my information private and secure?');
                  }
                }}
              >
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  Is my information private and secure?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Absolutely. All communications are end-to-end encrypted, and we follow privacy-first design principles. Your data is never sold or shared with third parties. We take your family's privacy seriously.
                </p>
              </details>

              {/* FAQ 2 */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  What if my co-parent doesn't want to use it?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  LiaiZen works best when both parents participate, but you can still use features like task management, calendar organization, and contact management on your own. The platform is designed to make collaboration so easy that your co-parent may want to join once they see the benefits.
                </p>
              </details>

              {/* FAQ 3 */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  How does the AI mediation work?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Our AI helps by suggesting alternative phrasing for messages that might escalate conflict, providing neutral perspectives, and keeping conversations focused on children's well-being. It's designed to help both parents communicate respectfully and find common ground - no one is wrong, we treat everyone equal.
                </p>
              </details>

              {/* FAQ 4 */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  Is this really free during beta?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Yes! Beta access is completely free with no credit card required. We're looking for families to help us test and improve LiaiZen. Your feedback is invaluable as we build the best co-parenting platform possible.
                </p>
              </details>

              {/* FAQ 5 */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  Can this be used for legal purposes?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  LiaiZen helps you communicate better and stay organized, which can support your co-parenting journey. While we provide tools that help document conversations and agreements, we recommend consulting with a legal professional for specific legal advice.
                </p>
              </details>

              {/* FAQ 6 */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  What happens after the beta period?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Beta testers will receive special pricing and early access to new features as a thank you for helping us improve. We'll notify you well in advance of any changes, and your data will always remain secure and accessible.
                </p>
              </details>

              {/* FAQ 7 - Beta Specific */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  How do I join the beta program?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Simply click "Start Free Beta Access" above and create your account. Beta access is completely free with no credit card required. You'll get full access to all features and can provide feedback to help us improve.
                </p>
              </details>

              {/* FAQ 8 - Beta Specific */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  Is the beta program really free?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  Yes! Beta access is 100% free with no credit card required. We're looking for families to help us test and improve LiaiZen. Your feedback is invaluable, and beta testers will receive special benefits when we launch publicly.
                </p>
              </details>

              {/* FAQ 9 - Beta Specific */}
              <details className="bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#C5E8E4] transition-all">
                <summary className="font-semibold text-lg text-[#275559] cursor-pointer">
                  What if I find bugs or have suggestions?
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We love feedback! As a beta tester, you'll have direct access to our team. You can report issues, suggest improvements, and help shape the future of LiaiZen. Your input directly influences what features we build next.
                </p>
              </details>
            </div>
          </div>

          {/* Co-Parenting Tips Section */}
          <div className="mt-32 mb-24 bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4]">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4 text-center">
              Co-Parenting Principles We Stand By
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl mx-auto">
              Our approach is built on mutual respect, equality, and prevention
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Tip 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#4DA8B0] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#275559] mb-2">No One Is Wrong</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Both parents have valid perspectives. We help you understand each other's viewpoints and find solutions that work for everyone.
                  </p>
                </div>
              </div>

              {/* Tip 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#4DA8B0] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#275559] mb-2">Treat Everyone Equal</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Fair communication means both parents have an equal voice. Our platform ensures balanced, respectful dialogue.
                  </p>
                </div>
              </div>

              {/* Tip 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#4DA8B0] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#275559] mb-2">Meet in the Middle</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Compromise isn't losing - it's winning together. We help you find common ground that puts your children first.
                  </p>
                </div>
              </div>

              {/* Tip 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-[#4DA8B0] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#275559] mb-2">Preventative Approach</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Stop conflicts before they start. Our AI helps you communicate in ways that prevent escalation and protect your family.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-32 mb-24">
            <div className="max-w-2xl mx-auto text-center bg-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4] shadow-sm">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4">
                Stay Updated
              </h2>
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
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-[#4DA8B0] focus:outline-none text-lg"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#4DA8B0] text-white rounded-xl font-semibold text-lg hover:bg-[#3d8a92] transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
              {newsletterSubmitted && (
                <p className="mt-4 text-[#4DA8B0] font-semibold">
                  ✓ Thank you for subscribing!
                </p>
              )}
            </div>
          </div>

          {/* Product Preview Section */}
          <div className="mt-32 mb-24" data-section="product_preview">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4">
                See LiaiZen in Action
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience how AI mediation helps you communicate more effectively
              </p>
            </div>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4]">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-[#275559] mb-4">
                    Real-Time AI Mediation
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>AI analyzes messages before sending to prevent conflict</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Get helpful rewrite suggestions that keep conversations respectful</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Track tasks, contacts, and schedules all in one place</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-[#4DA8B0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>End-to-end encryption keeps your conversations private</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 border-2 border-[#C5E8E4] shadow-lg">
                  <div className="space-y-4">
                    <div className="bg-[#275559] text-white rounded-xl p-4">
                      <div className="text-xs opacity-75 mb-1">You</div>
                      <div className="text-sm">Can you pick up the kids tomorrow?</div>
                    </div>
                    <div className="bg-gray-100 rounded-xl p-4">
                      <div className="text-xs text-gray-600 mb-1">Co-Parent</div>
                      <div className="text-sm text-gray-800">Sure, what time works for you?</div>
                    </div>
                    <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4">
                      <div className="text-xs text-teal-700 font-semibold mb-1">💡 AI Suggestion</div>
                      <div className="text-sm text-teal-800">This conversation is respectful and child-focused. Great communication!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-24 text-center bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4] relative overflow-hidden" data-section="final_cta">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4DA8B0] opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#275559] opacity-5 rounded-full -ml-32 -mb-32"></div>
            <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4">
              Ready to Transform Your Co-Parenting?
            </h2>
              <p className="text-xl text-gray-700 mb-2 max-w-2xl mx-auto">
              Join beta families who are finding peace and clarity through LiaiZen
            </p>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                Limited beta spots available. Start your free account today—no credit card required.
              </p>
            <button
                onClick={() => {
                  trackCTAClick('final_cta', 'Start Free Beta Access Now', 'bottom');
                  onGetStarted();
                }}
                className="px-12 py-6 bg-gradient-to-r from-[#4DA8B0] to-[#3d8a92] text-white rounded-2xl font-bold text-xl hover:from-[#3d8a92] hover:to-[#2d6d75] transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform mb-4"
            >
                Start Free Beta Access Now
            </button>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Set up in 2 minutes</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free forever for beta testers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Intent Modal */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200 animate-fadeIn">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center">
                  <span className="text-xl">🎁</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Wait! Join Our Beta Program
                </h3>
              </div>
              <button
                onClick={() => setShowExitIntent(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-4">
                Get free beta access to LiaiZen—the AI-powered platform that helps co-parents communicate peacefully. No credit card required.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Integrate with beta waitlist service
                  console.log('Beta waitlist signup:', exitIntentEmail);
                  trackFormSubmit('exit_intent', 'beta_waitlist');
                  trackConversion('exit_intent_modal', 'email');
                  setExitIntentEmail('');
                  setShowExitIntent(false);
                  setNewsletterSubmitted(true);
                  setTimeout(() => setNewsletterSubmitted(false), 3000);
                }}
                className="space-y-3"
              >
                <input
                  type="email"
                  value={exitIntentEmail}
                  onChange={(e) => setExitIntentEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-[#275559] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#1f4447] transition-colors shadow-sm"
                >
                  Join Beta Program
                </button>
              </form>
              <p className="mt-3 text-xs text-gray-500 text-center">
                We'll send you beta access details via email
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#275559] to-[#4DA8B0] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Sign In
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSignInModal(false);
                  setAuthError('');
                  setAuthEmail('');
                  setPassword('');
                }}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSignInSubmit} className="px-6 py-5">
              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-sm"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#275559] text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1 bg-[#275559] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#1f4447] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignInModal(false);
                    setAuthError('');
                    setAuthEmail('');
                    setPassword('');
                    onGetStarted();
                  }}
                  className="px-4 py-3 rounded-xl border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  New Account
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500 text-center">
                Don't have an account? Click "New Account" to sign up.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/assets/TransB.svg"
                alt="@TransB"
                className="h-8 w-auto"
              />
              <img
                src="/assets/LZlogo.svg"
                alt="LiaiZen"
                className="h-10 w-auto"
              />
            </div>

            {/* Links */}
            <div className="flex gap-6 text-sm">
              <a href="/privacy.html" className="text-gray-600 hover:text-[#4DA8B0] transition-colors">
                Privacy Policy
              </a>
              <a href="/terms.html" className="text-gray-600 hover:text-[#4DA8B0] transition-colors">
                Terms of Service
              </a>
              <a href="/contact.html" className="text-gray-600 hover:text-[#4DA8B0] transition-colors">
                Contact Us
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 text-center text-gray-600 text-sm">
            <p>&copy; 2025 LiaiZen. Making co-parenting peaceful, one conversation at a time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
