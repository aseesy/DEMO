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
import ChatRoom from '../ChatRoom';
import { storage, StorageKeys, authStorage } from '../adapters/storage';

// Mock the API client
vi.mock('../apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

// Mock navigation
vi.mock('../adapters/navigation', () => ({
  useAppNavigation: () => ({
    navigate: vi.fn(),
    getQueryParam: vi.fn(() => null),
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

// Mock chat context
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
}));

// Mock other dependencies
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
    contactSuggestionModal: {
      pendingContactSuggestion: null,
      handleAddContactFromSuggestion: vi.fn(),
      setPendingContactSuggestion: vi.fn(),
      setDismissedSuggestions: vi.fn(),
    },
  }),
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
  }),
}));

describe('PWA Authentication Flow', () => {
  beforeEach(() => {
    // Clear all mocks and storage before each test
    vi.clearAllMocks();
    localStorage.clear();
    authStorage.clearAuth();
  });

  it('should automatically log in when PWA launches with stored auth token', async () => {
    // Setup: User has previously logged in and token is stored
    const mockToken = 'valid-token-123';
    const mockUsername = 'testuser';
    
    authStorage.setToken(mockToken);
    authStorage.setUsername(mockUsername);
    authStorage.setAuthenticated(true);

    // Mock successful auth verification
    const { apiGet } = await import('../apiClient');
    apiGet.mockResolvedValue({
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
          <ChatRoom />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/api/auth/verify', expect.any(Object));
    }, { timeout: 3000 });

    // Should NOT show landing page
    await waitFor(() => {
      const landingPage = screen.queryByText(/co-parenting/i);
      expect(landingPage).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show landing page when PWA launches without stored auth', async () => {
    // Setup: No stored auth
    authStorage.clearAuth();

    // Mock failed/no auth verification
    const { apiGet } = await import('../apiClient');
    apiGet.mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false }),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ChatRoom />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should show landing page or redirect to sign-in
    await waitFor(() => {
      // Either landing page is shown or redirect happens
      const landingPage = screen.queryByText(/co-parenting/i);
      const signInPage = screen.queryByText(/sign in/i);
      expect(landingPage || signInPage).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('should hide landing page immediately when authenticated state loads', async () => {
    // Setup: User has stored auth
    const mockToken = 'valid-token-123';
    const mockUsername = 'testuser';
    
    authStorage.setToken(mockToken);
    authStorage.setUsername(mockUsername);
    authStorage.setAuthenticated(true);

    // Mock successful auth verification
    const { apiGet } = await import('../apiClient');
    apiGet.mockResolvedValue({
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
          <ChatRoom />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should not show landing page even during initial render
    // (optimistic auth state should prevent it)
    const landingPage = screen.queryByText(/co-parenting/i);
    expect(landingPage).not.toBeInTheDocument();
  });

  it('should redirect to sign-in when not authenticated after verification', async () => {
    // Setup: No stored auth
    authStorage.clearAuth();

    // Mock no auth
    const { apiGet } = await import('../apiClient');
    apiGet.mockResolvedValue({
      ok: false,
      json: async () => ({ authenticated: false }),
    });

    const { useAppNavigation } = await import('../adapters/navigation');
    const mockNavigate = vi.fn();
    vi.mocked(useAppNavigation).mockReturnValue({
      navigate: mockNavigate,
      getQueryParam: vi.fn(() => null),
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <ChatRoom />
        </AuthProvider>
      </BrowserRouter>
    );

    // Should redirect to sign-in
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signin');
    }, { timeout: 3000 });
  });
});

