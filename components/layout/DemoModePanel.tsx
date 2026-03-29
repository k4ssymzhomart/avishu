import { useState } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { roleHomePaths } from '@/hooks/useRoleRedirect';
import { demoProducts, demoRoleLabels, demoUsersByRole, demoWalkthroughSteps } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import { clearDemoOrders, prepareDemoWalkthrough, resetDemoState, seedDemoCatalog } from '@/services/demo';
import { useSessionStore } from '@/store/session';
import type { UserRole } from '@/types/user';

const roles: Array<{ role: UserRole }> = [{ role: 'customer' }, { role: 'franchisee' }, { role: 'production' }];

export function DemoModePanel() {
  const router = useRouter();
  const currentRole = useSessionStore((state) => state.currentRole);
  const signInAsDemo = useSessionStore((state) => state.signInAsDemo);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRoleSwitch = (role: UserRole) => {
    signInAsDemo(role);
    router.replace(roleHomePaths[role]);
  };

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsBusy(true);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
    } catch {
      setMessage('Demo action did not complete. Check Firebase access or continue with the local fallback store.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card padding="lg" style={styles.card} variant="muted">
      <Text style={styles.eyebrow}>AVISHU / DEMO MODE</Text>
      <Text style={styles.title}>Presentation controls</Text>
      <Text style={styles.body}>
        Switch roles instantly, keep the catalog stable, and reset the walkthrough without rebuilding state by hand.
      </Text>

      <View style={styles.roleRow}>
        {roles.map(({ role }) => (
          <Button
            disabled={isBusy}
            key={role}
            label={demoRoleLabels[role]}
            onPress={() => handleRoleSwitch(role)}
            size="sm"
            style={styles.roleButton}
            variant={currentRole === role ? 'primary' : 'secondary'}
          />
        ))}
      </View>

      <View style={styles.sampleList}>
        {roles.map(({ role }) => {
          const user = demoUsersByRole[role];

          return (
            <View key={role} style={styles.sampleRow}>
              <Text style={styles.sampleRole}>{demoRoleLabels[role]}</Text>
              <Text style={styles.sampleMeta}>{`${user.name} / ${user.phoneNumber}`}</Text>
            </View>
          );
        })}
      </View>

      <Divider />

      <View style={styles.actions}>
        <Button
          disabled={isBusy}
          label="Fresh walkthrough"
          onPress={() => {
            void runAction(
              prepareDemoWalkthrough,
              'Walkthrough reset. Catalog and users are seeded, and orders are cleared for a clean live demo.',
            );
          }}
          size="sm"
          variant="secondary"
        />
        <Button
          disabled={isBusy}
          label="Reset seeded demo"
          onPress={() => {
            void runAction(resetDemoState, 'Seeded orders, threads, users, and catalog were restored.');
          }}
          size="sm"
          variant="secondary"
        />
        <Button
          disabled={isBusy}
          label="Seed catalog only"
          onPress={() => {
            void runAction(
              seedDemoCatalog,
              `Catalog and sample users are ready. ${demoProducts.length} products are available for screenshots and ordering.`,
            );
          }}
          size="sm"
          variant="ghost"
        />
        <Button
          disabled={isBusy}
          label="Clear orders"
          onPress={() => {
            void runAction(clearDemoOrders, 'Orders, chats, and live flow data were cleared.');
          }}
          size="sm"
          variant="ghost"
        />
      </View>

      <Divider />

      <View style={styles.walkthrough}>
        <Text style={styles.walkthroughTitle}>Hackathon walkthrough</Text>
        {demoWalkthroughSteps.map((step, index) => (
          <View key={step} style={styles.walkthroughRow}>
            <Text style={styles.walkthroughIndex}>{`0${index + 1}`}</Text>
            <Text style={styles.walkthroughText}>{step}</Text>
          </View>
        ))}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.sm,
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  card: {
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  message: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  roleButton: {
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sampleList: {
    gap: theme.spacing.sm,
  },
  sampleMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  sampleRole: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sampleRow: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  walkthrough: {
    gap: theme.spacing.sm,
  },
  walkthroughIndex: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    minWidth: 28,
    textTransform: 'uppercase',
  },
  walkthroughRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  walkthroughText: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  walkthroughTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
