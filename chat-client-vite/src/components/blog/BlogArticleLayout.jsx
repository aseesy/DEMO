import React, { useState, useEffect } from 'react';
import { Button } from '../ui';

export function BlogArticleLayout({ children, meta, breadcrumbs, keyTakeaways, ctaOverride }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Default metadata
  const {
    title,
    subtitle,
    date = 'Dec 10, 2025',
    readTime = '5 min read',
    author = 'LiaiZen Team',
  } = meta || {};

  // Scroll Progress & Smart Navbar Logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${totalScroll / windowHeight}`;
      setScrollProgress(Number(scroll));

      // Smart Nav Logic
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNav(false); // Hide on scroll down
      } else {
        setShowNav(true); // Show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-dvh bg-white font-sans text-gray-900 selection:bg-teal-100 selection:text-teal-900 pb-nav-mobile overflow-y-auto">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-teal-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Smart Navigation */}
      <nav
        className={`fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40 transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <img
              src="/assets/Logo.svg"
              alt="LiaiZen"
              className="h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/co-parenting-communication"
              className="hidden sm:block text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors"
            >
              All Articles
            </a>
            <Button
              variant="teal-solid"
              size="small"
              onClick={() => (window.location.href = '/')}
              className="rounded-full px-4"
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </nav>

      {/* Article Header */}
      <header className="bg-gradient-to-b from-teal-50/50 to-white pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
            <a href="/" className="hover:text-teal-600 transition-colors">
              Home
            </a>
            <span className="text-gray-300">/</span>
            {breadcrumbs &&
              breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-teal-600 transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-teal-700 font-medium">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
                </React.Fragment>
              ))}
          </nav>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {title}
          </h1>

          {subtitle && <p className="text-xl text-gray-600 mb-8 leading-relaxed">{subtitle}</p>}

          <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                LZ
              </div>
              <span className="font-medium text-gray-900">{author}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span>{date}</span>
            <span className="text-gray-300">•</span>
            <span>{readTime}</span>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      {meta.heroImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8 relative z-10">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-gray-100/50">
            <img
              src={meta.heroImage}
              alt={meta.heroImageAlt || meta.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Takeaways Box */}
        {keyTakeaways && (
          <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6 mb-12">
            <h3 className="text-teal-800 font-bold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Key Takeaways
            </h3>
            <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
              {keyTakeaways.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-teal-400 mt-1.5">•</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Prose */}
        <article className="prose prose-lg prose-teal mx-auto prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-8 prose-li:text-gray-600">
          {children}
        </article>

        {/* Engagement Box / CTA */}
        {ctaOverride ? (
          ctaOverride
        ) : (
          <div className="my-16 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase mb-4 text-teal-50 border border-white/20">
                Early Access
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Ready to break the cycle?</h3>
              <p className="text-lg text-teal-100 mb-8 max-w-xl mx-auto leading-relaxed">
                LiaiZen gives you the real-time guidance you need to change your co-parenting
                dynamic—one message at a time.
              </p>
              <Button
                variant="white"
                size="large"
                className="font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all w-full sm:w-auto text-teal-700 hover:text-teal-800"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Join the Waitlist
              </Button>
              <p className="mt-4 text-xs text-teal-200 opacity-80">
                Free for early beta users. No credit card required.
              </p>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <img
            src="/assets/Logo.svg"
            alt="LiaiZen"
            className="h-6 mb-8 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500"
          />
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500 mb-8">
            <a href="/co-parenting-communication" className="hover:text-teal-600 transition-colors">
              Communication
            </a>
            <a href="/high-conflict-co-parenting" className="hover:text-teal-600 transition-colors">
              High Conflict
            </a>
            <a
              href="/child-centered-co-parenting"
              className="hover:text-teal-600 transition-colors"
            >
              Child-Centered
            </a>
            <a href="/liaizen-ai-co-parenting" className="hover:text-teal-600 transition-colors">
              LiaiZen AI
            </a>
          </div>
          <p className="text-gray-400 text-sm">&copy; 2025 LiaiZen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
