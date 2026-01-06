/**
 * ConnectionStatus Component
 *
 * Single Responsibility: Display network connection status to users.
 *
 * Shows:
 * - Offline indicator when disconnected
 * - Reconnecting indicator when coming back online
 * - Queued message count (if available)
 */

import React from 'react';
import { useNetworkStatus } from '../../../hooks/network/useNetworkStatus.js';

/**
 * ConnectionStatus - Visual indicator for network connection state
 *
 * @param {Object} props
 * @param {number} props.queuedMessageCount - Number of messages in offline queue
 * @param {boolean} props.isSocketConnected - Whether socket is connected
 */
export function ConnectionStatus({ queuedMessageCount = 0, isSocketConnected = false }) {
  const { isOnline, isReconnecting } = useNetworkStatus();

  // Don't show anything if online and socket connected
  if (isOnline && isSocketConnected && queuedMessageCount === 0) {
    return null;
  }

  // Determine status message
  let statusMessage = '';
  let statusClass = '';

  if (!isOnline) {
    statusMessage = 'Offline - Messages will be queued';
    statusClass = 'offline';
  } else if (isReconnecting) {
    statusMessage = 'Reconnecting...';
    statusClass = 'reconnecting';
  } else if (!isSocketConnected) {
    statusMessage = 'Connecting...';
    statusClass = 'connecting';
  } else if (queuedMessageCount > 0) {
    statusMessage = `Sending ${queuedMessageCount} queued message${queuedMessageCount > 1 ? 's' : ''}...`;
    statusClass = 'sending';
  }

  if (!statusMessage) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (statusClass) {
      case 'offline':
        return 'rgba(239, 68, 68, 0.95)';
      case 'reconnecting':
      case 'connecting':
        return 'rgba(251, 191, 36, 0.95)';
      case 'sending':
        return 'rgba(34, 197, 94, 0.95)';
      default:
        return 'rgba(0, 0, 0, 0.9)';
    }
  };

  const getTextColor = () => {
    return statusClass === 'reconnecting' || statusClass === 'connecting' ? '#000' : '#fff';
  };

  return (
    <div
      className={`connection-status connection-status--${statusClass}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: getBackgroundColor(),
        color: getTextColor(),
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{!isOnline || !isSocketConnected ? '📡' : '✓'}</span>
        <span style={{ fontWeight: 500 }}>{statusMessage}</span>
        {queuedMessageCount > 0 && (
          <span
            style={{
              background:
                statusClass === 'sending' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {queuedMessageCount}
          </span>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
