import React from 'react';
import { apiGet } from '../../../apiClient.js';

export function CommunicationStatsWidget({ username, email, isCheckingAuth = false }) {
  const [stats, setStats] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Use email if available, fallback to username only if it looks like an email
  // Backend requires email format for user lookup
  const userEmail = email || (username && username.includes('@') ? username : null);

  const loadStats = React.useCallback(async () => {
    if (!userEmail) {
      console.warn('[CommunicationStatsWidget] No valid email provided, skipping stats load', {
        email,
        username,
        userEmail,
      });
      setIsLoading(false);
      setError('Email is required to load stats');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[CommunicationStatsWidget] Loading stats for:', userEmail);
      const response = await apiGet(
        `/api/dashboard/communication-stats?email=${encodeURIComponent(userEmail)}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[CommunicationStatsWidget] Stats loaded:', data);
        setStats(data.stats);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CommunicationStatsWidget] API error:', {
          status: response.status,
          error: errorData.error,
          userEmail,
        });
        setError(errorData.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('[CommunicationStatsWidget] Error loading communication stats:', err);
      setError('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, email, username]);

  React.useEffect(() => {
    // CRITICAL: Don't make API calls while auth is being verified
    // This prevents 401 errors from racing with verifySession
    if (isCheckingAuth) {
      console.log('[CommunicationStatsWidget] Waiting for auth verification...');
      return;
    }

    loadStats();

    // Refresh stats every 30 seconds when user sends messages
    const interval = setInterval(() => {
      // Only refresh if not checking auth
      if (!isCheckingAuth) {
        loadStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadStats, isCheckingAuth]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-teal-light p-4 sm:p-6">
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-light border-t-[#4DA8B0]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border-2 border-teal-light p-4 sm:p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border-2 border-teal-light p-3 sm:p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#46BD92] to-[#4DA8B0] rounded-lg flex items-center justify-center shadow-sm">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-teal-dark">Communication Streak</h3>
          <p className="text-[10px] text-gray-600">Positive messages in a row</p>
        </div>
      </div>

      {/* Current Streak - Large Display */}
      <div className="bg-white rounded-lg p-4 mb-3 text-center border-2 border-teal-light shadow-sm">
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#46BD92] to-[#4DA8B0] mb-1">
            {stats.currentStreak}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg className="w-4 h-4 text-[#46BD92]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Current Streak</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Best Streak */}
        <div className="bg-white rounded-lg p-2.5 border border-teal-light">
          <div className="text-xl font-bold text-teal-dark">{stats.bestStreak}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">Best Streak</div>
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-2.5 h-2.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] text-yellow-600 font-medium">Record</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg p-2.5 border border-teal-light">
          <div className="text-xl font-bold text-teal-dark">{stats.successRate}%</div>
          <div className="text-[10px] text-gray-600 mt-0.5">Success Rate</div>
          <div className="mt-1.5 bg-gray-200 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-[#46BD92] to-[#4DA8B0] h-1 rounded-full transition-all duration-500"
              style={{ width: `${stats.successRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-2">
        {/* Total Positive */}
        <div className="bg-white rounded-lg p-2.5 border border-teal-light">
          <div className="flex items-center gap-1.5 mb-0.5">
            <svg className="w-3.5 h-3.5 text-[#46BD92]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base font-bold text-teal-dark">{stats.totalPositive}</span>
          </div>
          <div className="text-[10px] text-gray-600">Positive</div>
        </div>

        {/* Interventions */}
        <div className="bg-white rounded-lg p-2.5 border border-teal-light">
          <div className="flex items-center gap-1.5 mb-0.5">
            <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base font-bold text-teal-dark">{stats.totalInterventions}</span>
          </div>
          <div className="text-[10px] text-gray-600">Interventions</div>
        </div>
      </div>

      {/* Encouragement Message */}
      {stats.currentStreak > 0 && (
        <div className="mt-3 p-2 bg-gradient-to-r from-[#46BD92]/10 to-[#4DA8B0]/10 rounded-lg border border-[#46BD92]/20">
          <p className="text-[10px] text-center text-teal-dark font-medium">
            {stats.currentStreak >= 10
              ? "🎉 Amazing streak! You're crushing it!"
              : stats.currentStreak >= 5
                ? "🔥 Keep it going! You're doing great!"
                : '💪 Great start! Keep communicating positively!'}
          </p>
        </div>
      )}
    </div>
  );
}
