/**
 * Socket Test Component v2
 *
 * Test component for new simplified SocketService v2 and useSocket hook.
 * Verifies:
 * - Connection lifecycle
 * - Event subscription
 * - State management
 * - Cleanup
 */

import React, { useState, useEffect } from 'react';
import { socketService } from '../../../services/socket/SocketService.v2.js';
import { tokenManager } from '../../../utils/tokenManager.js';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';

function SocketTestV2Content() {
  // Observe the connection state from the service (ChatProvider manages connection)
  const token = tokenManager.getToken();

  const [events, setEvents] = useState([]);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [socketId, setSocketId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Subscribe to connection state changes (ChatProvider manages connection)
  useEffect(() => {
    const unsubscribe = socketService.subscribeToState((state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
      setSocketId(socketService.getSocketId());
    });

    return unsubscribe;
  }, []);

  // Subscribe to test events
  useEffect(() => {
    const unsubs = [
      socketService.subscribe('connect', () => {
        addEvent('connect', { socketId: socketService.getSocketId() });
      }),
      socketService.subscribe('disconnect', (reason) => {
        addEvent('disconnect', { reason });
      }),
      socketService.subscribe('connect_error', (error) => {
        addEvent('connect_error', { error: error.message || error });
      }),
      socketService.subscribe('join_success', (data) => {
        addEvent('join_success', data);
      }),
      socketService.subscribe('message_history', (data) => {
        addEvent('message_history', { messageCount: data.messages?.length || 0 });
      }),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  const addEvent = (eventName, data) => {
    setEvents(prev => [
      ...prev.slice(-19), // Keep last 20 events
      {
        timestamp: new Date().toISOString(),
        event: eventName,
        data,
      },
    ]);
  };

  const handleTestEmit = () => {
    if (isConnected) {
      socketService.emit('test_event', { message: 'Test from v2 system', timestamp: Date.now() });
      addEvent('test_emit', { message: 'Emitted test_event' });
    }
  };

  const handleJoin = () => {
    // Get username from localStorage or use email from token
    const username = localStorage.getItem('username') || 
                     tokenManager.getUsername?.() || 
                     'test@example.com';
    if (isConnected) {
      socketService.emit('join', { email: username });
      addEvent('join_emit', { email: username });
    }
  };

  const handleDisconnect = () => {
    socketService.disconnect();
    addEvent('manual_disconnect', {});
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14 }}>
      <h1>Socket Test v2 - New Simplified System</h1>

      <div style={{ marginBottom: 20 }}>
        <h2>Connection Status</h2>
        <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td>Token</td>
              <td style={{ backgroundColor: token ? '#22c55e' : '#ef4444', color: 'white' }}>
                {token ? `Present (${token.length} chars)` : 'MISSING'}
              </td>
            </tr>
            <tr>
              <td>Connection State</td>
              <td style={{
                backgroundColor:
                  connectionState === 'connected' ? '#22c55e' :
                  connectionState === 'connecting' ? '#f59e0b' : '#ef4444',
                color: 'white'
              }}>
                {connectionState}
              </td>
            </tr>
            <tr>
              <td>isConnected (hook)</td>
              <td style={{ backgroundColor: isConnected ? '#22c55e' : '#ef4444', color: 'white' }}>
                {isConnected ? 'YES' : 'NO'}
              </td>
            </tr>
            <tr>
              <td>Socket ID</td>
              <td>{socketId || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Actions</h2>
        <button
          onClick={handleTestEmit}
          disabled={!isConnected}
          style={{ padding: '10px 20px', marginRight: 10 }}
        >
          Test Emit
        </button>
        <button
          onClick={handleJoin}
          disabled={!isConnected}
          style={{ padding: '10px 20px', marginRight: 10 }}
        >
          Join Room
        </button>
        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          style={{ padding: '10px 20px', marginRight: 10 }}
        >
          Disconnect
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2>Event Log (Last 20)</h2>
        <div style={{
          backgroundColor: '#1a1a1a',
          color: '#22c55e',
          padding: 10,
          height: 400,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          fontSize: 12,
        }}>
          {events.length === 0 ? (
            <div>No events yet...</div>
          ) : (
            events.map((event, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <span style={{ color: '#888' }}>[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{event.event}</span>
                {event.data && (
                  <span style={{ color: '#aaa' }}> {JSON.stringify(event.data)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: 10, backgroundColor: '#f5f5f5' }}>
        <h3>Test Checklist</h3>
        <ul>
          <li style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
            ✅ Connection establishes: {isConnected ? 'YES' : 'NO'}
          </li>
          <li style={{ color: connectionState === 'connected' ? '#22c55e' : '#ef4444' }}>
            ✅ State updates correctly: {connectionState}
          </li>
          <li style={{ color: socketId ? '#22c55e' : '#ef4444' }}>
            ✅ Socket ID available: {socketId ? 'YES' : 'NO'}
          </li>
          <li style={{ color: events.length > 0 ? '#22c55e' : '#888' }}>
            ✅ Events received: {events.length}
          </li>
        </ul>
      </div>
    </div>
  );
}

export function SocketTestV2() {
  const { isAuthenticated, username } = useAuthContext();
  
  return (
    <ChatProvider
      username={username}
      isAuthenticated={isAuthenticated}
      currentView="chat"
    >
      <SocketTestV2Content />
    </ChatProvider>
  );
}

