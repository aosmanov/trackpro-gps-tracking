import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { authService } from '@/services/auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Demo mode - auto-login as technician
    if (loaded) {
      console.log('🎮 Demo mode: Auto-login as technician');
      
      // Set fake user data for demo
      const demoUser = {
        id: "550e8400-e29b-41d4-a716-446655440102",
        first_name: "Mike",
        last_name: "Davis", 
        email: "mike@bostonwater.com",
        phone: "(617) 555-0102",
        role: "technician" as const,
        company_id: "550e8400-e29b-41d4-a716-446655440001"
      };
      
      authService.setAuthData("demo-token", demoUser);
      router.replace('/(technician)');
      setIsAuthChecked(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && isAuthChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthChecked]);

  if (!loaded) {
    return null;
  }

  if (!isAuthChecked) {
    // Show a simple loading indicator instead of blank screen
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC'
      }}>
        <Text style={{ fontSize: 24, marginBottom: 16 }}>🔄</Text>
        <Text style={{ color: '#6B7280' }}>Loading TrackPro...</Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="test" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="technician-login" options={{ headerShown: false }} />
        <Stack.Screen name="(technician)" options={{ headerShown: false }} />
        <Stack.Screen name="(dispatcher)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
