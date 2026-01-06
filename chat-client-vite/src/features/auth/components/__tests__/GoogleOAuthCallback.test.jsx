import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { GoogleOAuthCallback } from '../GoogleOAuthCallback.jsx';

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
  parseOAuthError: vi.fn((error) => ({ message: error, userMessage: error })),
  clearOAuthState: vi.fn(),
}));

vi.mock('../../../utils/errorHandler.jsx', () => ({
  getErrorMessage: vi.fn((err) => ({
    userMessage: err.code || 'An error occurred',
  })),
  logError: vi.fn(),
}));

describe('GoogleOAuthCallback', () => {
  const mockNavigate = vi.fn();
  const mockHandleGoogleCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render loading state initially', () => {
    render(
      <MemoryRouter>
        <GoogleOAuthCallback />
      </MemoryRouter>
    );

    expect(screen.getByText(/Completing Google login/i)).toBeInTheDocument();
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

  it('should redirect to home if already authenticated', () => {
    const { useAuth } = require('../../model/useAuth.js');
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

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should handle missing code parameter', async () => {
    const mockSetError = vi.fn();
    const { useAuth } = require('../../model/useAuth.js');
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

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalled();
    });
  });

  it('should handle OAuth error from Google', async () => {
    const mockSetError = vi.fn();
    const { useAuth } = require('../../model/useAuth.js');
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

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/sign-in', { replace: true });
    });
  });

  it('should process OAuth callback successfully', async () => {
    mockHandleGoogleCallback.mockResolvedValue(true);
    const { useAuth } = require('../../model/useAuth.js');
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
    const { useAuth } = require('../../model/useAuth.js');
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

    await waitFor(() => {
      expect(mockHandleGoogleCallback).toHaveBeenCalled();
      // Should show error and eventually redirect
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });
});

