import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/store/session';

export default function ProductionLayout() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);

  if (authStatus !== 'authenticated' || currentRole !== 'production') {
    return <Redirect href="/landing" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="production/index" />
      <Stack.Screen name="production/active" />
      <Stack.Screen name="production/ready" />
      <Stack.Screen name="production/notifications" />
      <Stack.Screen name="production/profile" />
      <Stack.Screen name="production/task/[id]" />
    </Stack>
  );
}
