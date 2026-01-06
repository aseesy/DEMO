import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoogleOAuthCallback } from '../GoogleOAuthCallback.jsx';

// Mock navigate before importing
const mockNavigate = vi.fn();

// Mock react-router-dom with useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock storage adapter to fix import error
vi.mock('../../../adapters/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  StorageKeys: {
    OFFLINE_QUEUE: 'offline_queue',
  },
  authStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock dependencies
vi.mock('../../model/useAuth.js', () => ({
  useAuth: vi.fn(() => ({
    handleGoogleCallback: vi.fn(),
    error: '',
    setError: vi.fn(),
    isAuthenticated: false,
  })),
}));

vi.mock('../../../utils/oauthHelper.js', () => ({
  parseOAuthError: vi.fn(error => ({ message: error, userMessage: error })),
  clearOAuthState: vi.fn(),
}));

vi.mock('../../../utils/errorHandler.jsx', () => ({
  getErrorMessage: vi.fn(err => ({
    userMessage: err.code || 'An error occurred',
  })),
  logError: vi.fn(),
}));

describe('GoogleOAuthCallback', () => {
  const mockHandleGoogleCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', async () => {
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: vi.fn(),
      isAuthenticated: false,
    });

    // Render with a code parameter to trigger processing state
    render(
      <MemoryRouter initialEntries={['/auth/google/callback?code=test_code']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Should show loading state while processing
    await waitFor(() => {
      expect(screen.getByText(/Completing Google login/i)).toBeInTheDocument();
    });
  });

  it('should prevent duplicate processing in StrictMode', async () => {
    // This test verifies that the hasAttemptedRef prevents duplicate execution
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: vi.fn(),
      isAuthenticated: false,
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/auth/google/callback?code=test123']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Wait for first execution
    await waitFor(() => {
      expect(mockHandleGoogleCallback).toHaveBeenCalledTimes(1);
    });

    // Rerender (simulating StrictMode double mount)
    rerender(
      <MemoryRouter initialEntries={['/auth/google/callback?code=test123']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Should still only be called once
    expect(mockHandleGoogleCallback).toHaveBeenCalledTimes(1);
  });

  it('should redirect to home if already authenticated', async () => {
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: vi.fn(),
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should handle missing code parameter', async () => {
    const mockSetError = vi.fn();
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: mockSetError,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/auth/google/callback']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Component has 3s delay before navigation, wait for it
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
      },
      { timeout: 4000 }
    );
  });

  it('should handle OAuth error from Google', async () => {
    const mockSetError = vi.fn();
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: mockSetError,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/auth/google/callback?error=access_denied']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Component has 3s delay before navigation, wait for it
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
      },
      { timeout: 4000 }
    );
  });

  it('should process OAuth callback successfully', async () => {
    mockHandleGoogleCallback.mockResolvedValue(true);
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: '',
      setError: vi.fn(),
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/auth/google/callback?code=valid_code&state=test_state']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockHandleGoogleCallback).toHaveBeenCalledWith('valid_code', 'test_state');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should handle OAuth callback failure', async () => {
    mockHandleGoogleCallback.mockResolvedValue(false);
    const mockSetError = vi.fn();
    const { useAuth } = await import('../../model/useAuth.js');
    useAuth.mockReturnValue({
      handleGoogleCallback: mockHandleGoogleCallback,
      error: 'Auth failed',
      setError: mockSetError,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={['/auth/google/callback?code=invalid_code']}>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    // Wait for callback to be called
    await waitFor(() => {
      expect(mockHandleGoogleCallback).toHaveBeenCalled();
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Auth failed/i)).toBeInTheDocument();
    });

    // Component has 3s delay before navigation, wait for it
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
      },
      { timeout: 4000 }
    );
  });
});
