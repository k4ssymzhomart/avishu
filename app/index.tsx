import { Redirect } from 'expo-router';

import { useRoleRedirect } from '@/hooks/useRoleRedirect';

export default function IndexScreen() {
  const { targetPath } = useRoleRedirect();

  return <Redirect href={targetPath} />;
}
