import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { authService } from '../services/auth';
import { apiService } from '../services/api';

export default function TechnicianLoginScreen() {
  const [phone, setPhone] = useState('(617) 555-0102');
  const [pin, setPin] = useState('tech123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('🔄 Technician login button clicked');
    console.log('📱 Phone:', phone);
    console.log('🔢 PIN length:', pin.length);
    
    if (!phone.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please enter both phone number and PIN');
      return;
    }

    setLoading(true);
    console.log('⏳ Setting loading to true');
    
    try {
      console.log('🚀 Calling technicianLogin...');
      console.log('📤 Sending data:', { phone: phone.trim(), pin: pin.trim() });
      const result = await apiService.technicianLogin(phone.trim(), pin.trim());
      console.log('📥 Login result:', result);
      console.log('📥 Full result object:', JSON.stringify(result, null, 2));
      
      if (result.data?.token && result.data?.user) {
        // Manually handle the technician login response
        await authService.setAuthData(result.data.token, result.data.user);
        
        const user = authService.getCurrentUser();
        console.log('👤 Current user:', user);
        
        if (user?.role === 'technician') {
          console.log('➡️ Redirecting to technician dashboard');
          router.replace('/(technician)');
        } else {
          Alert.alert('Error', 'Invalid user role');
          await authService.logout();
        }
      } else {
        console.log('❌ Login failed:', result.error);
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.log('💥 Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TrackPro</Text>
          <Text style={styles.subtitle}>Technician Login</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 555-5555"
            keyboardType="phone-pad"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Enter your PIN"
            keyboardType="default"
            secureTextEntry
            autoCorrect={false}
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.back()}
          >
            <Text style={styles.switchButtonText}>← Back to Dispatcher Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  switchButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  switchButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});