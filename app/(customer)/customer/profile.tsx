import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { customerBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { useCustomerOrders } from '@/hooks/useOrders';
import { updateCustomerProfile } from '@/services/customerProfile';
import { useSessionStore } from '@/store/session';

const profileBackdrop = require('@/images/1st-mono.png');

function getLayout(width: number) {
  const isDesktop = width >= 1180;
  const maxContentWidth = width >= 1360 ? 1240 : width >= 1180 ? 1120 : width >= 780 ? 940 : undefined;
  const contentWidth = Math.min(width - theme.spacing.xl * 2, maxContentWidth ?? width - theme.spacing.xl * 2);
  const gap = theme.spacing.lg;
  const columns = isDesktop ? 2 : 1;
  const panelWidth = columns > 1 ? (contentWidth - gap * (columns - 1)) / columns : contentWidth;

  return { gap, isDesktop, maxContentWidth, panelWidth };
}

function ProfilePanel({
  actionLabel,
  children,
  onActionPress,
  title,
}: {
  actionLabel?: string;
  children: ReactNode;
  onActionPress?: () => void;
  title: string;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        {actionLabel && onActionPress ? (
          <Pressable onPress={onActionPress}>
            <Text style={styles.panelAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export default function CustomerProfileScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);
  const currentUserProfile = useSessionStore((state) => state.currentUserProfile);
  const signOut = useSessionStore((state) => state.signOut);
  const updateCurrentUserName = useSessionStore((state) => state.updateCurrentUserName);
  const { activeOrders, orderHistory } = useCustomerOrders(currentUserId);
  const [nickname, setNickname] = useState(currentUserName ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getLayout(width), [width]);

  useEffect(() => {
    setNickname(currentUserName ?? '');
  }, [currentUserName]);

  const totalOrders = activeOrders.length + orderHistory.length;
  const lifetimeValue = [...activeOrders, ...orderHistory].reduce((sum, order) => sum + order.productPrice, 0);
  const loyalty = currentUserProfile?.loyalty ?? {
    currentTier: 'Slate',
    nextTier: 'Monolith',
    nextTierProgress: 0,
    points: 0,
    pointsToNextTier: 800,
  };
  const savedAddresses = currentUserProfile?.addresses ?? [];

  return (
    <Screen
      footer={<RoleBottomNav activeKey="profile" items={customerBottomNav} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <ImageBackground imageStyle={styles.heroImage} source={profileBackdrop} style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEyebrow}>AVISHU / PROFILE</Text>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUserName ? currentUserName.charAt(0).toUpperCase() : 'A'}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>{currentUserName ?? 'AVISHU Client'}</Text>
              <Text style={styles.identityPhone}>{currentUserPhoneNumber ?? '+7 *** *** ** **'}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalOrders}</Text>
              <Text style={styles.heroStatLabel}>Orders</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{loyalty.currentTier}</Text>
              <Text style={styles.heroStatLabel}>Tier</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{loyalty.points}</Text>
              <Text style={styles.heroStatLabel}>Points</Text>
            </View>
          </View>

          <View style={styles.loyaltyCard}>
            <View style={styles.loyaltyHeader}>
              <Text style={styles.loyaltyEyebrow}>AVISHU Circle</Text>
              <Text style={styles.loyaltyTier}>{loyalty.currentTier}</Text>
            </View>
            <Text style={styles.loyaltyBody}>
              {loyalty.pointsToNextTier
                ? `${loyalty.pointsToNextTier} points until ${loyalty.nextTier}.`
                : 'You have reached the highest loyalty tier.'}
            </Text>
            <View style={styles.loyaltyTrack}>
              <View style={[styles.loyaltyFill, { width: `${loyalty.nextTierProgress * 100}%` }]} />
            </View>
            <View style={styles.loyaltyMetaRow}>
              <Text style={styles.loyaltyMeta}>{`${loyalty.points} points`}</Text>
              <Text style={styles.loyaltyMeta}>{loyalty.nextTier ?? 'Top tier reached'}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={[styles.grid, { gap: layout.gap }]}>
        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel
            actionLabel={isEditingName ? 'Cancel' : 'Edit'}
            onActionPress={() => {
              if (isEditingName) {
                setNickname(currentUserName ?? '');
              }
              setIsEditingName((current) => !current);
            }}
            title="Display details"
          >
            {isEditingName ? (
              <View style={styles.editBlock}>
                <Text style={styles.fieldLabel}>Display name</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setNickname}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.text.tertiary}
                  style={styles.fieldInput}
                  value={nickname}
                />
                <Button
                  label="Save name"
                  onPress={() => {
                    updateCurrentUserName(nickname);
                    if (currentUserId) {
                      void updateCustomerProfile(currentUserId, {
                        displayName: nickname,
                      });
                    }
                    setIsEditingName(false);
                  }}
                  size="sm"
                />
              </View>
            ) : (
              <View style={styles.detailList}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Display name</Text>
                  <Text style={styles.detailValue}>{currentUserName ?? 'AVISHU Client'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{currentUserPhoneNumber ?? '+7 *** *** ** **'}</Text>
                </View>
              </View>
            )}
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title="Loyalty summary">
            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current tier</Text>
                <Text style={styles.detailValue}>{loyalty.currentTier}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current points</Text>
                <Text style={styles.detailValue}>{loyalty.points}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next tier</Text>
                <Text style={styles.detailValue}>
                  {loyalty.nextTier ? `${loyalty.pointsToNextTier} pts to ${loyalty.nextTier}` : 'Top tier reached'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lifetime value</Text>
                <Text style={styles.detailValue}>{formatCurrency(lifetimeValue)}</Text>
              </View>
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title="Saved addresses">
            <View style={styles.detailList}>
              {savedAddresses.length ? (
                savedAddresses.map((address) => (
                  <View key={address.id} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{address.label}</Text>
                    <Text style={styles.detailValue}>
                      {[address.line1, address.line2, address.city].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>Saved delivery addresses will appear here once added.</Text>
                </View>
              )}
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title="Preferences">
            <View style={styles.detailList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notifications</Text>
                <Text style={styles.detailValue}>Enabled for order updates</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Size profile</Text>
                <Text style={styles.detailValue}>Stored in checkout history</Text>
              </View>
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title="Support">
            <View style={styles.supportActions}>
              <Button label="Open chat" onPress={() => router.push('/customer/chat')} size="sm" style={styles.actionButton} />
              <Button
                label="Notifications"
                onPress={() => router.push('/customer/notifications')}
                size="sm"
                style={styles.actionButton}
                variant="secondary"
              />
            </View>
          </ProfilePanel>
        </View>
      </View>

      <Button
        label="Sign out"
        onPress={() => {
          signOut();
          router.replace('/splash');
        }}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: '100%',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(17,17,17,0.08)',
    borderWidth: theme.borders.width.thin,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  detailLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  detailList: {
    gap: theme.spacing.sm,
  },
  detailRow: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: 4,
    padding: theme.spacing.md,
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  editBlock: {
    gap: theme.spacing.md,
  },
  fieldInput: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    minHeight: 54,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fieldLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hero: {
    minHeight: 360,
    overflow: 'hidden',
  },
  heroEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroImage: {
    opacity: 0.24,
  },
  heroOverlay: {
    backgroundColor: 'rgba(245,244,240,0.86)',
    flex: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  heroStat: {
    flex: 1,
    gap: 4,
  },
  heroStatLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  heroStatValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  heroStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  identityName: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 28,
    lineHeight: 34,
  },
  identityPhone: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  loyaltyBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  loyaltyCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(17,17,17,0.08)',
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  loyaltyEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  loyaltyFill: {
    backgroundColor: theme.colors.surface.inverse,
    height: '100%',
  },
  loyaltyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loyaltyMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  loyaltyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loyaltyTier: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  loyaltyTrack: {
    backgroundColor: 'rgba(17,17,17,0.12)',
    height: 6,
    overflow: 'hidden',
  },
  panel: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  panelAction: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  supportActions: {
    gap: theme.spacing.sm,
  },
});
