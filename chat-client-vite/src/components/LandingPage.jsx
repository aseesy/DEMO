import React from 'react';

export function LandingPage({ onGetStarted }) {
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

            {/* CTA Button */}
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#275559] text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-[#1f4447] transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#275559] mb-6 leading-tight">
              Co-Parenting Made
              <br />
              <span className="text-[#4DA8B0]">Peaceful & Simple</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform high-tension conversations into respectful dialogue with AI-powered mediation
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-[#4DA8B0] text-white rounded-2xl font-bold text-lg hover:bg-[#3d8a92] transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Start Your Journey
            </button>
          </div>

          {/* Value Proposition Section */}
          <div className="mt-24 mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-12 text-center">
              Why LiaiZen?
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

          {/* Final CTA */}
          <div className="mt-24 text-center bg-gradient-to-br from-[#E6F7F5] to-white rounded-3xl p-8 sm:p-12 border-2 border-[#C5E8E4]">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#275559] mb-4">
              Ready to Transform Your Co-Parenting?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Join thousands of parents who have found peace and clarity through LiaiZen
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-[#4DA8B0] text-white rounded-2xl font-bold text-xl hover:bg-[#3d8a92] transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-gray-600 text-sm">
          <p>&copy; 2025 LiaiZen. Making co-parenting peaceful, one conversation at a time.</p>
        </div>
      </footer>
    </div>
  );
}
