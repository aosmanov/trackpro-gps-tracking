import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TrackPro Mobile - Test Screen</Text>
      <Text style={styles.subtitle}>React Native Web is working!</Text>
      <Text style={styles.info}>Backend: Connected</Text>
      <Text style={styles.info}>Mobile App: Ready for testing</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#3B82F6',
    marginBottom: 24,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
});