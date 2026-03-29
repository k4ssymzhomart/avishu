import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ProductionHeaderNotificationAction } from '@/components/production/ProductionHeaderNotificationAction';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProductionWorkspace } from '@/hooks/useProductionWorkspace';
import { productionBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';

export default function ProductionProfileScreen() {
  const router = useRouter();
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const signOut = useSessionStore((state) => state.signOut);
  const { acceptedTasks, activeTasks, productionUser, readyTasks } = useProductionWorkspace();

  const queueCount = acceptedTasks.length;
  const activeCount = activeTasks.length;
  const readyCount = readyTasks.length;
  const profileName = productionUser?.productionUnitName ?? currentUserName ?? 'AVISHU Atelier';
  const profileMeta = currentUserPhoneNumber ?? 'Production access is linked to this Firebase session.';

  return (
    <Screen
      footer={<RoleBottomNav activeKey="profile" items={productionBottomNav} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1120}
      scroll
    >
      <AppHeader
        actionSlot={<ProductionHeaderNotificationAction />}
        eyebrow="AVISHU / PRODUCTION"
        subtitle="A compact workshop profile with live board totals, real production scope, and quick session controls."
        title={profileName}
      />

      <Card padding="lg" variant="inverse">
        <Text style={styles.profileEyebrow}>Workshop profile</Text>
        <Text style={styles.profileName}>{profileName}</Text>
        <Text style={styles.profileMeta}>{profileMeta}</Text>
        {productionUser?.linkedFranchiseIds.length ? (
          <Text style={styles.profileScope}>
            {productionUser.linkedFranchiseIds.length === 1
              ? `Linked boutique: ${productionUser.linkedFranchiseIds[0]}`
              : `Linked boutiques: ${productionUser.linkedFranchiseIds.join(', ')}`}
          </Text>
        ) : null}
      </Card>

      <View style={styles.metricGrid}>
        <Card padding="md" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Queue</Text>
          <Text style={styles.metricValue}>{queueCount}</Text>
        </Card>
        <Card padding="md" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active</Text>
          <Text style={styles.metricValue}>{activeCount}</Text>
        </Card>
        <Card padding="md" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ready</Text>
          <Text style={styles.metricValue}>{readyCount}</Text>
        </Card>
      </View>

      <View style={styles.actions}>
        <Button label="Open queue" onPress={() => router.push('/production')} />
        <Button label="Notifications" onPress={() => router.push('/production/notifications')} variant="secondary" />
        <Button
          label="Sign out"
          onPress={() => {
            signOut();
            router.replace('/splash');
          }}
          variant="secondary"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minHeight: 96,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
  },
  profileEyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  profileMeta: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  profileScope: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  profileName: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
