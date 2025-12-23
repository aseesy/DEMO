import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../../../apiClient.js';
import {
  trackConversion,
  trackFormSubmit,
  trackScrollDepth,
  trackSectionView,
} from '../../../utils/analytics.js';

/**
 * useLandingPageState - Centralized state management for landing page
 * Handles waitlist, user stats, scroll tracking, and form submissions
 */
export function useLandingPageState() {
  // Stats state
  const [familiesHelped, setFamiliesHelped] = useState(null);

  // UI state
  const [showStickyMobileCTA, setShowStickyMobileCTA] = useState(false);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  const heroFormRef = useRef(null);

  // Scroll tracking for sections + sticky mobile CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

      // Show sticky CTA after scrolling past the hero form
      if (heroFormRef.current) {
        const rect = heroFormRef.current.getBoundingClientRect();
        setShowStickyMobileCTA(rect.bottom < 0);
      } else {
        setShowStickyMobileCTA(scrollTop > 600);
      }

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
  // Uses requestAnimationFrame to ensure DOM is painted before observing
  useEffect(() => {
    let observer = null;
    let animationFrameId = null;

    const setupObserver = () => {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3,
      };

      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
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

      const sections = document.querySelectorAll('[data-section]');
      sections.forEach(section => observer.observe(section));

      const animateElements = document.querySelectorAll('[data-animate="fade-in"]');
      animateElements.forEach(element => observer.observe(element));
    };

    // Wait for next frame to ensure child components have mounted
    animationFrameId = requestAnimationFrame(() => {
      // Double RAF ensures DOM is fully painted
      animationFrameId = requestAnimationFrame(setupObserver);
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  // Fetch user count to calculate families helped
  useEffect(() => {
    async function getUserCount() {
      try {
        const response = await apiGet('/api/stats/user-count');
        if (response.ok) {
          const data = await response.json();
          const userCount = data.count || 0;
          setFamiliesHelped(userCount > 0 ? userCount : 47);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
        setFamiliesHelped(47);
      }
    }

    getUserCount();
    const interval = setInterval(getUserCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = async (e, source = 'hero') => {
    e.preventDefault();
    setWaitlistError('');
    setWaitlistSubmitting(true);

    const emailToSubmit = waitlistEmail.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToSubmit || !emailRegex.test(emailToSubmit)) {
      setWaitlistError('Please enter a valid email address');
      setWaitlistSubmitting(false);
      return;
    }

    try {
      const response = await apiPost('/api/waitlist', {
        email: emailToSubmit,
        source: source,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setWaitlistSuccess(true);
        setWaitlistEmail('');
        trackConversion('waitlist', source);
        trackFormSubmit('waitlist', 'email');
      } else {
        setWaitlistError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setWaitlistError('Unable to join waitlist. Please try again.');
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const scrollToWaitlistForm = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.querySelector('input[type="email"]')?.focus();
    }, 500);
  };

  return {
    // Stats
    familiesHelped,

    // UI
    showStickyMobileCTA,
    heroFormRef,

    // Waitlist
    waitlistEmail,
    setWaitlistEmail,
    waitlistSubmitting,
    waitlistSuccess,
    waitlistError,
    handleWaitlistSubmit,

    // Actions
    scrollToWaitlistForm,
  };
}

export default useLandingPageState;
