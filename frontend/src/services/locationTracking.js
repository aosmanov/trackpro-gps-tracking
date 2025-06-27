import websocketService from './websocket';

class LocationTrackingService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.currentJobId = null;
    this.lastPosition = null;
    this.trackingInterval = null;
    this.backgroundSync = null;
    this.locationHistory = [];
    this.currentInterval = 5000; // Track current update interval
    this.drivingMetrics = {
      speed: 0,
      acceleration: 0,
      lastSpeed: 0,
      harshBraking: 0,
      harshAcceleration: 0,
      score: 100
    };
    
    // Uber-style configuration (5-second updates like Uber)
    this.config = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0, // Always get fresh GPS reading (no cache)
      updateInterval: 2000, // Update every 2 seconds (more like Uber)
      minDistanceChange: 3, // Minimum 3 meters before update (more sensitive)
      backgroundUpdateInterval: 15000, // Background updates every 15 seconds
      movingThreshold: 1, // Speed threshold to consider "moving" (m/s)
      stationaryInterval: 30000, // When stationary, update every 30 seconds
      highSpeedInterval: 1000, // When moving fast, update every 1 second
      geofenceRadius: 50 // Arrival detection radius in meters
    };

    // Wake lock for keeping screen/GPS active
    this.wakeLock = null;
    
    // Listen for page visibility changes
    this.setupVisibilityHandlers();
  }

  // Start continuous location tracking for a job
  async startTracking(jobId) {
    if (this.isTracking) {
      console.log('Stopping existing tracking before starting new one');
      this.stopTracking();
    }

    console.log(`🎯 Starting enhanced location tracking for job ${jobId}`);
    this.currentJobId = jobId;
    this.isTracking = true;

    try {
      // Request permissions
      await this.requestPermissions();
      
      // Keep screen awake for better GPS
      await this.requestWakeLock();
      
      // Start GPS watching
      this.startGPSWatch();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      // Setup background sync
      this.setupBackgroundSync();
      
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      this.stopTracking();
      throw error;
    }
  }

  // Stop location tracking
  stopTracking() {
    console.log('Stopping location tracking');
    
    this.isTracking = false;
    this.currentJobId = null;
    
    // Clear GPS watch
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    // Clear intervals
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    // Release wake lock
    this.releaseWakeLock();
    
    // Clear background sync
    if (this.backgroundSync) {
      clearInterval(this.backgroundSync);
      this.backgroundSync = null;
    }
  }

  // Request necessary permissions
  async requestPermissions() {
    console.log('🔐 Requesting location permissions...');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    // Request permission for notifications (for background updates)
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('📱 Requesting notification permission...');
      await Notification.requestPermission();
    }

    // Test geolocation access
    return new Promise((resolve, reject) => {
      console.log('📍 Testing geolocation access...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Geolocation permission granted!');
          console.log('📍 Current position:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          console.log('🔍 Full position object:', position);
          resolve(position);
        },
        (error) => {
          console.error('❌ Geolocation permission denied:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          reject(new Error('Location permission denied'));
        },
        {
          enableHighAccuracy: true, // Force high accuracy GPS
          timeout: this.config.timeout,
          maximumAge: 0 // Don't use any cached position, get fresh GPS reading
        }
      );
    });
  }

  // Request wake lock to keep screen active
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock acquired');
        
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake lock released');
        });
      } catch (error) {
        console.warn('Could not acquire wake lock:', error);
      }
    }
  }

  // Release wake lock
  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // Start GPS position watching
  startGPSWatch() {
    const options = {
      enableHighAccuracy: this.config.enableHighAccuracy,
      timeout: this.config.timeout,
      maximumAge: this.config.maximumAge
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      options
    );
  }

  // Handle position updates with Uber-style enhancements
  handlePositionUpdate(position) {
    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    const timestamp = new Date().toISOString();
    const currentSpeed = speed || 0;

    console.log('🌍 Raw GPS position received:', {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: new Date().toLocaleString()
    });

    // Calculate driving metrics
    this.updateDrivingMetrics(currentSpeed, timestamp);
    
    // Add to location history trail
    this.addToLocationHistory(position);
    
    // Check if we should send this update
    if (this.shouldSendUpdate(position)) {
      const locationData = {
        latitude,
        longitude,
        accuracy,
        speed: currentSpeed,
        heading: heading || 0,
        timestamp,
        drivingScore: this.drivingMetrics.score,
        isMoving: this.isMoving(currentSpeed),
        confidence: this.calculateLocationConfidence(position)
      };

      // Send via WebSocket for real-time updates
      this.sendLocationUpdate(locationData);
      
      // Store last position
      this.lastPosition = position;
      
      // Store in localStorage for offline sync
      this.storeOfflineLocation(locationData);
      
      // Adjust update frequency based on movement
      this.adjustUpdateFrequency(currentSpeed);
      
      console.log('Location updated:', locationData);
    }
  }

  // Determine if we should send location update
  shouldSendUpdate(position) {
    if (!this.lastPosition) return true;
    
    // Calculate distance from last position
    const distance = this.calculateDistance(
      this.lastPosition.coords.latitude,
      this.lastPosition.coords.longitude,
      position.coords.latitude,
      position.coords.longitude
    );
    
    // Send if moved more than minimum distance
    return distance >= this.config.minDistanceChange;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Send enhanced location update via WebSocket and HTTP fallback
  sendLocationUpdate(locationData) {
    if (this.currentJobId) {
      // Try WebSocket first
      if (websocketService.isSocketConnected()) {
        console.log('📡 Sending location via WebSocket');
        websocketService.updateLocation(
          this.currentJobId,
          locationData.latitude,
          locationData.longitude,
          {
            accuracy: locationData.accuracy,
            speed: locationData.speed,
            heading: locationData.heading,
            timestamp: locationData.timestamp,
            drivingScore: locationData.drivingScore,
            isMoving: locationData.isMoving,
            confidence: locationData.confidence
          }
        );
      } else {
        // Fallback to HTTP API if WebSocket fails
        console.log('🌐 WebSocket not connected, using HTTP API fallback');
        this.sendLocationViaHTTP(locationData);
      }
    }
  }

  // HTTP fallback for location updates
  async sendLocationViaHTTP(locationData) {
    try {
      const url = `http://localhost:3001/api/jobs/${this.currentJobId}/location`;
      console.log('🌐 Sending location to:', url);
      console.log('📍 FRESH GPS Location data being sent:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
        timestamp: new Date().toLocaleTimeString()
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading
        })
      });
      
      const responseText = await response.text();
      console.log('📡 HTTP response status:', response.status);
      console.log('📡 HTTP response body:', responseText);
      
      if (response.ok) {
        console.log('✅ Location sent via HTTP API successfully');
      } else {
        console.error('❌ HTTP location update failed:', response.status, responseText);
      }
    } catch (error) {
      console.error('❌ HTTP location update error:', error);
    }
  }

  // Handle position errors
  handlePositionError(error) {
    console.error('GPS position error:', error);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('Location access denied by user');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.error('Location request timeout');
        break;
    }
    
    // Try to continue tracking despite errors
    setTimeout(() => {
      if (this.isTracking) {
        this.startGPSWatch();
      }
    }, 5000);
  }

  // Start periodic updates (backup to GPS watching)
  startPeriodicUpdates() {
    this.trackingInterval = setInterval(() => {
      if (this.isTracking && this.currentJobId) {
        navigator.geolocation.getCurrentPosition(
          (position) => this.handlePositionUpdate(position),
          (error) => console.warn('Periodic position update failed:', error),
          {
            enableHighAccuracy: false, // Use cached position for periodic updates
            timeout: 10000,
            maximumAge: 30000
          }
        );
      }
    }, this.config.updateInterval);
  }

  // Setup background sync for offline locations
  setupBackgroundSync() {
    // Background sync for when app is in background
    this.backgroundSync = setInterval(() => {
      if (this.isTracking) {
        this.syncOfflineLocations();
      }
    }, this.config.backgroundUpdateInterval);
  }

  // Store location for offline sync
  storeOfflineLocation(locationData) {
    try {
      const offlineLocations = JSON.parse(localStorage.getItem('offline_locations') || '[]');
      offlineLocations.push({
        jobId: this.currentJobId,
        ...locationData,
        synced: false
      });
      
      // Keep only last 100 locations
      if (offlineLocations.length > 100) {
        offlineLocations.splice(0, offlineLocations.length - 100);
      }
      
      localStorage.setItem('offline_locations', JSON.stringify(offlineLocations));
    } catch (error) {
      console.warn('Failed to store offline location:', error);
    }
  }

  // Sync offline locations when connection is restored
  async syncOfflineLocations() {
    try {
      const offlineLocations = JSON.parse(localStorage.getItem('offline_locations') || '[]');
      const unsynced = offlineLocations.filter(loc => !loc.synced);
      
      if (unsynced.length > 0 && websocketService.isSocketConnected()) {
        console.log(`Syncing ${unsynced.length} offline locations`);
        
        for (const location of unsynced) {
          websocketService.updateLocation(
            location.jobId,
            location.latitude,
            location.longitude
          );
          location.synced = true;
        }
        
        localStorage.setItem('offline_locations', JSON.stringify(offlineLocations));
      }
    } catch (error) {
      console.warn('Failed to sync offline locations:', error);
    }
  }

  // Setup page visibility handlers for background tracking
  setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('App went to background');
        // Reduce update frequency in background
        if (this.isTracking) {
          this.adjustForBackground();
        }
      } else {
        console.log('App came to foreground');
        // Resume normal tracking
        if (this.isTracking) {
          this.adjustForForeground();
        }
        // Sync any offline locations
        this.syncOfflineLocations();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.syncOfflineLocations();
    });
  }

  // Adjust tracking for background mode
  adjustForBackground() {
    // Increase update interval in background to save battery
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = setInterval(() => {
        if (this.isTracking && this.currentJobId) {
          navigator.geolocation.getCurrentPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => console.warn('Background position update failed:', error),
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000
            }
          );
        }
      }, this.config.backgroundUpdateInterval);
    }
  }

  // Adjust tracking for foreground mode
  adjustForForeground() {
    // Resume normal update interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.startPeriodicUpdates();
    }
  }

  // Update driving metrics (Uber-style behavior tracking)
  updateDrivingMetrics(currentSpeed, timestamp) {
    const speedKmh = currentSpeed * 3.6; // Convert m/s to km/h
    const acceleration = (currentSpeed - this.drivingMetrics.lastSpeed) / 5; // Per 5-second interval
    
    this.drivingMetrics.speed = speedKmh;
    this.drivingMetrics.acceleration = acceleration;
    
    // Detect harsh braking (deceleration > 3 m/s²)
    if (acceleration < -3) {
      this.drivingMetrics.harshBraking++;
      this.drivingMetrics.score = Math.max(0, this.drivingMetrics.score - 5);
    }
    
    // Detect harsh acceleration (acceleration > 3 m/s²)
    if (acceleration > 3) {
      this.drivingMetrics.harshAcceleration++;
      this.drivingMetrics.score = Math.max(0, this.drivingMetrics.score - 3);
    }
    
    this.drivingMetrics.lastSpeed = currentSpeed;
  }

  // Add location to history trail
  addToLocationHistory(position) {
    this.locationHistory.push({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date().toISOString(),
      speed: position.coords.speed || 0
    });
    
    // Keep only last 50 positions (like current LiveTrackingMap)
    if (this.locationHistory.length > 50) {
      this.locationHistory.shift();
    }
  }

  // Check if technician is moving
  isMoving(speed) {
    return (speed || 0) > this.config.movingThreshold;
  }

  // Calculate location confidence score
  calculateLocationConfidence(position) {
    const accuracy = position.coords.accuracy;
    
    if (accuracy <= 5) return 'high';
    if (accuracy <= 20) return 'medium';
    if (accuracy <= 50) return 'low';
    return 'very_low';
  }

  // Adjust update frequency based on movement (Uber-style optimization)
  adjustUpdateFrequency(speed) {
    if (!this.trackingInterval) return;
    
    const isMoving = this.isMoving(speed);
    const isHighSpeed = speed > 15; // Above 15 m/s (54 km/h)
    
    let newInterval;
    if (!isMoving) {
      newInterval = this.config.stationaryInterval; // 30 seconds when stationary
    } else if (isHighSpeed) {
      newInterval = this.config.highSpeedInterval; // 3 seconds when moving fast
    } else {
      newInterval = this.config.updateInterval; // 5 seconds normal
    }
    
    // Only restart interval if frequency changed significantly
    if (Math.abs(newInterval - this.currentInterval) > 2000) {
      this.currentInterval = newInterval;
      this.restartPeriodicUpdates(newInterval);
    }
  }

  // Restart periodic updates with new interval
  restartPeriodicUpdates(interval) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    
    this.trackingInterval = setInterval(() => {
      if (this.isTracking && this.currentJobId) {
        navigator.geolocation.getCurrentPosition(
          (position) => this.handlePositionUpdate(position),
          (error) => console.warn('Periodic position update failed:', error),
          {
            enableHighAccuracy: this.isMoving(this.drivingMetrics.speed / 3.6),
            timeout: 10000,
            maximumAge: interval > 10000 ? 30000 : 5000
          }
        );
      }
    }, interval);
  }

  // Check if technician has arrived at destination
  checkArrival(customerLatitude, customerLongitude) {
    if (!this.lastPosition) return false;
    
    const distance = this.calculateDistance(
      this.lastPosition.coords.latitude,
      this.lastPosition.coords.longitude,
      customerLatitude,
      customerLongitude
    );
    
    return distance <= this.config.geofenceRadius;
  }

  // Get location trail for map visualization
  getLocationTrail() {
    return this.locationHistory;
  }

  // Get driving score and metrics
  getDrivingMetrics() {
    return {
      ...this.drivingMetrics,
      totalDistance: this.calculateTotalDistance(),
      averageSpeed: this.calculateAverageSpeed()
    };
  }

  // Calculate total distance traveled
  calculateTotalDistance() {
    if (this.locationHistory.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      totalDistance += this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }
    
    return totalDistance;
  }

  // Calculate average speed
  calculateAverageSpeed() {
    if (this.locationHistory.length === 0) return 0;
    
    const totalSpeed = this.locationHistory.reduce((sum, point) => sum + (point.speed || 0), 0);
    return (totalSpeed / this.locationHistory.length) * 3.6; // Convert to km/h
  }

  // Get current tracking status with enhanced metrics
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      jobId: this.currentJobId,
      lastPosition: this.lastPosition,
      hasWakeLock: !!this.wakeLock,
      drivingMetrics: this.getDrivingMetrics(),
      locationHistory: this.locationHistory,
      isMoving: this.lastPosition ? this.isMoving(this.lastPosition.coords.speed || 0) : false
    };
  }
}

// Create singleton instance
const locationTrackingService = new LocationTrackingService();

export default locationTrackingService;