import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="phone/index" />
      <Stack.Screen name="verify/index" />
      <Stack.Screen name="role-select/index" />
      <Stack.Screen name="nickname/index" />
    </Stack>
  );
}
