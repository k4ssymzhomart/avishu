import { useEffect, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { roleHomePaths } from '@/hooks/useRoleRedirect';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextButton } from '@/components/ui/TextButton';
import { roleDescriptions } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';
import type { UserRole } from '@/types/user';

const roleCards: Array<{ label: string; role: UserRole; shortLabel: string }> = [
  { label: 'Customer', role: 'customer', shortLabel: 'Storefront' },
  { label: 'Franchisee', role: 'franchisee', shortLabel: 'Boutique Desk' },
  { label: 'Production', role: 'production', shortLabel: 'Workshop' },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const authStatus = useSessionStore((state) => state.authStatus);
  const currentRole = useSessionStore((state) => state.currentRole);
  const pendingRoleSelection = useSessionStore((state) => state.pendingRoleSelection);
  const setPendingRoleSelection = useSessionStore((state) => state.setPendingRoleSelection);
  const signOut = useSessionStore((state) => state.signOut);
  const [selectedRole, setSelectedRole] = useState<UserRole>(pendingRoleSelection ?? currentRole ?? 'customer');

  useEffect(() => {
    setSelectedRole(pendingRoleSelection ?? currentRole ?? 'customer');
  }, [currentRole, pendingRoleSelection]);

  if (authStatus === 'guest') {
    return <Redirect href="/phone" />;
  }

  if (authStatus === 'pending_verification') {
    return <Redirect href="/verify" />;
  }

  const backPath = authStatus === 'authenticated' && currentRole ? roleHomePaths[currentRole] : '/verify';

  const handleContinue = () => {
    setPendingRoleSelection(selectedRole);
    router.push('/nickname');
  };

  return (
    <Screen footer={<Button label="Continue to profile setup" onPress={handleContinue} />} scroll>
      <AppHeader
        eyebrow="Step 1 of 2"
        onBackPress={() => {
          setPendingRoleSelection(null);
          router.replace(backPath);
        }}
        showBackButton
        subtitle="Choose the AVISHU workspace you want to enter. You can switch again later from demo mode."
        title="Choose your workspace."
      />

      <View style={styles.roleList}>
        {roleCards.map((item, index) => {
          const isSelected = selectedRole === item.role;

          return (
            <Pressable key={item.role} onPress={() => setSelectedRole(item.role)} style={({ pressed }) => [pressed ? styles.pressed : null]}>
              <Card padding="lg" style={isSelected ? styles.roleCardActive : styles.roleCard}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.roleIndex, isSelected ? styles.roleIndexActive : null]}>{`0${index + 1}`}</Text>
                  {isSelected ? <Text style={styles.selectedTag}>Selected</Text> : null}
                </View>
                <View style={styles.cardCopy}>
                  <Text style={[styles.roleName, isSelected ? styles.roleNameActive : null]}>{item.label}</Text>
                  <Text style={[styles.roleShort, isSelected ? styles.roleShortActive : null]}>{item.shortLabel}</Text>
                </View>
                <Text style={[styles.roleDescription, isSelected ? styles.roleDescriptionActive : null]}>{roleDescriptions[item.role]}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <TextButton label="Start over" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardCopy: {
    gap: theme.spacing.xs,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.92,
  },
  roleCard: {
    backgroundColor: theme.colors.surface.default,
    minHeight: 164,
  },
  roleCardActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    minHeight: 164,
  },
  roleDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  roleDescriptionActive: {
    color: theme.colors.text.inverseMuted,
  },
  roleIndex: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  roleIndexActive: {
    color: theme.colors.text.inverseMuted,
  },
  roleList: {
    gap: theme.spacing.lg,
  },
  roleName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    textTransform: 'uppercase',
  },
  roleNameActive: {
    color: theme.colors.text.inverse,
  },
  roleShort: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  roleShortActive: {
    color: theme.colors.text.inverseMuted,
  },
  selectedTag: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
