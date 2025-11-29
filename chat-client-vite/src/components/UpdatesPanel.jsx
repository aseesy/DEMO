import React from 'react';
import { apiGet } from '../apiClient.js';

export function UpdatesPanel({ username, onContactClick, setCurrentView }) {
  const [updates, setUpdates] = React.useState([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = React.useState(false);

  const loadUpdates = React.useCallback(async () => {
    if (!username) return;
    setIsLoadingUpdates(true);
    try {
      const response = await apiGet(`/api/dashboard/updates?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Error loading updates:', err);
    } finally {
      setIsLoadingUpdates(false);
    }
  }, [username]);

  React.useEffect(() => {
    loadUpdates();

    // Refresh updates every 60 seconds, only when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadUpdates();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loadUpdates]);

  // Icon based on update type
  const getUpdateIcon = (type) => {
    switch (type) {
      case 'expense':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'agreement':
        return (
          <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'invite':
        return (
          <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'message':
      default:
        return (
          <svg className="w-4 h-4 text-teal-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const handlePersonClick = (contactName) => {
    if (onContactClick) {
      onContactClick(contactName);
    }
  };

  if (isLoadingUpdates) {
    return (
      <div className="bg-white rounded-xl border-2 border-teal-light p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg md:text-xl font-semibold text-teal-dark mb-4">Updates</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-teal-light border-t-teal-medium" />
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-teal-light p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-lg md:text-xl font-semibold text-teal-dark mb-4">Updates</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-gray-600 text-sm mb-2">No recent updates</p>
          <p className="text-gray-500 text-xs">Messages, expenses, and agreements will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-teal-light p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-teal-dark">
          Updates
        </h2>
        {updates.length > 0 && setCurrentView && (
          <button
            onClick={() => setCurrentView('chat')}
            className="text-sm text-teal-medium hover:text-teal-dark font-semibold transition-colors"
          >
            View All →
          </button>
        )}
      </div>
      <div className="space-y-2">
        {updates.map((update, index) => (
          <div
            key={index}
            onClick={() => handlePersonClick(update.personName)}
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all bg-white border-2 border-teal-light hover:border-teal-medium hover:shadow-sm touch-manipulation active:scale-[0.98]"
          >
            <div className="shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${update.type === 'expense' ? 'bg-amber-500' :
                  update.type === 'agreement' ? 'bg-teal-medium' :
                    update.type === 'invite' ? 'bg-teal-medium' :
                      'bg-teal-medium'
                }`}>
                {update.type === 'expense' ? '$' :
                  update.type === 'agreement' ? '🤝' :
                    update.type === 'invite' ? '✉️' :
                      (update.personName?.charAt(0).toUpperCase() || '?')}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-3.5 h-3.5 shrink-0">
                  {getUpdateIcon(update.type)}
                </div>
                <span className={`text-xs font-semibold transition-colors truncate ${update.type === 'expense' ? 'text-amber-600' :
                    update.type === 'agreement' ? 'text-teal-medium' :
                      update.type === 'invite' ? 'text-teal-medium' :
                        'text-teal-medium'
                  }`}>
                  {update.type === 'message' ? update.personName :
                    update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 line-clamp-1">
                {update.description && update.description.length > 60
                  ? `${update.description.substring(0, 60)}...`
                  : update.description}
              </p>
            </div>
            <div className="shrink-0 text-[10px] text-gray-500 whitespace-nowrap">
              {formatTimeAgo(update.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

