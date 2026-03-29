import { useEffect } from 'react';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppRuntimeBridge } from '@/components/runtime/AppRuntimeBridge';
import { theme } from '@/lib/theme/tokens';
import { bootstrapAppData } from '@/services/bootstrap';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat: require('../assets/fonts/Montserrat-Variable.ttf'),
  });

  useEffect(() => {
    void bootstrapAppData();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppRuntimeBridge />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      />
    </SafeAreaProvider>
  );
}
