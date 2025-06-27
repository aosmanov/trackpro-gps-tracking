import { useState, useEffect } from 'react';
import websocketService from '../services/websocket';

export default function ConnectionStatus() {
  const [status, setStatus] = useState({ connected: false, socketId: null });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(websocketService.getConnectionStatus());
    };

    // Initial status
    updateStatus();

    // Listen for connection changes
    websocketService.on('connected', updateStatus);
    websocketService.on('disconnected', updateStatus);
    websocketService.on('error', updateStatus);

    // Periodic status check
    const interval = setInterval(updateStatus, 5000);

    return () => {
      clearInterval(interval);
      websocketService.off('connected', updateStatus);
      websocketService.off('disconnected', updateStatus);
      websocketService.off('error', updateStatus);
    };
  }, []);

  if (!status.connected) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span>Live Updates Active</span>
    </div>
  );
}