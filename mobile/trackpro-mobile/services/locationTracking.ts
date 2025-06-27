import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { apiService } from './api';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface TrackingStatus {
  isTracking: boolean;
  currentJobId: string | null;
  lastLocation: LocationData | null;
  lastUpdate: string | null;
}

class LocationTrackingService {
  private isTracking = false;
  private currentJobId: string | null = null;
  private lastLocation: LocationData | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private trackingOptions: Location.LocationOptions = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000, // Update every 2 seconds (more frequent than web)
    distanceInterval: 3, // Update every 3 meters
  };

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Foreground location permission not granted');
        return false;
      }

      // Request background permissions for when app is backgrounded
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission not granted - tracking will pause when app is backgrounded');
      }

      // Define background task
      TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
        if (error) {
          console.error('Background location task error:', error);
          return;
        }
        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          const location = locations[0];
          if (location && this.currentJobId) {
            await this.sendLocationUpdate(location, this.currentJobId);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Location service initialization error:', error);
      return false;
    }
  }

  async startTracking(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isTracking) {
        await this.stopTracking();
      }

      console.log(`🎯 Starting enhanced location tracking for job ${jobId}`);
      
      this.currentJobId = jobId;
      this.isTracking = true;

      // Start foreground location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        this.trackingOptions,
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000, // Less frequent for battery saving
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'TrackPro - Location Tracking',
          notificationBody: 'Sharing your location with customers',
        },
      });

      console.log('✅ Location tracking started successfully');
      return { success: true };
    } catch (error) {
      this.isTracking = false;
      this.currentJobId = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start tracking',
      };
    }
  }

  async stopTracking(): Promise<void> {
    console.log('🛑 Stopping location tracking');
    
    this.isTracking = false;
    this.currentJobId = null;

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.warn('Error stopping background location updates:', error);
    }
  }

  private handleLocationUpdate(location: Location.LocationObject): void {
    if (!this.currentJobId) return;

    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('📍 Native GPS location received:', {
      lat: locationData.latitude,
      lng: locationData.longitude,
      accuracy: locationData.accuracy,
      timestamp: new Date().toLocaleTimeString(),
    });

    this.lastLocation = locationData;
    this.sendLocationUpdate(location, this.currentJobId);
  }

  private async sendLocationUpdate(location: Location.LocationObject, jobId: string): Promise<void> {
    try {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
      };

      console.log('🌐 Sending location to server:', locationData);

      const response = await apiService.updateJobLocation(jobId, locationData);

      if (response.error) {
        console.error('❌ Failed to send location:', response.error);
      } else {
        console.log('✅ Location sent successfully');
      }
    } catch (error) {
      console.error('❌ Location update error:', error);
    }
  }

  getTrackingStatus(): TrackingStatus {
    return {
      isTracking: this.isTracking,
      currentJobId: this.currentJobId,
      lastLocation: this.lastLocation,
      lastUpdate: this.lastLocation?.timestamp || null,
    };
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async checkLocationPermissions(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }
}

export const locationTrackingService = new LocationTrackingService();
export default locationTrackingService;