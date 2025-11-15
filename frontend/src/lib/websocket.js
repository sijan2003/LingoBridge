/**
 * WebSocket utility functions for connecting to the Django Channels backend
 */

/**
 * Get WebSocket URL with authentication token
 * @param {string} path - WebSocket path (e.g., '/ws/chat/')
 * @param {string} token - JWT authentication token
 * @returns {string} WebSocket URL
 */
export function getWebSocketURL(path, token) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use backend URL for WebSocket connection - extract from API endpoint
  const apiUrl = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  // Remove /api suffix if present
  const baseUrl = apiUrl.replace(/\/api\/?$/, '');
  const url = new URL(baseUrl);
  // Use the hostname and port from the API URL
  const host = process.env.REACT_APP_WS_HOST || `${url.hostname}${url.port ? ':' + url.port : ''}`;
  const wsPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build WebSocket URL with token as query parameter
  return `${protocol}//${host}${wsPath}?token=${token}`;
}

/**
 * Create a WebSocket connection with retry logic
 * @param {string} url - WebSocket URL
 * @param {Function} onMessage - Message handler callback
 * @param {Function} onError - Error handler callback
 * @param {Function} onOpen - Open handler callback
 * @param {Function} onClose - Close handler callback
 * @returns {Object} WebSocket wrapper with reconnect functionality
 */
export function createWebSocket(url, onMessage, onError, onOpen, onClose) {
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  let reconnectTimer = null;
  let isManualClose = false;

  const connect = () => {
    try {
      console.log('Connecting to WebSocket:', url);
      ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('WebSocket connected successfully');
        reconnectAttempts = 0;
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        if (onMessage) onMessage(event);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL was:', url);
        console.error('WebSocket readyState:', ws?.readyState);
        if (onError) onError(error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        if (onClose) onClose(event);
        
        // Auto-reconnect if not manually closed and haven't exceeded max attempts
        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
          reconnectTimer = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      console.error('WebSocket URL was:', url);
      if (onError) onError(error);
    }
  };

  // Start initial connection
  connect();

  return {
    ws: () => ws,
    reconnect: () => {
      isManualClose = false;
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.close();
      }
      connect();
    },
    close: () => {
      isManualClose = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    send: (data) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      } else {
        console.error('WebSocket is not open');
      }
    }
  };
}

