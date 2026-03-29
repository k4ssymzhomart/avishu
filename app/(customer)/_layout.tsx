import { useEffect } from 'react';

import { Redirect, Stack } from 'expo-router';

import { useCustomerCartSync } from '@/hooks/useCustomerCart';
import { useCustomerFavoritesSync } from '@/hooks/useCustomerFavorites';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import { demoUsersByRole } from '@/lib/constants/demo';
import { useSessionStore } from '@/store/session';

function CustomerDataBridge() {
  const currentRole = useSessionStore((state) => state.currentRole);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const hydrateCurrentUserProfile = useSessionStore((state) => state.hydrateCurrentUserProfile);

  const profileSeed =
    currentRole === 'customer' && currentUserId
      ? {
          displayName: currentUserName,
          franchiseId: demoUsersByRole.customer.franchiseId ?? null,
          franchiseName: demoUsersByRole.customer.franchiseName ?? null,
          phone: currentUserPhoneNumber,
          role: currentRole,
          uid: currentUserId,
        }
      : null;
  const { profile } = useCustomerProfile(profileSeed);

  useCustomerCartSync(currentRole === 'customer' ? currentUserId : null);
  useCustomerFavoritesSync(currentRole === 'customer' ? currentUserId : null);

  useEffect(() => {
    hydrateCurrentUserProfile(profile ?? null);
  }, [hydrateCurrentUserProfile, profile]);

  return null;
}

export default function CustomerLayout() {
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);

  if (authStatus !== 'authenticated' || currentRole !== 'customer') {
    return <Redirect href="/landing" />;
  }

  return (
    <>
      <CustomerDataBridge />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="customer/index" />
        <Stack.Screen name="customer/cart" />
        <Stack.Screen name="customer/orders" />
        <Stack.Screen name="customer/chat" />
        <Stack.Screen name="customer/chat/[orderId]" />
        <Stack.Screen name="customer/checkout/size" />
        <Stack.Screen name="customer/checkout/delivery" />
        <Stack.Screen name="customer/checkout/payment" />
        <Stack.Screen name="customer/checkout/success" />
        <Stack.Screen name="customer/notifications" />
        <Stack.Screen name="customer/profile" />
        <Stack.Screen name="customer/product/[id]" />
      </Stack>
    </>
  );
}
