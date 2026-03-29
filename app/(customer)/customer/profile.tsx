import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { CustomerLoyaltySummary } from '@/components/customer/CustomerLoyaltySummary';
import { AssetIcon, type AssetIconName } from '@/components/icons/AssetIcon';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { Button } from '@/components/ui/Button';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useFranchises } from '@/hooks/useFranchises';
import { useCustomerOrders } from '@/hooks/useOrders';
import { demoUsersByRole } from '@/lib/constants/demo';
import { theme } from '@/lib/theme/tokens';
import { formatCurrency } from '@/lib/utils/format';
import { buildLoyaltySummary } from '@/lib/utils/loyalty';
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

  return { gap, maxContentWidth, panelWidth };
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

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: AssetIconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <AssetIcon color={theme.colors.text.primary} name={icon} size={15} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function LanguageChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.languageChip,
        active ? styles.languageChipActive : null,
        pressed ? styles.languageChipPressed : null,
      ]}
    >
      <Text style={[styles.languageChipLabel, active ? styles.languageChipLabelActive : null]}>{label}</Text>
    </Pressable>
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
  const { copy, language, navItems, setLanguage } = useCustomerI18n();
  const { franchises } = useFranchises();
  const [nickname, setNickname] = useState(currentUserName ?? '');
  const [isEditingName, setIsEditingName] = useState(false);
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getLayout(width), [width]);

  useEffect(() => {
    setNickname(currentUserName ?? '');
  }, [currentUserName]);

  const totalOrders = activeOrders.length + orderHistory.length;
  const completedOrders = orderHistory.filter((order) => order.status === 'delivered');
  const loyalty =
    currentUserProfile?.loyalty ??
    buildLoyaltySummary({
      lifetimeSpent: completedOrders.reduce((sum, order) => sum + order.productPrice, 0),
      totalOrders: completedOrders.length,
    });
  const savedAddresses = currentUserProfile?.addresses ?? [];
  const selectedFranchiseId = currentUserProfile?.assignedFranchiseId ?? demoUsersByRole.customer.franchiseId ?? null;
  const profileName = currentUserName ?? (language === 'ru' ? 'РљР»РёРµРЅС‚ AVISHU' : 'AVISHU Client');
  const nextTierValue = loyalty.nextTier
    ? `${loyalty.pointsToNextTier} ${copy.profile.pointsUntil} ${loyalty.nextTier}`
    : `You reached ${loyalty.tier}`;

  return (
    <Screen
      footer={<RoleBottomNav activeKey="profile" items={navItems} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <ImageBackground imageStyle={styles.heroImage} source={profileBackdrop} style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroEyebrow}>{copy.profile.profileTitle}</Text>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profileName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.identityName}>{profileName}</Text>
              <Text style={styles.identityPhone}>{currentUserPhoneNumber ?? '+7 *** *** ** **'}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalOrders}</Text>
              <Text style={styles.heroStatLabel}>{copy.profile.orders}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{loyalty.tier}</Text>
              <Text style={styles.heroStatLabel}>{copy.profile.tier}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{loyalty.points}</Text>
              <Text style={styles.heroStatLabel}>{copy.profile.points}</Text>
            </View>
          </View>

          <CustomerLoyaltySummary loyalty={loyalty} pointsUntilLabel={copy.profile.pointsUntil} />
        </View>
      </ImageBackground>

      <View style={[styles.grid, { gap: layout.gap }]}>
        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel
            actionLabel={isEditingName ? copy.profile.cancel : copy.profile.edit}
            onActionPress={() => {
              if (isEditingName) {
                setNickname(currentUserName ?? '');
              }
              setIsEditingName((current) => !current);
            }}
            title={copy.profile.displayDetails}
          >
            {isEditingName ? (
              <View style={styles.editBlock}>
                <Text style={styles.fieldLabel}>{copy.profile.displayName}</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setNickname}
                  placeholder={copy.profile.displayNamePlaceholder}
                  placeholderTextColor={theme.colors.text.tertiary}
                  style={styles.fieldInput}
                  value={nickname}
                />
                <Button
                  label={copy.profile.saveName}
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
                <ProfileRow icon="profile" label={copy.profile.displayName} value={profileName} />
                <ProfileRow icon="phone" label={copy.profile.phone} value={currentUserPhoneNumber ?? '+7 *** *** ** **'} />
              </View>
            )}
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title={copy.profile.loyaltySummary}>
            <View style={styles.detailList}>
              <ProfileRow icon="crown" label={copy.profile.currentTier} value={loyalty.tier} />
              <ProfileRow icon="badgeCheck" label="Membership" value={loyalty.benefits.label} />
              <ProfileRow icon="award" label={copy.profile.currentPoints} value={`${loyalty.points}`} />
              <ProfileRow icon="trendingUp" label={copy.profile.nextTier} value={nextTierValue} />
              <ProfileRow icon="wallet" label={copy.profile.lifetimeValue} value={formatCurrency(loyalty.lifetimeSpent)} />
              <ProfileRow
                icon="bag"
                label="Future benefit"
                value={loyalty.benefits.discountPercent ? `${loyalty.benefits.discountPercent}% OFF` : 'Points accumulation'}
              />
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title={copy.profile.savedAddresses}>
            <View style={styles.detailList}>
              {savedAddresses.length ? (
                savedAddresses.map((address) => (
                  <ProfileRow
                    key={address.id}
                    icon="address"
                    label={address.label}
                    value={[address.line1, address.line2, address.city].filter(Boolean).join(', ')}
                  />
                ))
              ) : (
                <ProfileRow icon="address" label={copy.profile.address} value={copy.profile.savedAddressesEmpty} />
              )}
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title="Assigned boutique">
            <View style={styles.branchList}>
              {franchises.map((franchise) => {
                const isSelected = franchise.id === selectedFranchiseId;

                return (
                  <Pressable
                    key={franchise.id}
                    onPress={() => {
                      if (!currentUserId) {
                        return;
                      }

                      void updateCustomerProfile(currentUserId, {
                        assignedFranchiseId: franchise.id,
                        assignedFranchiseName: franchise.name,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.branchCard,
                      isSelected ? styles.branchCardActive : null,
                      pressed ? styles.branchCardPressed : null,
                    ]}
                  >
                    <Text style={[styles.branchTitle, isSelected ? styles.branchTitleActive : null]}>{franchise.name}</Text>
                    <Text style={[styles.branchMeta, isSelected ? styles.branchMetaActive : null]}>
                      {`${franchise.location} / ${franchise.address}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title={copy.profile.preferences}>
            <View style={styles.detailList}>
              <ProfileRow icon="alarm" label={copy.profile.notifications} value={copy.profile.notificationsEnabled} />
              <ProfileRow icon="ruler" label={copy.profile.sizeProfile} value={copy.profile.sizeProfileStored} />
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title={copy.profile.settings}>
            <View style={styles.settingsBlock}>
              <View style={styles.settingsRow}>
                <View style={styles.settingsIcon}>
                  <AssetIcon color={theme.colors.text.primary} name="language" size={16} />
                </View>
                <View style={styles.settingsCopy}>
                  <Text style={styles.detailLabel}>{copy.profile.language}</Text>
                  <Text style={styles.detailValue}>{copy.profile.languageHint}</Text>
                </View>
              </View>

              <View style={styles.languageRow}>
                <LanguageChip active={language === 'ru'} label={copy.profile.russian} onPress={() => setLanguage('ru')} />
                <LanguageChip active={language === 'en'} label={copy.profile.english} onPress={() => setLanguage('en')} />
              </View>
            </View>
          </ProfilePanel>
        </View>

        <View style={{ width: layout.panelWidth }}>
          <ProfilePanel title={copy.profile.support}>
            <View style={styles.supportActions}>
              <Button label={copy.profile.openChat} onPress={() => router.push('/customer/chat')} size="sm" style={styles.actionButton} />
              <Button
                label={copy.profile.openNotifications}
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
        label={copy.profile.signOut}
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
  branchCard: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: 4,
    padding: theme.spacing.md,
  },
  branchCardActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  branchCardPressed: {
    opacity: 0.84,
  },
  branchList: {
    gap: theme.spacing.sm,
  },
  branchMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  branchMetaActive: {
    color: theme.colors.text.inverseMuted,
  },
  branchTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  branchTitleActive: {
    color: theme.colors.text.inverse,
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.md,
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
  languageChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  languageChipActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  languageChipLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  languageChipLabelActive: {
    color: theme.colors.text.inverse,
  },
  languageChipPressed: {
    opacity: 0.84,
  },
  languageRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
  settingsBlock: {
    gap: theme.spacing.md,
  },
  settingsCopy: {
    flex: 1,
    gap: 4,
  },
  settingsIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 999,
    borderWidth: theme.borders.width.thin,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  settingsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  supportActions: {
    gap: theme.spacing.sm,
  },
});
