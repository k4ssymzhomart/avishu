import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/store/session';

export default function FranchiseeLayout() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);

  if (authStatus !== 'authenticated' || currentRole !== 'franchisee') {
    return <Redirect href="/landing" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="franchisee/catalog" />
      <Stack.Screen name="franchisee/index" />
      <Stack.Screen name="franchisee/network" />
      <Stack.Screen name="franchisee/orders" />
      <Stack.Screen name="franchisee/clients" />
      <Stack.Screen name="franchisee/chat/[orderId]" />
      <Stack.Screen name="franchisee/notifications" />
      <Stack.Screen name="franchisee/profile" />
    </Stack>
  );
}
