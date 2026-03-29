import { useEffect, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { roleHomePaths } from '@/hooks/useRoleRedirect';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';
import type { UserRole } from '@/types/user';

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  franchisee: 'Franchisee',
  production: 'Production',
};

export default function NicknameScreen() {
  const router = useRouter();
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const pendingRoleSelection = useSessionStore((state) => state.pendingRoleSelection);
  const completeRoleSelection = useSessionStore((state) => state.completeRoleSelection);
  const [nickname, setNickname] = useState(currentUserName ?? '');

  useEffect(() => {
    setNickname(currentUserName ?? '');
  }, [currentUserName]);

  if (authStatus === 'guest') {
    return <Redirect href="/phone" />;
  }

  if (authStatus === 'pending_verification') {
    return <Redirect href="/verify" />;
  }

  if (!pendingRoleSelection) {
    if (authStatus === 'authenticated' && currentRole) {
      return <Redirect href={roleHomePaths[currentRole]} />;
    }

    return <Redirect href="/role-select" />;
  }

  const handleContinue = () => {
    completeRoleSelection(pendingRoleSelection, nickname);
    router.replace(roleHomePaths[pendingRoleSelection]);
  };

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={styles.wrapper}>
        <Screen footer={<Button label="Enter app" onPress={handleContinue} />} scroll>
          <AppHeader
            eyebrow="Step 2 of 2"
            onBackPress={() => router.replace('/role-select')}
            showBackButton
            subtitle="This name appears inside your chosen AVISHU workspace."
            title="Choose a nickname."
          />

          <Card padding="lg" variant="muted">
            <Text style={styles.roleEyebrow}>Entering as</Text>
            <Text style={styles.roleValue}>{roleLabels[pendingRoleSelection]}</Text>
          </Card>

          <Input
            autoCapitalize="words"
            autoFocus
            hint="Leave it blank to keep the default profile name."
            label="Nickname"
            onChangeText={setNickname}
            onSubmitEditing={handleContinue}
            placeholder="AVISHU Client"
            returnKeyType="done"
            value={nickname}
          />
        </Screen>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  roleEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  roleValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    textTransform: 'uppercase',
  },
  wrapper: {
    flex: 1,
  },
});
