import React from 'react';
import { Button } from './ui';

export function Navigation({ currentView, setCurrentView, onLogout, unreadCount = 0, hasMeanMessage = false, notificationCount = 0, onInvitationAccepted }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      action: () => {
        console.log('[Navigation] contacts action - calling setCurrentView("contacts")');
        setCurrentView('contacts');
        console.log('[Navigation] contacts action - calling setIsMenuOpen(false)');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      action: () => {
        console.log('[Navigation] profile action - calling setCurrentView("profile")');
        setCurrentView('profile');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      
      // Check if click is inside menu (including arch menu items)
      const clickedInside = menuRefs.current.some((ref) => ref && ref.contains(event.target));
      
      // Check if click is on a navigation button (Dashboard, Chat, Menu)
      const isNavButton = event.target.closest('nav[class*="md:hidden"]')?.querySelector('button[aria-label="Dashboard"], button[aria-label="Chat"], button[aria-label="Menu"]')?.contains(event.target);
      
      // Check if click is on an arch menu item button
      const isArchMenuItem = event.target.closest('button[role="menuitem"]');
      
      console.log('[Navigation] Outside click handler:', { clickedInside, isNavButton, isArchMenuItem, target: event.target.tagName });
      
      // Only close menu if click is outside menu AND not on a nav button AND not on arch menu item
      if (!clickedInside && !isNavButton && !isArchMenuItem) {
        setIsMenuOpen(false);
      }
    };

    // Use 'click' instead of 'mousedown' to allow menu item clicks to complete first
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
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
        ? 'bottom-14 left-0 mb-2'
        : 'left-0 mt-2';
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
              ? 'border-teal-medium shadow-md'
              : 'border-gray-200 shadow-sm hover:border-teal-medium hover:shadow-md active:shadow-lg'
          } flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2 ${
            isMobile ? 'w-11 h-11' : 'w-11 h-11'
          }`}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="Open menu"
        >
          <div className={`rounded flex items-center justify-center transition-transform duration-200 ${
            isMenuOpen ? 'rotate-90' : ''
          }`}>
              <img
              src="/assets/Logo.svg"
                alt="LiaiZen menu"
              className={`object-contain ${
                isMobile ? 'w-6 h-6' : 'w-6 h-6'
              }`}
              />
          </div>
        </button>
        {isMenuOpen && (
          <div
            className={`absolute ${menuPositionClass} w-52 rounded-xl border-2 border-gray-200 bg-white shadow-xl py-2 z-[100] transition-all duration-200 ease-out opacity-100`}
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
                  className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer touch-manipulation select-none min-h-[44px] ${
                    isDanger
                      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100'
                      : `text-teal-medium hover:bg-gray-50 focus:bg-gray-50 active:bg-gray-100 ${
                          isActive ? 'bg-gray-50 font-semibold' : ''
                        }`
                  } focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-inset`}
                role="menuitem"
                  tabIndex={0}
                >
                  <span className="flex-shrink-0">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && !isDanger && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-medium" />
                  )}
              </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Debug: log when Navigation renders
  console.log('[Navigation] Rendering, currentView:', currentView);

  return (
    <>
      {/* Top Navigation - Desktop Only */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <div className="flex items-center justify-end h-14">
            {/* Right side: Navigation Items + LiaiZen Branding with Dropdown Menu */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentView(item.id)}
                    className={`relative px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4DA8B0] focus:ring-offset-2 rounded-lg ${
                      isActive
                        ? 'text-[#275559] bg-[#f0f9f9]'
                        : 'text-gray-500 hover:text-[#275559] hover:bg-gray-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="flex-shrink-0 relative">
                      {React.cloneElement(item.icon, {
                        className: `w-4 h-4 ${isActive ? 'text-[#4DA8B0]' : ''}`
                      })}
                      {item.id === 'chat' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {item.id === 'dashboard' && notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {/* LiaiZen Branding with Dropdown Menu */}
              <div
                ref={(node) => { menuRefs.current[2] = node; }}
                className="relative ml-2 pl-2 border-l border-gray-200 z-[60]"
                style={{ isolation: 'isolate' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    console.log('[Navigation] Desktop menu toggle clicked, current state:', isMenuOpen);
                    setIsMenuOpen(!isMenuOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2"
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                >
                  <img
                    src="/assets/Logo.svg"
                    alt="LiaiZen"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-semibold text-[#275559]">
                    Li<span className="bg-gradient-to-r from-[#4DA8B0] to-[#46BD92] bg-clip-text text-transparent">ai</span>Zen
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border-2 border-gray-200 bg-white shadow-xl py-2 z-[9999] transition-all duration-200 ease-out opacity-100"
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
                            console.log('[Navigation] Desktop menu item clicked:', item.id, 'setCurrentView:', typeof setCurrentView);
                            e.stopPropagation();
                            if (item.action) {
                              console.log('[Navigation] Calling action for:', item.id);
                              item.action();
                              console.log('[Navigation] Action completed for:', item.id);
                            }
                          }}
                          className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer touch-manipulation select-none min-h-[44px] ${
                            isDanger
                              ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 active:bg-red-100'
                              : `text-teal-medium hover:bg-gray-50 focus:bg-gray-50 active:bg-gray-100 ${
                                  isActive ? 'bg-gray-50 font-semibold' : ''
                                }`
                          } focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-inset`}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <span className="flex-shrink-0">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                          {isActive && !isDanger && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-medium" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white shadow-[0_-2px_8px_-1px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        <div className="relative flex items-center justify-around h-11 px-2 py-0.5 z-10">
          {/* Dashboard button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Navigation] Dashboard button clicked');
              setIsMenuOpen(false);
              setCurrentView('dashboard');
            }}
            className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2 z-10 ${
              currentView === 'dashboard'
                ? 'bg-teal-lightest text-teal-medium border border-teal-light'
                : 'text-teal-medium active:bg-teal-lightest'
            }`}
            aria-label="Dashboard"
            aria-current={currentView === 'dashboard' ? 'page' : undefined}
          >
            <span className="flex-shrink-0 relative">
              {React.cloneElement(navItems[0].icon, { className: 'w-5 h-5' })}
              {/* Red dot indicator when notifications are unread */}
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm" />
              )}
            </span>
          </button>

          {/* LiaiZen Menu button - matches other buttons */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Navigation] Mobile menu button clicked, isMenuOpen:', isMenuOpen);
              setIsMenuOpen((prev) => !prev);
            }}
            className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2 z-10 ${
              isMenuOpen
                ? 'bg-teal-lightest text-teal-medium border border-teal-light'
                : 'text-teal-medium active:bg-teal-lightest'
            }`}
            aria-label="Menu"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <img
              src="/assets/Logo.svg"
              alt="LiaiZen menu"
              className="w-5 h-5 object-contain"
            />
          </button>

          {/* Chat button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[Navigation] Chat button clicked');
              setIsMenuOpen(false);
              setCurrentView('chat');
            }}
            className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2 z-10 ${
              currentView === 'chat'
                ? 'bg-teal-lightest text-teal-medium border border-teal-light'
                : 'text-teal-medium active:bg-teal-lightest'
            }`}
            aria-label="Chat"
            aria-current={currentView === 'chat' ? 'page' : undefined}
          >
            <span className="flex-shrink-0 relative">
              {React.cloneElement(navItems[1].icon, { className: 'w-5 h-5' })}
              {/* Red dot indicator when messages are unread */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm" />
              )}
            </span>
          </button>
          {/* Rainbow/Arch Menu - positioned above in arch pattern */}
          {isMenuOpen && (() => {
            console.log('[Navigation] Rendering mobile arch menu');
            // Filter out divider items for arch positioning
            const archItems = menuItems.filter(item => !item.isDivider);
            const totalItems = archItems.length;
            const radius = 90; // Distance from center button (arch height)
            const horizontalSpread = 140; // Horizontal spread in pixels
            const startAngle = Math.PI; // Start from left (180 degrees)
            const angleSpread = 0; // Horizontal arch (no vertical spread in angle)
            
            return (
              <div
                ref={(node) => {
                  if (node) {
                    menuRefs.current[1] = node; // Register mobile dropdown in refs array
                  }
                }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-[9999]"
                role="menu"
                aria-label="User menu"
                style={{
                  width: `${horizontalSpread * 2 + 80}px`,
                  height: `${radius + 60}px`,
                }}
              >
                {archItems.map((item, index) => {
                  // Calculate horizontal position (evenly distributed left to right, perfectly centered)
                  // Handle case when totalItems is 1 to avoid division by zero
                  const horizontalPosition = totalItems === 1 ? 0 : (index / (totalItems - 1)) * 2 - 1; // -1 to 1
                  
                  // Calculate vertical position using symmetrical arch/parabola formula
                  // Use absolute value to ensure perfect symmetry: archHeight = radius * (1 - |normalizedX|^2)
                  const normalizedX = horizontalPosition;
                  const absX = Math.abs(normalizedX); // Ensure symmetry
                  const archHeight = radius * (1 - absX * absX); // Perfectly symmetrical arch
                  
                  // Position relative to container center (container is centered via left-1/2 -translate-x-1/2)
                  // Center the arch perfectly: container center + horizontal offset - button half-width
                  const containerWidth = horizontalSpread * 2 + 80;
                  const containerCenterX = containerWidth / 2;
                  const finalX = containerCenterX + (horizontalPosition * horizontalSpread) - 24; // Center button (48px / 2 = 24)
                  const finalY = archHeight; // Distance from bottom (higher = further from bottom)
                  
                  // Calculate rotation - slight tilt based on position for natural look
                  const rotation = normalizedX * 15; // Tilt up to 15 degrees
                  
                  const isActive = currentView === item.id;
                  const isDanger = item.isDanger;
                  
                  // Animation delay for staggered appearance
                  const delay = index * 0.05;

                  return (
                    <button
                      key={item.id}
                      ref={(node) => {
                        if (node) {
                          // Find the original index in menuItems array (including dividers)
                          const originalIndex = menuItems.findIndex(mi => mi.id === item.id);
                          if (originalIndex !== -1) {
                            menuItemRefs.current[originalIndex] = node;
                          }
                        }
                      }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('[Navigation] Arch menu item clicked:', item.id, 'action:', typeof item.action);
                        if (item.action) {
                          item.action();
                        }
                      }}
                      className={`absolute w-12 h-12 rounded-full bg-white border-2 border-teal-light shadow-lg flex items-center justify-center transition-all duration-300 min-h-[44px] min-w-[44px] pointer-events-auto ${
                        isDanger
                          ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 border-red-300'
                          : `text-teal-medium hover:bg-teal-lightest focus:bg-teal-lightest ${
                              isActive ? 'bg-teal-lightest border-teal-medium shadow-xl scale-110' : ''
                            }`
                      } focus:outline-none focus:ring-2 focus:ring-teal-dark focus:ring-offset-2`}
                      role="menuitem"
                      tabIndex={0}
                      style={{
                        left: `${finalX}px`,
                        bottom: `${finalY}px`,
                        animation: `archMenuAppear 0.4s ease-out ${delay}s both`,
                        // @ts-ignore - CSS custom property
                        '--rotation': `${-rotation}deg`,
                      }}
                      aria-label={item.label}
                    >
                      <span 
                        className="flex-shrink-0"
                        style={{
                          transform: `rotate(${rotation}deg)`, // Counter-rotate icon to keep it upright
                        }}
                      >
                        {item.icon}
                      </span>
                      {isActive && !isDanger && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-medium" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </nav>
    </>
  );
}
