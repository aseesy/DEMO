/**
 * Socket Diagnostic Component
 *
 * Navigate to this page to see detailed socket connection diagnostics.
 * URL: http://localhost:5173/socket-diagnostic
 */
import React, { useEffect, useState } from 'react';
import { socketService } from './services/socket';
import { tokenManager } from './utils/tokenManager';
import { API_BASE_URL, SOCKET_URL } from './config.js';

function SocketDiagnostic() {
  const [state, setState] = useState({
    timestamp: new Date().toISOString(),
    tokenExists: false,
    tokenLength: 0,
    tokenPreview: '',
    socketUrl: SOCKET_URL,
    apiUrl: API_BASE_URL,
    connectionState: 'unknown',
    isConnected: false,
    socketId: null,
    socketExists: false,
    managerExists: false,
    errors: [],
    logs: [],
  });

  const addLog = (message) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-20), `${new Date().toISOString()}: ${message}`]
    }));
  };

  const refresh = () => {
    const token = tokenManager.getToken();
    setState(prev => ({
      ...prev,
      timestamp: new Date().toISOString(),
      tokenExists: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'NO TOKEN',
      connectionState: socketService.getConnectionState(),
      isConnected: socketService.isConnected(),
      socketId: socketService.getSocketId(),
      socketExists: !!socketService.socket,
      managerExists: !!socketService.socket?.io,
    }));
  };

  // Auto-refresh every 2 seconds (reduced from 1s to save CPU)
  // Only refresh when page is visible
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsub = socketService.subscribeToState(connState => {
      addLog(`Connection state changed to: ${connState}`);
    });
    return unsub;
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const events = ['connect', 'disconnect', 'connect_error', 'reconnect', 'reconnect_attempt', 'join_success', 'message_history'];
    const unsubs = events.map(event =>
      socketService.subscribe(event, (data) => {
        addLog(`Event '${event}': ${JSON.stringify(data || {}).substring(0, 100)}`);
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);

  const handleConnect = () => {
    const token = tokenManager.getToken();
    addLog(`Manual connect called with token: ${token ? 'present' : 'MISSING'}`);
    if (token) {
      const result = socketService.connect(token);
      addLog(`Connect result: ${result}`);
    } else {
      addLog('Cannot connect - no token!');
    }
  };

  const handleDisconnect = () => {
    addLog('Manual disconnect called');
    socketService.disconnect();
  };

  const handleTestEndpoint = async () => {
    addLog('Testing socket.io endpoint directly...');
    try {
      const response = await fetch(`${API_BASE_URL}/socket.io/?EIO=4&transport=polling`, {
        method: 'GET',
        credentials: 'include',
      });
      const text = await response.text();
      addLog(`Endpoint response (${response.status}): ${text.substring(0, 100)}`);
    } catch (err) {
      addLog(`Endpoint test FAILED: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14 }}>
      <h1>Socket Connection Diagnostic</h1>
      <p>Timestamp: {state.timestamp}</p>

      <h2>Configuration</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td>SOCKET_URL</td>
            <td>{state.socketUrl}</td>
          </tr>
          <tr>
            <td>API_BASE_URL</td>
            <td>{state.apiUrl}</td>
          </tr>
        </tbody>
      </table>

      <h2>Token Status</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td>Token Exists</td>
            <td style={{ backgroundColor: state.tokenExists ? '#22c55e' : '#ef4444', color: 'white' }}>
              {state.tokenExists ? 'YES' : 'NO'}
            </td>
          </tr>
          <tr>
            <td>Token Length</td>
            <td>{state.tokenLength}</td>
          </tr>
          <tr>
            <td>Token Preview</td>
            <td style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>{state.tokenPreview}</td>
          </tr>
        </tbody>
      </table>

      <h2>Socket Status</h2>
      <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td>Connection State</td>
            <td style={{
              backgroundColor: state.connectionState === 'connected' ? '#22c55e' :
                              state.connectionState === 'connecting' ? '#f59e0b' : '#ef4444',
              color: 'white'
            }}>
              {state.connectionState}
            </td>
          </tr>
          <tr>
            <td>Is Connected</td>
            <td style={{ backgroundColor: state.isConnected ? '#22c55e' : '#ef4444', color: 'white' }}>
              {state.isConnected ? 'YES' : 'NO'}
            </td>
          </tr>
          <tr>
            <td>Socket ID</td>
            <td>{state.socketId || 'N/A'}</td>
          </tr>
          <tr>
            <td>Socket Object Exists</td>
            <td>{state.socketExists ? 'YES' : 'NO'}</td>
          </tr>
          <tr>
            <td>Manager Exists</td>
            <td>{state.managerExists ? 'YES' : 'NO'}</td>
          </tr>
        </tbody>
      </table>

      <h2>Actions</h2>
      <button onClick={handleConnect} style={{ padding: '10px 20px', marginRight: 10 }}>
        Connect Socket
      </button>
      <button onClick={handleDisconnect} style={{ padding: '10px 20px', marginRight: 10 }}>
        Disconnect Socket
      </button>
      <button onClick={handleTestEndpoint} style={{ padding: '10px 20px', marginRight: 10, backgroundColor: '#fbbf24' }}>
        Test Endpoint
      </button>
      <button onClick={refresh} style={{ padding: '10px 20px' }}>
        Refresh Status
      </button>

      <h2>Event Log</h2>
      <div style={{
        backgroundColor: '#1a1a1a',
        color: '#22c55e',
        padding: 10,
        height: 300,
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {state.logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
        {state.logs.length === 0 && <div>No events yet...</div>}
      </div>

      <h2>LocalStorage Check</h2>
      <pre style={{ backgroundColor: '#f5f5f5', padding: 10, overflow: 'auto' }}>
        {JSON.stringify({
          auth_token_backup: localStorage.getItem('auth_token_backup')?.substring(0, 50) + '...' || 'null',
          isAuthenticated: localStorage.getItem('isAuthenticated'),
          username: localStorage.getItem('username'),
        }, null, 2)}
      </pre>
    </div>
  );
}

export default SocketDiagnostic;
