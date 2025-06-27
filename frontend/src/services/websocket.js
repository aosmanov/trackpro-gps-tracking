import { io } from 'socket.io-client';
import { authService } from './auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = authService.getToken();
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return null;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('error', error);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Real-time event handlers
    this.socket.on('location-update', (data) => {
      this.emit('location-update', data);
    });

    this.socket.on('job-status-update', (data) => {
      this.emit('job-status-update', data);
    });

    this.socket.on('job-status-updated', (data) => {
      this.emit('job-status-updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Event emitter methods
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event handler:', error);
        }
      });
    }
  }

  // Public methods for sending data
  updateLocation(jobId, latitude, longitude, additionalData = {}) {
    if (this.socket && this.isConnected) {
      this.socket.emit('location-update', {
        jobId,
        latitude,
        longitude,
        ...additionalData
      });
    }
  }

  updateJobStatus(jobId, status, notes = '') {
    if (this.socket && this.isConnected) {
      this.socket.emit('job-status-update', {
        jobId,
        status,
        notes
      });
    }
  }

  joinTracking(trackingCode) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-tracking', trackingCode);
    }
  }

  leaveTracking(trackingCode) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-tracking', trackingCode);
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;