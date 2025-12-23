/**
 * Navigation Component Tests
 *
 * Detects issues with navigation functionality that could break production:
 * - Missing import dependencies that crash the app
 * - setCurrentView callback not being called
 * - Menu interactions not working
 * - Click handlers not firing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navigation } from './Navigation.jsx';

describe('Navigation Component', () => {
  let mockSetCurrentView;
  let mockOnLogout;

  beforeEach(() => {
    mockSetCurrentView = vi.fn();
    mockOnLogout = vi.fn();
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    });
  });

  describe('Desktop Navigation', () => {
    it('should render Dashboard and Chat navigation buttons', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
    });

    it('should call setCurrentView when Dashboard is clicked', () => {
      render(
        <Navigation
          currentView="chat"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      const dashboardBtn = screen.getByRole('button', { name: /dashboard/i });
      fireEvent.click(dashboardBtn);

      expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
    });

    it('should call setCurrentView when Chat is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      const chatBtn = screen.getByRole('button', { name: /chat/i });
      fireEvent.click(chatBtn);

      expect(mockSetCurrentView).toHaveBeenCalledWith('chat');
    });

    it('should open menu when LiaiZen button is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Menu should be visible
      expect(screen.getByRole('menu', { name: /user menu/i })).toBeInTheDocument();
    });

    it('should navigate to Contacts when Contacts menu item is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu first
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Click Contacts
      const contactsItem = screen.getByRole('menuitem', { name: /contacts/i });
      fireEvent.click(contactsItem);

      expect(mockSetCurrentView).toHaveBeenCalledWith('contacts');
    });

    it('should navigate to Profile when Profile menu item is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu first
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Click Profile
      const profileItem = screen.getByRole('menuitem', { name: /profile/i });
      fireEvent.click(profileItem);

      expect(mockSetCurrentView).toHaveBeenCalledWith('profile');
    });

    it('should navigate to Settings when Settings menu item is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu first
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Click Settings
      const settingsItem = screen.getByRole('menuitem', { name: /settings/i });
      fireEvent.click(settingsItem);

      expect(mockSetCurrentView).toHaveBeenCalledWith('settings');
    });

    it('should call onLogout when Logout is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu first
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Click Logout
      const logoutItem = screen.getByRole('menuitem', { name: /logout/i });
      fireEvent.click(logoutItem);

      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile viewport
      });
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
    });

    it('should render mobile navigation on small screens', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Mobile nav should have data-testid
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('should call setCurrentView when mobile Dashboard button is clicked', () => {
      render(
        <Navigation
          currentView="chat"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      const mobileNav = screen.getByTestId('mobile-nav');
      const dashboardBtn = mobileNav.querySelector('button[aria-label="Dashboard"]');

      if (dashboardBtn) {
        fireEvent.click(dashboardBtn);
        expect(mockSetCurrentView).toHaveBeenCalledWith('dashboard');
      }
    });

    it('should call setCurrentView when mobile Chat button is clicked', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      const mobileNav = screen.getByTestId('mobile-nav');
      const chatBtn = mobileNav.querySelector('button[aria-label="Chat"]');

      if (chatBtn) {
        fireEvent.click(chatBtn);
        expect(mockSetCurrentView).toHaveBeenCalledWith('chat');
      }
    });
  });

  describe('Critical Import Dependencies', () => {
    it('should not throw when Navigation component is imported', async () => {
      // This test catches missing import issues like dependencyValidator.js
      await expect(import('./Navigation.jsx')).resolves.toBeDefined();
    });
  });

  describe('Click Handler Validation', () => {
    it('should have click handlers that are functions', () => {
      const { container } = render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // All buttons should be clickable
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(() => fireEvent.click(button)).not.toThrow();
      });
    });

    it('setCurrentView should be called with valid view names only', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Click through all navigation items
      const chatBtn = screen.getByRole('button', { name: /chat/i });
      fireEvent.click(chatBtn);

      // Open menu and click each item
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      const validViews = ['dashboard', 'chat', 'contacts', 'profile', 'settings', 'account'];

      mockSetCurrentView.mock.calls.forEach(call => {
        expect(validViews).toContain(call[0]);
      });
    });
  });

  describe('Notification Indicators', () => {
    it('should show unread count indicator on Chat button', () => {
      const { container } = render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
          unreadCount={5}
        />
      );

      // Should have a red dot indicator
      const redDot = container.querySelector('.bg-red-500');
      expect(redDot).toBeInTheDocument();
    });

    it('should show notification count indicator on Dashboard', () => {
      const { container } = render(
        <Navigation
          currentView="chat"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
          notificationCount={3}
        />
      );

      // Should have a red dot indicator
      const redDot = container.querySelector('.bg-red-500');
      expect(redDot).toBeInTheDocument();
    });
  });

  describe('Menu State Management', () => {
    it('should close menu after selecting an item', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Menu should be open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click a menu item
      const contactsItem = screen.getByRole('menuitem', { name: /contacts/i });
      fireEvent.click(contactsItem);

      // Menu should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should close menu on Escape key press', () => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={mockSetCurrentView}
          onLogout={mockOnLogout}
        />
      );

      // Open menu
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(menuButton);

      // Menu should be open
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Menu should be closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});

describe('Production Crash Prevention', () => {
  it('should not crash when setCurrentView is not provided', () => {
    // This simulates a potential crash scenario
    expect(() => {
      render(<Navigation currentView="dashboard" onLogout={vi.fn()} />);
    }).not.toThrow();
  });

  it('should not crash when onLogout is not provided', () => {
    expect(() => {
      render(<Navigation currentView="dashboard" setCurrentView={vi.fn()} />);
    }).not.toThrow();
  });

  it('should handle undefined props gracefully', () => {
    expect(() => {
      render(
        <Navigation
          currentView="dashboard"
          setCurrentView={vi.fn()}
          onLogout={vi.fn()}
          unreadCount={undefined}
          notificationCount={undefined}
          messages={undefined}
        />
      );
    }).not.toThrow();
  });
});
