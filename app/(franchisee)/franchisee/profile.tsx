import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FranchiseeChipRail } from '@/components/franchisee/FranchiseeChipRail';
import { AssetIcon, type AssetIconName } from '@/components/icons/AssetIcon';
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

type DetailCellProps = {
  icon: AssetIconName;
  isCompact: boolean;
  label: string;
  value: string;
};

function DetailCell({ icon, isCompact, label, value }: DetailCellProps) {
  return (
        <View style={[styles.detailCell, isCompact ? styles.fullWidthCell : null]}>
          <View style={styles.detailCellHeader}>
            <View style={styles.detailCellIcon}>
              <AssetIcon color={theme.colors.text.primary} name={icon} size={15} />
            </View>
            <Text style={styles.detailLabel}>{label}</Text>
          </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

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
              <AssetIcon color={theme.colors.text.inverse} name="settings" size={15} />
              <Text style={styles.settingsChipLabel}>{copy.profile.settings}</Text>
            </View>
          </View>

          <View style={styles.heroMeta}>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <View style={styles.heroMetaHeader}>
                <AssetIcon color={theme.colors.text.inverse} name="phone" size={15} />
                <Text style={styles.heroMetaLabel}>{copy.profile.contact}</Text>
              </View>
              <Text style={styles.heroMetaValue}>{contactValue}</Text>
            </View>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <View style={styles.heroMetaHeader}>
                <AssetIcon color={theme.colors.text.inverse} name="orders" size={15} />
                <Text style={styles.heroMetaLabel}>{copy.profile.liveOrders}</Text>
              </View>
              <Text style={styles.heroMetaValue}>{liveOrders}</Text>
            </View>
            <View style={[styles.heroMetaCell, isCompact ? styles.fullWidthCell : null]}>
              <View style={styles.heroMetaHeader}>
                <AssetIcon color={theme.colors.text.inverse} name="chat" size={15} />
                <Text style={styles.heroMetaLabel}>{copy.profile.unreadChat}</Text>
              </View>
              <Text style={styles.heroMetaValue}>{unreadSupportCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsPanel}>
          <View style={styles.settingsPanelHeader}>
            <View style={styles.sectionIcon}>
              <AssetIcon color={theme.colors.text.primary} name="settings" size={15} />
            </View>
          </View>
          <Text style={styles.settingsBody}>{copy.profile.preferredLanguage}</Text>
          <FranchiseeChipRail
            items={languageItems}
            onSelect={(nextKey) => setLanguage(nextKey as typeof language)}
            selectedKey={language}
          />
          <View style={styles.settingsFacts}>
            <View style={styles.factRow}>
              <View style={styles.factIcon}>
                <AssetIcon color={theme.colors.text.primary} name="alarm" size={15} />
              </View>
              <View style={styles.factCopy}>
                <Text style={styles.factLabel}>{copy.profile.notifications}</Text>
                <Text style={styles.factValue}>{copy.profile.notificationsValue}</Text>
              </View>
            </View>
            <Divider />
            <View style={styles.factRow}>
              <View style={styles.factIcon}>
                <AssetIcon color={theme.colors.text.primary} name="security" size={15} />
              </View>
              <View style={styles.factCopy}>
                <Text style={styles.factLabel}>{copy.profile.security}</Text>
                <Text style={styles.factValue}>{copy.profile.securityValue}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.contentGrid, isWide ? styles.contentGridWide : null]}>
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <AssetIcon color={theme.colors.text.primary} name="store" size={15} />
            </View>
            <Text style={styles.panelLabel}>{copy.profile.branchIdentity}</Text>
          </View>
          <Divider />
          <View style={styles.detailGrid}>
            <DetailCell
              icon="store"
              isCompact={isCompact}
              label={copy.profile.branch}
              value={workspace.branchName ?? 'AVISHU Boutique'}
            />
            <DetailCell
              icon="branch"
              isCompact={isCompact}
              label={copy.profile.storeType}
              value={copy.profile.storeTypeValue}
            />
            <DetailCell
              icon="address"
              isCompact={isCompact}
              label={copy.profile.address}
              value={workspace.profile?.branchAddress ?? copy.common.pending}
            />
            <DetailCell
              icon="packageCheck"
              isCompact={isCompact}
              label={copy.profile.readyHandoff}
              value={readyOrders ? `${readyOrders} ${copy.profile.readyWaiting}` : copy.common.pending}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <AssetIcon color={theme.colors.text.primary} name="settings" size={15} />
            </View>
            <Text style={styles.panelLabel}>{copy.profile.workspace}</Text>
          </View>
          <Divider />
          <View style={styles.detailGrid}>
            <DetailCell icon="clients" isCompact={isCompact} label={copy.profile.staff} value={copy.profile.staffValue} />
            <DetailCell
              icon="alarm"
              isCompact={isCompact}
              label={copy.profile.notifications}
              value={copy.profile.notificationsValue}
            />
            <DetailCell
              icon="security"
              isCompact={isCompact}
              label={copy.profile.security}
              value={copy.profile.securityValue}
            />
            <DetailCell
              icon="factory"
              isCompact={isCompact}
              label={copy.profile.workspace}
              value={copy.profile.workspaceValue}
            />
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Button label={copy.profile.openOrders} onPress={() => router.push('/franchisee/orders')} style={styles.actionButton} />
        <Button
          label={copy.profile.notifications}
          onPress={() => router.push('/franchisee/notifications')}
          style={styles.actionButton}
          variant="secondary"
        />
        <Button
          label={copy.profile.switchWorkspace}
          onPress={() => router.push('/role-select')}
          style={styles.actionButton}
          variant="secondary"
        />
        <Button
          label={copy.profile.signOut}
          onPress={() => {
            signOut();
            router.replace('/splash');
          }}
          style={styles.actionButton}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'column',
    gap: theme.spacing.md,
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
    gap: theme.spacing.sm,
    minHeight: 96,
    padding: theme.spacing.md,
    width: '48.5%',
  },
  detailCellHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailCellIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 30,
    justifyContent: 'center',
    width: 30,
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
  factCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  factIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  factLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  factRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  heroMetaHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
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
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 32,
    justifyContent: 'center',
    width: 32,
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
    alignItems: 'flex-start',
  },
});
