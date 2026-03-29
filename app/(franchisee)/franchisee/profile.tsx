import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FranchiseeChipRail } from '@/components/franchisee/FranchiseeChipRail';
import { AssetIcon } from '@/components/icons/AssetIcon';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useFranchiseeChatThreads } from '@/hooks/useChat';
import { useFranchiseeBottomNav } from '@/hooks/useFranchiseeBottomNav';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { useFranchiseeWorkspace } from '@/hooks/useFranchiseeWorkspace';
import { useFranchiseeOrders } from '@/hooks/useOrders';
import { theme } from '@/lib/theme/tokens';
import { getFranchiseeUnreadSupportCount } from '@/lib/utils/franchisee';
import { useSessionStore } from '@/store/session';

export default function FranchiseeProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const workspace = useFranchiseeWorkspace();
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const signOut = useSessionStore((state) => state.signOut);
  const { copy, language, setLanguage } = useFranchiseeI18n();
  const bottomNavItems = useFranchiseeBottomNav();
  const scope = useMemo(
    () =>
      workspace.userId
        ? {
            branchId: workspace.branchId ?? null,
            franchiseId: workspace.franchiseId,
          }
        : null,
    [workspace.branchId, workspace.franchiseId, workspace.userId],
  );
  const { orders } = useFranchiseeOrders(scope);
  const { threads } = useFranchiseeChatThreads(scope);

  const isCompact = width < 720;
  const isWide = width >= 980;
  const liveOrders = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length;
  const readyOrders = orders.filter((order) => order.status === 'ready').length;
  const unreadSupportCount = getFranchiseeUnreadSupportCount(threads);
  const branchNodeLabel = useMemo(
    () => (workspace.branchName?.includes('Astana') ? copy.profile.profileNodePrimary : copy.profile.profileNodeSecondary),
    [copy.profile.profileNodePrimary, copy.profile.profileNodeSecondary, workspace.branchName],
  );
  const contactValue = workspace.profile?.phoneNumber ?? currentUserPhoneNumber ?? copy.common.pending;
  const languageItems = [
    { key: 'en', label: 'ENG' },
    { key: 'ru', label: 'RU' },
  ];

  return (
    <Screen
      footer={<RoleBottomNav activeKey="profile" items={bottomNavItems} variant="floating" />}
      footerMaxWidth={560}
      footerMode="floating"
      maxContentWidth={1120}
      scroll
    >
      <AppHeader eyebrow={copy.profile.eyebrow} subtitle={copy.profile.subtitle} title={workspace.branchName ?? 'AVISHU Boutique'} />

      <View style={[styles.hero, isWide ? styles.heroWide : null]}>
        <View style={styles.heroMain}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>{copy.profile.profile}</Text>
              <Text style={styles.heroTitle}>{branchNodeLabel}</Text>
              <Text style={styles.heroBody}>{copy.profile.heroBody}</Text>
            </View>

            <View style={styles.settingsChip}>
              <AssetIcon color={theme.colors.text.inverse} name="settings" size={16} />
              <Text style={styles.settingsChipLabel}>{copy.profile.settings}</Text>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.heroMetaLabel}>{copy.profile.contact}</Text>
              <Text style={styles.heroMetaValue}>{contactValue}</Text>
            </View>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.heroMetaLabel}>{copy.profile.liveOrders}</Text>
              <Text style={styles.heroMetaValue}>{liveOrders.toString().padStart(2, '0')}</Text>
            </View>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.heroMetaLabel}>{copy.profile.unreadChat}</Text>
              <Text style={styles.heroMetaValue}>{unreadSupportCount.toString().padStart(2, '0')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsPanel}>
          <View style={styles.settingsPanelHeader}>
            <Text style={styles.panelLabel}>{copy.profile.settingsTitle}</Text>
            <AssetIcon color={theme.colors.text.primary} name="settings" size={18} />
          </View>
          <Text style={styles.settingsBody}>{copy.profile.preferredLanguage}</Text>
          <FranchiseeChipRail
            items={languageItems}
            onSelect={(nextKey) => setLanguage(nextKey as typeof language)}
            selectedKey={language}
          />
          <View style={styles.settingsFacts}>
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>{copy.profile.notifications}</Text>
              <Text style={styles.factValue}>{copy.profile.notificationsValue}</Text>
            </View>
            <Divider />
            <View style={styles.factRow}>
              <Text style={styles.factLabel}>{copy.profile.security}</Text>
              <Text style={styles.factValue}>{copy.profile.securityValue}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.contentGrid, isWide ? styles.contentGridWide : null]}>
        <View style={styles.section}>
          <Text style={styles.panelLabel}>{copy.profile.branchIdentity}</Text>
          <Divider />
          <View style={styles.detailGrid}>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.branch}</Text>
              <Text style={styles.detailValue}>{workspace.branchName ?? 'AVISHU Boutique'}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.storeType}</Text>
              <Text style={styles.detailValue}>{copy.profile.storeTypeValue}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.address}</Text>
              <Text style={styles.detailValue}>{workspace.profile?.branchAddress ?? copy.common.pending}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.readyHandoff}</Text>
              <Text style={styles.detailValue}>
                {readyOrders ? `${readyOrders} ${copy.profile.readyWaiting}` : copy.common.pending}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.panelLabel}>{copy.profile.settingsTitle}</Text>
          <Divider />
          <View style={styles.detailGrid}>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.staff}</Text>
              <Text style={styles.detailValue}>{copy.profile.staffValue}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.notifications}</Text>
              <Text style={styles.detailValue}>{copy.profile.notificationsValue}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.security}</Text>
              <Text style={styles.detailValue}>{copy.profile.securityValue}</Text>
            </View>
            <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
              <Text style={styles.detailLabel}>{copy.profile.workspace}</Text>
              <Text style={styles.detailValue}>{copy.profile.workspaceValue}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.actionRow, isCompact ? styles.actionStack : null]}>
        <Button label={copy.profile.openOrders} onPress={() => router.push('/franchisee/orders')} />
        <Button label="Notifications" onPress={() => router.push('/franchisee/notifications')} variant="secondary" />
        <Button label={copy.profile.switchWorkspace} onPress={() => router.push('/role-select')} variant="secondary" />
        <Button
          label={copy.profile.signOut}
          onPress={() => {
            signOut();
            router.replace('/splash');
          }}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionStack: {
    flexDirection: 'column',
  },
  contentGrid: {
    gap: theme.spacing.lg,
  },
  contentGridWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  detailCell: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.xs,
    minHeight: 92,
    padding: theme.spacing.md,
    width: '48.5%',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  factLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  factRow: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  factValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  fullWidthCell: {
    width: '100%',
  },
  hero: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  heroBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 420,
  },
  heroCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  heroLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMain: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  heroMetaCell: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 180,
    padding: theme.spacing.md,
  },
  heroMetaLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroMetaValue: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    lineHeight: theme.typography.lineHeight.sm,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  heroWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  panelLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  settingsBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  settingsChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 36,
    paddingHorizontal: theme.spacing.md,
  },
  settingsChipLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  settingsFacts: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
  },
  settingsPanel: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    minWidth: 320,
    padding: theme.spacing.lg,
  },
  settingsPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
