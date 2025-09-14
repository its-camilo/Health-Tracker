import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once app is ready
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    
    // Small delay to ensure everything is loaded
    setTimeout(hideSplash, 1000);
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </PaperProvider>
  );
}