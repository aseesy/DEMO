import React from 'react';
import { useContacts } from '../hooks/useContacts.js';
import { apiGet } from '../apiClient.js';

export function UpdatesPanel({ username, onContactClick }) {
  const { contacts } = useContacts(username);
  const [updates, setUpdates] = React.useState([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = React.useState(false);

  // Filter contacts to get co-parent and children
  const coparentContacts = React.useMemo(() => {
    return contacts.filter(
      (c) =>
        c.relationship === 'My Co-Parent' ||
        c.relationship === 'co-parent' ||
        c.relationship === "My Partner's Co-Parent"
    );
  }, [contacts]);

  const childrenContacts = React.useMemo(() => {
    return contacts.filter(
      (c) =>
        c.relationship === 'My Child' ||
        c.relationship === "My Partner's Child" ||
        (c.relationship && c.relationship.toLowerCase().includes('child'))
    );
  }, [contacts]);

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
    // Refresh updates every 30 seconds
    const interval = setInterval(loadUpdates, 30000);
    return () => clearInterval(interval);
  }, [loadUpdates]);

  const getUpdateIcon = (updateType) => {
    switch (updateType) {
      case 'message':
        return (
          <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'profile':
        return (
          <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-[#4DA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div>
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#275559] mb-3 sm:mb-4">Updates</h2>
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#C5E8E4] border-t-[#275559]" />
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div>
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#275559] mb-3 sm:mb-4">Updates</h2>
        <div className="text-center py-6">
          <p className="text-gray-600 text-xs sm:text-sm">No recent updates</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#275559] mb-3 sm:mb-4">Updates</h2>
      <div className="space-y-2">
        {updates.map((update, index) => (
          <div
            key={index}
            onClick={() => handlePersonClick(update.personName)}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all bg-white border-2 border-[#C5E8E4] hover:border-[#4DA8B0] hover:shadow-sm touch-manipulation active:scale-[0.98]"
          >
            <div className="flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#275559] text-white flex items-center justify-center text-xs sm:text-sm font-semibold">
                {update.personName?.charAt(0).toUpperCase() || '?'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0">
                  {getUpdateIcon(update.type)}
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#275559] hover:text-[#4DA8B0] transition-colors truncate">
                  {update.personName}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-600 truncate">{update.description}</p>
            </div>
            <div className="flex-shrink-0 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
              {formatTimeAgo(update.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

