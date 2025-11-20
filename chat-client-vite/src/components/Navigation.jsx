import React from 'react';

export function Navigation({ currentView, setCurrentView, onLogout, unreadCount = 0 }) {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
  ];

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRefs = React.useRef([]);
  const menuButtonRef = React.useRef(null);
  const menuItemRefs = React.useRef([]);

  const menuItems = [
    {
      id: 'contacts',
      label: 'Contacts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => {
        setCurrentView('contacts');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => {
        setCurrentView('profile');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => {
        setCurrentView('settings');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'account',
      label: 'Account',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      action: () => {
        setCurrentView('account');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'divider',
      label: '',
      isDivider: true,
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      isDanger: true,
      action: () => {
        if (typeof onLogout === 'function') {
          onLogout();
        }
        setIsMenuOpen(false);
      },
    },
  ];

  // Close menu on outside click
  React.useEffect(() => {
    const handleClick = (event) => {
      if (!isMenuOpen) return;
      const clickedInside = menuRefs.current.some((ref) => ref && ref.contains(event.target));
      if (!clickedInside) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  // Keyboard navigation for menu
  React.useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = menuItemRefs.current.findIndex(
          (ref) => ref === document.activeElement
        );
        const items = menuItems.filter(item => !item.isDivider);
        let nextIndex;

        if (event.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }

        const nextItem = menuItemRefs.current.find(
          (ref, idx) => ref && idx === nextIndex
        );
        nextItem?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, menuItems]);

  const renderMenuButton = (refIndex, options = {}) => {
    const { extraClasses = '', placement = 'bottom' } = options;
    const menuPositionClass =
      placement === 'top'
        ? 'bottom-14 right-0 mb-2'
        : 'right-0 mt-2';
    const isMobile = extraClasses === '';

    return (
      <div
        ref={(node) => {
          menuRefs.current[refIndex] = node;
        }}
        className={`relative ${extraClasses}`}
      >
        <button
          ref={refIndex === 0 ? menuButtonRef : null}
          type="button"
          onClick={(e) => {
            console.log('[Navigation] Menu button clicked, current state:', isMenuOpen);
            e.stopPropagation();
            setIsMenuOpen((prev) => {
              console.log('[Navigation] Toggling menu from', prev, 'to', !prev);
              return !prev;
            });
          }}
          onTouchStart={() => console.log('[Navigation] Menu button touched')}
          className={`rounded-lg bg-white border-2 cursor-pointer touch-manipulation ${
            isMenuOpen
              ? 'border-[#4DA8B0] shadow-md'
              : 'border-[#C5E8E4] shadow-sm hover:border-[#4DA8B0] hover:shadow-md active:shadow-lg'
          } flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
            isMobile ? 'w-8 h-8' : 'w-10 h-10'
          }`}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="Open menu"
        >
          <div className={`rounded flex items-center justify-center transition-transform duration-200 ${
            isMenuOpen ? 'rotate-90' : ''
          } ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`}>
              <img
              src="/assets/TransB.svg"
                alt="LiaiZen menu"
              className={`object-contain ${
                isMobile ? 'w-4 h-4' : 'w-5 h-5'
              }`}
              />
          </div>
        </button>
        {isMenuOpen && (
          <div
            className={`absolute ${menuPositionClass} w-52 rounded-xl border-2 border-[#C5E8E4] bg-white shadow-xl py-2 z-[10000] transition-all duration-200 ease-out opacity-100`}
            role="menu"
            aria-label="User menu"
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
            onTouchStart={() => console.log('[Navigation] Menu touched')}
          >
            {menuItems.map((item, index) => {
              if (item.isDivider) {
                return (
                  <div
                    key={item.id}
                    className="h-px bg-[#E6F7F5] my-1.5 mx-2"
                    role="separator"
                  />
                );
              }

              const isActive = currentView === item.id;
              const isDanger = item.isDanger;

              return (
              <button
                key={item.id}
                  ref={(node) => {
                    if (node && !item.isDivider) {
                      menuItemRefs.current[index] = node;
                    }
                  }}
                type="button"
                onClick={(e) => {
                  console.log('[Navigation] Menu item clicked:', item.label);
                  e.stopPropagation();
                  if (item.action) {
                    console.log('[Navigation] Executing action for:', item.label);
                    item.action();
                  } else {
                    console.warn('[Navigation] No action defined for:', item.label);
                  }
                }}
                onTouchStart={() => console.log('[Navigation] Menu item touched:', item.label)}
                onTouchEnd={() => console.log('[Navigation] Menu item touch ended:', item.label)}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer touch-manipulation select-none ${
                    isDanger
                      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100'
                      : `text-[#275559] hover:bg-[#E6F7F5] focus:bg-[#E6F7F5] active:bg-[#C5E8E4] ${
                          isActive ? 'bg-[#E6F7F5] font-semibold' : ''
                        }`
                  } focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-inset`}
                role="menuitem"
                  tabIndex={0}
                >
                  <span className={`flex-shrink-0 ${
                    isDanger ? 'text-red-600' : 'text-[#4DA8B0]'
                  }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && !isDanger && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4DA8B0]" />
                  )}
              </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#C5E8E4] shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <img
                src="/assets/LZlogo.svg"
                alt="LiaiZen"
                className="logo-image h-9 w-auto transition-opacity hover:opacity-80"
              />
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-3">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
                      isActive
                        ? 'bg-[#275559] text-white shadow-md'
                        : 'text-[#275559] hover:bg-[#E6F7F5] hover:text-[#275559] hover:shadow-sm'
                  }`}
                    aria-current={isActive ? 'page' : undefined}
                >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#4DA8B0]'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {/* Unread count badge for chat */}
                    {item.id === 'chat' && unreadCount > 0 && (
                      <span className="min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </button>
                );
              })}
              {renderMenuButton(0)}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-[#C5E8E4] shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2 pb-safe">
          {navItems.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 min-w-[60px] px-2 py-1.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
                  isActive
                    ? 'bg-[#E6F7F5] text-[#275559]'
                    : 'text-slate-500 active:bg-[#E6F7F5] active:text-[#275559]'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon container with consistent sizing */}
                <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#275559] text-white scale-105'
                    : 'bg-[#E6F7F5] text-[#4DA8B0]'
                }`}>
                  <span className={`text-base ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  {/* Unread count badge for chat */}
                  {item.id === 'chat' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4DA8B0] rounded-full border-2 border-white" />
                  )}
                </div>
                {/* Label - always visible */}
                <span className={`text-[10px] font-semibold leading-tight transition-all duration-200 ${
                  isActive 
                    ? 'text-[#275559] font-bold' 
                    : 'text-slate-500'
                }`}>
                  {item.label}
                </span>
                {/* Bottom active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#275559] rounded-t-full" />
                )}
              </button>
            );
          })}
          {/* Menu button - consistent styling */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`relative flex flex-col items-center justify-center gap-1 min-w-[60px] px-2 py-1.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
              isMenuOpen
                ? 'bg-[#E6F7F5] text-[#275559]'
                : 'text-slate-500 active:bg-[#E6F7F5] active:text-[#275559]'
            }`}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            {/* Icon container matching nav items */}
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              isMenuOpen
                ? 'bg-[#275559] text-white scale-105'
                : 'bg-[#E6F7F5] text-[#4DA8B0]'
            }`}>
              <img
                src="/assets/TransB.svg"
                alt="Menu"
                className="w-5 h-5 object-contain"
              />
              {isMenuOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#4DA8B0] rounded-full border-2 border-white" />
              )}
            </div>
            {/* Label */}
            <span className={`text-[10px] font-semibold leading-tight transition-all duration-200 ${
              isMenuOpen 
                ? 'text-[#275559] font-bold' 
                : 'text-slate-500'
            }`}>
              More
            </span>
            {/* Bottom indicator when menu is open */}
            {isMenuOpen && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-[#275559] rounded-t-full" />
            )}
          </button>
          {/* Menu dropdown - positioned above */}
          {isMenuOpen && (
            <div
              className="absolute bottom-20 right-2 w-52 rounded-xl border-2 border-[#C5E8E4] bg-white shadow-xl py-2 z-[10000] transition-all duration-200 ease-out opacity-100"
              role="menu"
              aria-label="User menu"
              style={{
                animation: 'fadeIn 0.2s ease-out',
              }}
              onTouchStart={() => console.log('[Navigation MOBILE] Menu touched')}
            >
              {menuItems.map((item, index) => {
                if (item.isDivider) {
                  return (
                    <div
                      key={item.id}
                      className="h-px bg-[#E6F7F5] my-1.5 mx-2"
                      role="separator"
                    />
                  );
                }

                const isActive = currentView === item.id;
                const isDanger = item.isDanger;

                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      if (node && !item.isDivider) {
                        menuItemRefs.current[index] = node;
                      }
                    }}
                    type="button"
                    onClick={(e) => {
                      console.log('[Navigation MOBILE] Menu item clicked:', item.label);
                      e.stopPropagation();
                      if (item.action) {
                        console.log('[Navigation MOBILE] Executing action for:', item.label);
                        item.action();
                      } else {
                        console.warn('[Navigation MOBILE] No action defined for:', item.label);
                      }
                    }}
                    onTouchStart={() => console.log('[Navigation MOBILE] Menu item touched:', item.label)}
                    onTouchEnd={() => console.log('[Navigation MOBILE] Menu item touch ended:', item.label)}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer touch-manipulation select-none ${
                      isDanger
                        ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100'
                        : `text-[#275559] hover:bg-[#E6F7F5] focus:bg-[#E6F7F5] active:bg-[#C5E8E4] ${
                            isActive ? 'bg-[#E6F7F5] font-semibold' : ''
                          }`
                    } focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-inset`}
                    role="menuitem"
                    tabIndex={0}
                  >
                    <span className={`flex-shrink-0 ${
                      isDanger ? 'text-red-600' : 'text-[#4DA8B0]'
                    }`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && !isDanger && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4DA8B0]" />
                    )}
                  </button>
                );
              })}
          </div>
          )}
        </div>
      </nav>
    </>
  );
}
