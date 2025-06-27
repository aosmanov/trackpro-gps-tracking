import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { locationTrackingService } from '../../services/locationTracking';

export default function TrackingScreen() {
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    setTrackingStatus(locationTrackingService.getTrackingStatus());
  };

  const getCurrentLocation = async () => {
    const location = await locationTrackingService.getCurrentLocation();
    setCurrentLocation(location);
  };

  const stopTracking = async () => {
    Alert.alert(
      'Stop Tracking',
      'Are you sure you want to stop location tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: () => locationTrackingService.stopTracking()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={trackingStatus?.isTracking ? "location" : "location-outline"} 
              size={32} 
              color={trackingStatus?.isTracking ? "#10B981" : "#6B7280"} 
            />
            <Text style={styles.statusTitle}>
              {trackingStatus?.isTracking ? "GPS Tracking Active" : "GPS Tracking Inactive"}
            </Text>
          </View>

          {trackingStatus?.isTracking && (
            <View style={styles.trackingInfo}>
              <Text style={styles.jobId}>Job: {trackingStatus.currentJobId}</Text>
              {trackingStatus.lastUpdate && (
                <Text style={styles.lastUpdate}>
                  Last Update: {new Date(trackingStatus.lastUpdate).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>

        {trackingStatus?.lastLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Current Location</Text>
            <Text style={styles.coordinates}>
              Lat: {trackingStatus.lastLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinates}>
              Lng: {trackingStatus.lastLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracy}>
              Accuracy: {trackingStatus.lastLocation.accuracy.toFixed(0)}m
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={getCurrentLocation}
          >
            <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Get Current Location</Text>
          </TouchableOpacity>

          {trackingStatus?.isTracking && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.stopButton]}
              onPress={stopTracking}
            >
              <Ionicons name="stop-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.stopButtonText]}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Manual Location Check</Text>
            <Text style={styles.coordinates}>
              Lat: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinates}>
              Lng: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracy}>
              Accuracy: {currentLocation.accuracy.toFixed(0)}m
            </Text>
            <Text style={styles.timestamp}>
              {new Date(currentLocation.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  trackingInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  jobId: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  lastUpdate: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  accuracy: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopButton: {
    borderColor: '#EF4444',
  },
  stopButtonText: {
    color: '#EF4444',
  },
});