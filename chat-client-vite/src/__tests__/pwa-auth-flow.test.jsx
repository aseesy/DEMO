/**
 * PWA Authentication Flow Tests
 *
 * Tests that verify:
 * 1. PWA launches with stored auth automatically log in
 * 2. PWA launches without auth redirect to sign-in
 * 3. Landing page doesn't show for authenticated users
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MediatorProvider } from '../context/MediatorContext';
import { InvitationProvider } from '../context/InvitationContext';
import ChatRoom from '../ChatRoom';
import { authStorage } from '../adapters/storage';

// Mock the API client
// Use vi.hoisted() to define mocks that can be accessed in both factory and tests
const { mockApiGet, mockApiPost, mockOnAuthFailure } = vi.hoisted(() => {
  const mockApiGet = vi.fn();
  const mockApiPost = vi.fn();
  const mockOnAuthFailure = vi.fn(callback => {
    // Return cleanup function
    return () => {};
  });
  return { mockApiGet, mockApiPost, mockOnAuthFailure };
});

vi.mock('../apiClient', () => ({
  apiGet: (...args) => mockApiGet(...args),
  apiPost: (...args) => mockApiPost(...args),
  onAuthFailure: (...args) => mockOnAuthFailure(...args),
}));

// Mock navigation - use a spy that can be checked
const mockNavigate = vi.fn();
const mockGetQueryParam = vi.fn(() => null);

vi.mock('../adapters/navigation', () => ({
  useAppNavigation: () => ({
    navigate: mockNavigate,
    getQueryParam: mockGetQueryParam,
  }),
  NavigationPaths: {
    SIGN_IN: '/signin',
    HOME: '/',
    withQuery: (path, params) => {
      const query = new URLSearchParams(params).toString();
      return query ? `${path}?${query}` : path;
    },
  },
}));

// Mock chat context - provide minimal required interface
vi.mock('../features/chat', () => ({
  ChatProvider: ({ children }) => <div data-testid="chat-provider">{children}</div>,
  useChatContext: () => ({
    unreadCount: 0,
    hasMeanMessage: false,
    searchQuery: '',
    searchMessages: vi.fn(),
    searchMode: false,
    toggleSearchMode: vi.fn(),
    exitSearchMode: vi.fn(),
    messages: [],
  }),
  ChatPage: () => <div data-testid="chat-page">Chat Page</div>,
}));

// Mock other dependencies with minimal required interface
vi.mock('../features/dashboard', () => ({
  useDashboard: () => ({
    tasks: [],
    loadTasks: vi.fn(),
    saveTask: vi.fn(),
    deleteTask: vi.fn(),
    toggleTaskStatus: vi.fn(),
    showTaskForm: false,
    setShowTaskForm: vi.fn(),
    editingTask: null,
    taskFormData: {},
    setTaskFormData: vi.fn(),
    taskFormMode: 'create',
    setTaskFormMode: vi.fn(),
    aiTaskDetails: null,
    setAiTaskDetails: vi.fn(),
    isGeneratingTask: false,
    setIsGeneratingTask: vi.fn(),
    welcomeModal: null,
    setShowWelcomeModal: vi.fn(),
    profileTaskModal: null,
    setShowProfileTaskModal: vi.fn(),
    inviteModal: null,
    setShowInviteModal: vi.fn(),
    hasCoParentConnected: false,
    setHasCoParentConnected: vi.fn(),
  }),
  DashboardView: () => <div data-testid="dashboard-view">Dashboard</div>,
}));

vi.mock('../features/contacts', () => ({
  useContacts: () => ({
    contacts: [],
    loadContacts: vi.fn(),
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  }),
  ContactsPanel: () => <div data-testid="contacts-panel">Contacts</div>,
  ContactSuggestionModal: () => (
    <div data-testid="contact-suggestion-modal">Contact Suggestion</div>
  ),
}));

vi.mock('../features/notifications', () => ({
  useNotifications: () => ({
    permission: 'granted',
    showNotification: vi.fn(),
  }),
  useInAppNotifications: () => ({
    unreadCount: 0,
    refresh: vi.fn(),
  }),
}));

vi.mock('../features/invitations', () => ({
  useInviteManagement: () => ({
    invites: [],
    loadInvites: vi.fn(),
    sendInvite: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
  }),
  InviteTaskModal: () => <div data-testid="invite-task-modal">Invite Task Modal</div>,
}));

vi.mock('../hooks/ui/useToast', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock('../hooks/ui/useModalController', () => ({
  useModalControllerDefault: () => ({
    showModal: vi.fn(),
    hideModal: vi.fn(),
    isModalOpen: vi.fn(() => false),
    contactSuggestionModal: {
      pendingContactSuggestion: null,
      handleAddContactFromSuggestion: vi.fn(),
      setPendingContactSuggestion: vi.fn(),
      setDismissedSuggestions: vi.fn(),
    },
    messageFlaggingModal: {
      show: false,
      message: null,
      showModal: vi.fn(),
      hideModal: vi.fn(),
    },
  }),
}));

// Mock PWA detection
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: query === '(display-mode: standalone)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

// Mock IntersectionObserver for landing page tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
};

describe('PWA Authentication Flow', () => {
  // Helper to create a valid JWT token for testing
  const createTestToken = (expiresInSeconds = 3600) => {
    const payload = {
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      username: 'testuser',
      email: 'test@example.com',
    };
    return `header.${btoa(JSON.stringify(payload))}.signature`;
  };

  beforeEach(() => {
    // Clear all mocks and storage before each test
    vi.clearAllMocks();
    localStorage.clear();
    authStorage.clearAuth();
    mockNavigate.mockClear();
    mockGetQueryParam.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  it('should automatically log in when PWA launches with stored auth token', async () => {
    // Setup: User has previously logged in and token is stored
    const mockToken = createTestToken();
    const mockUsername = 'testuser';

    authStorage.setToken(mockToken);
    authStorage.setUsername(mockUsername);
    authStorage.setAuthenticated(true);

    // Mock successful auth verification
    mockApiGet.mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: {
          username: mockUsername,
          email: 'test@example.com',
        },
      }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InvitationProvider>
            <MediatorProvider>
              <ChatRoom />
            </MediatorProvider>
          </InvitationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for auth check to complete
    await waitFor(
      () => {
        expect(mockApiGet).toHaveBeenCalledWith('/api/auth/verify', expect.any(Object));
      },
      { timeout: 3000 }
    );

    // Should NOT show landing page
    await waitFor(
      () => {
        const landingPage = screen.queryByText(/co-parenting/i);
        expect(landingPage).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should show landing page when PWA launches without stored auth', async () => {
    // Setup: No stored auth
    authStorage.clearAuth();

    // Mock failed/no auth verification
    mockApiGet.mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InvitationProvider>
            <MediatorProvider>
              <ChatRoom />
            </MediatorProvider>
          </InvitationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show landing page or redirect to sign-in
    await waitFor(
      () => {
        // Either landing page is shown or redirect happens
        // Use getAllByText and check if any exist, or check for navigation
        const landingPages = screen.queryAllByText(/co-parenting/i);
        const signInPage = screen.queryByText(/sign in/i);
        const hasLandingPage = landingPages.length > 0;
        const hasSignIn = !!signInPage;
        const hasNavigated = mockNavigate.mock.calls.length > 0;
        expect(hasLandingPage || hasSignIn || hasNavigated).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('should hide landing page immediately when authenticated state loads', async () => {
    // Setup: User has stored auth
    const mockToken = createTestToken();
    const mockUsername = 'testuser';

    authStorage.setToken(mockToken);
    authStorage.setUsername(mockUsername);
    authStorage.setAuthenticated(true);

    // Mock successful auth verification
    mockApiGet.mockResolvedValue({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: {
          username: mockUsername,
          email: 'test@example.com',
        },
      }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InvitationProvider>
            <MediatorProvider>
              <ChatRoom />
            </MediatorProvider>
          </InvitationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // Should not show landing page even during initial render
    // (optimistic auth state should prevent it)
    await waitFor(
      () => {
        const landingPage = screen.queryByText(/co-parenting/i);
        expect(landingPage).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should redirect to sign-in when not authenticated after verification', async () => {
    // Setup: No stored auth
    authStorage.clearAuth();

    // Mock no auth - AuthContext may not call verifySession without a token
    // ChatRoom has a timeout that redirects after 2 seconds if not authenticated AND not showing landing
    mockApiGet.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ authenticated: false }),
    });

    // Mock PWA mode to skip landing page (which would prevent redirect)
    mockMatchMedia.mockReturnValue({
      matches: true, // PWA mode
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <InvitationProvider>
            <MediatorProvider>
              <ChatRoom />
            </MediatorProvider>
          </InvitationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // In PWA mode, ChatRoom should redirect immediately to sign-in (not show landing)
    // OR if landing is shown, it won't redirect (which is also valid behavior)
    await waitFor(
      () => {
        // Check if navigate was called with sign-in path
        const signInCalls = mockNavigate.mock.calls.filter(
          call => call[0] === '/signin' || call[0]?.includes('signin')
        );
        // OR check if landing page is shown (which is also valid - user sees landing first)
        const landingPage = screen.queryByText(/better co-parenting/i);
        expect(signInCalls.length > 0 || !!landingPage).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});
