import { Stack } from 'expo-router';

import { theme } from '@/lib/theme/tokens';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: {
          backgroundColor: theme.colors.background.primary,
        },
      }}
    >
      <Stack.Screen name="splash/index" />
      <Stack.Screen name="landing/index" />
    </Stack>
  );
}
