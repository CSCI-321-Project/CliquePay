import { SecurityUtils } from "../../utils/Security.js";
import { EventSourcePolyfill } from "event-source-polyfill";

class EventSourceService {
  constructor() {
    this.eventSource = null;
    this.listeners = {};
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeoutId = null;
  }

  async connect(userId) {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      const token = await SecurityUtils.getCookie("idToken");
      if (!token) {
        console.error("Cannot connect: No auth token available");
        return false;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      // Remove token from URL
      const url = `${API_URL}/events/user-${userId}/`;
      console.log(`Connecting to SSE at: ${url}`);

      // Create a custom EventSource with authorization header
      this.eventSource = new EventSourcePolyfill(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      
      this.eventSource.onopen = () => {
        console.log("SSE connection established");
        this.connected = true;
        this.reconnectAttempts = 0;
        this._notifyListeners('connect');
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        this.connected = false;
        this._notifyListeners('error', error);
        this._handleReconnect(userId);
      };

      this.eventSource.addEventListener('heartbeat', (e) => {
        console.log('Heartbeat received:', JSON.parse(e.data));
      });
      
      this.eventSource.addEventListener('connection_established', (e) => {
        console.log('Connection established event:', JSON.parse(e.data));
      });

      this.eventSource.addEventListener('message', (event) => {
        console.log('Message received through SSE:', event);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed message data:', data);
          this._notifyListeners('message', data);
          handleSSEMessage(data);
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to establish SSE connection:", error);
      return false;
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connected = false;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  _handleReconnect(userId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect(userId);
      }, delay);
    } else {
      console.error("Max SSE reconnection attempts reached");
      this._notifyListeners('reconnect_failed');
    }
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

const handleSSEMessage = (data) => {
  console.log('handleSSEMessage called with:', data);
  
  if (data.type === 'direct_message' || data.type === 'group_message') {
    console.log('Processing new message from SSE:', data);
    
    // Your existing code to handle the message...
    
    // Force re-render if needed
    setMessages(prev => [...prev]);
  }
};

export default new EventSourceService();