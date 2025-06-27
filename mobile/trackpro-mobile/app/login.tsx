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

export default function LoginScreen() {
  const [email, setEmail] = useState('sarah@bostonwater.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('🔄 Login button clicked');
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password.length);
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    console.log('⏳ Setting loading to true');
    
    try {
      console.log('🚀 Calling authService.login...');
      const result = await authService.login(email.trim(), password);
      console.log('📥 Login result:', result);
      
      if (result.success) {
        const user = authService.getCurrentUser();
        console.log('👤 Current user:', user);
        
        if (user?.role === 'technician') {
          console.log('➡️ Redirecting to technician dashboard');
          router.replace('/(technician)');
        } else if (user?.role === 'dispatcher') {
          console.log('➡️ Redirecting to dispatcher dashboard');
          router.replace('/(dispatcher)');
        } else {
          Alert.alert('Error', 'This app is for technicians and dispatchers only');
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
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>TrackPro</Text>
          <Text style={styles.subtitle}>Service Tracking Platform</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
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
          <Text style={styles.footerText}>
            For technicians and dispatchers only
          </Text>
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.push('/technician-login')}
          >
            <Text style={styles.switchButtonText}>Login as Technician →</Text>
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
  footerText: {
    fontSize: 14,
    color: '#6B7280',
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