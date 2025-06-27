import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService } from '../../services/auth';
import { locationTrackingService } from '../../services/locationTracking';

export default function ProfileScreen() {
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            // Stop any active tracking
            await locationTrackingService.stopTracking();
            // Logout
            await authService.logout();
            // Navigate to login
            router.replace('/login');
          }
        }
      ]
    );
  };

  const ProfileItem = ({ icon, title, value, onPress }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon as any} size={24} color="#6B7280" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
        </View>

        <View style={styles.profileSection}>
          <ProfileItem
            icon="person-outline"
            title="Name"
            value={`${user?.first_name} ${user?.last_name}`}
          />
          <ProfileItem
            icon="mail-outline"
            title="Email"
            value={user?.email}
          />
          {user?.phone && (
            <ProfileItem
              icon="call-outline"
              title="Phone"
              value={user?.phone}
            />
          )}
          <ProfileItem
            icon="business-outline"
            title="Role"
            value={user?.role}
          />
        </View>

        <View style={styles.actionSection}>
          <ProfileItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => {
              Alert.alert('Coming Soon', 'Notification settings will be available in a future update.');
            }}
          />
          <ProfileItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {
              Alert.alert('Help & Support', 'For support, please contact your company administrator.');
            }}
          />
          <ProfileItem
            icon="information-circle-outline"
            title="About"
            onPress={() => {
              Alert.alert('TrackPro Mobile', 'Version 1.0.0\n\nService tracking platform for technicians and customers.');
            }}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});