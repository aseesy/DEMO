import React from 'react';

export function Navigation({ currentView, setCurrentView, onLogout, unreadCount = 0, hasMeanMessage = false }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: '💬'
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
      icon: '👥',
      action: () => {
        setCurrentView('contacts');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      action: () => {
        setCurrentView('profile');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      action: () => {
        setCurrentView('settings');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'account',
      label: 'Account',
      icon: '💳',
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
      icon: '🚪',
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
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          className={`rounded-lg bg-white border-2 cursor-pointer touch-manipulation ${
            isMenuOpen
              ? 'border-[#4DA8B0] shadow-md'
              : 'border-gray-200 shadow-sm hover:border-[#4DA8B0] hover:shadow-md active:shadow-lg'
          } flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
            isMobile ? 'w-8 h-8' : 'w-10 h-10'
          }`}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="Open menu"
        >
          <div className={`rounded flex items-center justify-center transition-transform duration-200 ${
            isMenuOpen ? 'rotate-90' : ''
          }`}>
              <img
              src="/assets/TransB.svg"
                alt="LiaiZen menu"
              className={`object-contain ${
                isMobile ? 'w-6 h-6' : 'w-6 h-6'
              }`}
              />
          </div>
        </button>
        {isMenuOpen && (
          <div
            className={`absolute ${menuPositionClass} w-52 rounded-xl border-2 border-gray-200 bg-white shadow-xl py-2 z-50 transition-all duration-200 ease-out opacity-100`}
            role="menu"
            aria-label="User menu"
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {menuItems.map((item, index) => {
              if (item.isDivider) {
                return (
                  <div
                    key={item.id}
                    className="h-px bg-gray-50 my-1.5 mx-2"
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
                  e.stopPropagation();
                  if (item.action) {
                    item.action();
                  }
                }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer touch-manipulation select-none ${
                    isDanger
                      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100'
                      : `text-[#4DA8B0] hover:bg-gray-50 focus:bg-gray-50 active:bg-gray-100 ${
                          isActive ? 'bg-gray-50 font-semibold' : ''
                        }`
                  } focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-inset`}
                role="menuitem"
                  tabIndex={0}
                >
                  <span className="flex-shrink-0 text-base">
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
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <img
                src="/assets/LZlogo.svg"
                alt="LiaiZen"
                className="logo-image h-7 w-auto transition-opacity hover:opacity-80"
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
                        ? 'bg-[#E6F7F5] text-[#4DA8B0] shadow-md border-2 border-[#C5E8E4]'
                        : 'text-[#4DA8B0] hover:bg-[#E6F7F5] hover:text-[#4DA8B0] hover:shadow-sm'
                  }`}
                    aria-current={isActive ? 'page' : undefined}
                >
                    <span className="flex-shrink-0 text-2xl">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg safe-area-inset-bottom" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-around h-12 px-2 py-1">
          {/* Dashboard button */}
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={`relative flex items-center justify-center w-14 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
              currentView === 'dashboard'
                ? 'bg-[#E6F7F5] text-[#4DA8B0] border-2 border-[#C5E8E4]'
                : 'text-[#4DA8B0] active:bg-[#E6F7F5]'
            }`}
            aria-label="Dashboard"
            aria-current={currentView === 'dashboard' ? 'page' : undefined}
          >
            <span className="text-xl">
              {navItems[0].icon}
            </span>
          </button>

          {/* Menu button - in the middle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`relative flex items-center justify-center w-14 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
              isMenuOpen
                ? 'bg-[#E6F7F5] text-[#4DA8B0] border-2 border-[#C5E8E4]'
                : 'text-[#4DA8B0] active:bg-[#E6F7F5]'
            }`}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <img
              src="/assets/TransB.svg"
              alt="Menu"
              className="w-6 h-6 object-contain"
            />
          </button>

          {/* Chat button */}
          <button
            type="button"
            onClick={() => setCurrentView('chat')}
            className={`relative flex items-center justify-center w-14 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 ${
              currentView === 'chat'
                ? 'bg-[#E6F7F5] text-[#4DA8B0] border-2 border-[#C5E8E4]'
                : 'text-[#4DA8B0] active:bg-[#E6F7F5]'
            }`}
            aria-label="Chat"
            aria-current={currentView === 'chat' ? 'page' : undefined}
          >
            <span className="text-xl">
              {navItems[1].icon}
            </span>
            {/* Unread count badge for chat */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {/* Menu dropdown - positioned above */}
          {isMenuOpen && (
            <div
              ref={(node) => {
                if (node) {
                  menuRefs.current[1] = node; // Register mobile dropdown in refs array
                }
              }}
              className="absolute bottom-14 right-2 w-52 rounded-xl border-2 border-gray-200 bg-white shadow-xl py-2 z-50 transition-all duration-200 ease-out opacity-100"
              role="menu"
              aria-label="User menu"
              style={{
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {menuItems.map((item, index) => {
                if (item.isDivider) {
                  return (
                    <div
                      key={item.id}
                      className="h-px bg-gray-50 my-1.5 mx-2"
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
                    onClick={item.action}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 ${
                      isDanger
                        ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                        : `text-[#4DA8B0] hover:bg-gray-50 focus:bg-gray-50 ${
                            isActive ? 'bg-gray-50 font-semibold' : ''
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
