import React from 'react';

export function Navigation({ currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'contacts', label: 'Contacts', icon: '👥' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28 py-2">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <img
                src="/assets/TransB.png"
                alt="@TransB"
                className="logo-image"
                style={{ height: '96px', width: 'auto' }}
              />
              <img
                src="/assets/LZlogo.svg"
                alt="LiaiZen"
                className="logo-image"
                style={{ height: '104px', width: 'auto' }}
              />
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-[#275559] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl safe-area-inset-bottom">
        <div className="flex items-center justify-around h-20 px-2 pb-2">
          {navItems.map((item, index) => {
            const isCenter = index === 1; // Chat is center
            const isActive = currentView === item.id;
            
            if (isCenter) {
              // Prominent center button
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                  className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[#275559] text-white shadow-lg scale-110'
                      : 'bg-[#4DA8B0] text-white shadow-md'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                </button>
              );
            }
            
            // Regular side buttons
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                  isActive
                    ? 'text-[#275559]'
                    : 'text-slate-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-[#275559] rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

