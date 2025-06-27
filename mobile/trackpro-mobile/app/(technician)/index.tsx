import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../services/auth';
import { apiService } from '../../services/api';
import { locationTrackingService } from '../../services/locationTracking';

interface Job {
  id: string;
  job_number: string;
  service_type: string;
  description: string;
  status: string;
  customer_address: string;
  scheduled_start: string;
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export default function TechnicianJobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<any>(null);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    loadJobs();
    initializeLocationTracking();
    
    // Update tracking status every 5 seconds
    const interval = setInterval(() => {
      setTrackingStatus(locationTrackingService.getTrackingStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const initializeLocationTracking = async () => {
    const initialized = await locationTrackingService.initialize();
    if (!initialized) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to use GPS tracking features.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadJobs = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const response = await apiService.getTechnicianJobs(currentUser.id);
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setJobs(response.data || []);
        
        // Auto-start tracking for en_route jobs
        const enRouteJobs = (response.data || []).filter((job: Job) => job.status === 'en_route');
        if (enRouteJobs.length > 0 && !trackingStatus?.isTracking) {
          const mostRecentJob = enRouteJobs[0];
          await startLocationTracking(mostRecentJob.id);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load jobs');
      console.error('Load jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const response = await apiService.updateJobStatus(jobId, newStatus);
      
      if (response.error) {
        Alert.alert('Error', response.error);
        return;
      }

      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));

      // Handle location tracking
      await handleLocationTracking(jobId, newStatus);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status');
      console.error('Update status error:', error);
    }
  };

  const startLocationTracking = async (jobId: string) => {
    const result = await locationTrackingService.startTracking(jobId);
    if (!result.success) {
      Alert.alert('Location Tracking Error', result.error || 'Failed to start tracking');
    }
  };

  const handleLocationTracking = async (jobId: string, status: string) => {
    switch (status) {
      case 'en_route':
        await startLocationTracking(jobId);
        break;
      case 'completed':
      case 'cancelled':
        await locationTrackingService.stopTracking();
        break;
    }
  };

  const makePhoneCall = (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: '#3B82F6',
      en_route: '#F59E0B',
      arrived: '#F97316',
      in_progress: '#8B5CF6',
      completed: '#10B981',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const renderJob = ({ item }: { item: Job }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.service_type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.jobNumber}>{item.job_number}</Text>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {item.customers.first_name} {item.customers.last_name}
        </Text>
        <Text style={styles.customerAddress}>{item.customer_address}</Text>
      </View>

      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      <View style={styles.actions}>
        {item.status === 'assigned' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => updateJobStatus(item.id, 'en_route')}
          >
            <Ionicons name="car-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Traveling</Text>
          </TouchableOpacity>
        )}

        {item.status === 'en_route' && (
          <>
            {!trackingStatus?.isTracking && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                onPress={() => startLocationTracking(item.id)}
              >
                <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Start Tracking</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F97316' }]}
              onPress={() => updateJobStatus(item.id, 'arrived')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark Arrived</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status === 'arrived' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => updateJobStatus(item.id, 'in_progress')}
          >
            <Ionicons name="construct-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}

        {item.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => updateJobStatus(item.id, 'completed')}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Complete Job</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
          onPress={() => makePhoneCall(item.customers.phone)}
        >
          <Ionicons name="call-outline" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Call Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {trackingStatus?.isTracking && (
        <View style={styles.trackingBanner}>
          <Ionicons name="location" size={16} color="#10B981" />
          <Text style={styles.trackingText}>GPS Tracking Active</Text>
        </View>
      )}

      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptySubtitle}>Check back later for new assignments</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  trackingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  trackingText: {
    marginLeft: 8,
    color: '#065F46',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  jobNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});