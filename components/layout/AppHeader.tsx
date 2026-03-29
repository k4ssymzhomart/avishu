import type { ReactNode } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { BackButton } from '@/components/ui/BackButton';
import { Divider } from '@/components/ui/Divider';
import { TextButton } from '@/components/ui/TextButton';
import { theme } from '@/lib/theme/tokens';

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionSlot?: ReactNode;
  onActionPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionSlot,
  onActionPress,
  showBackButton = false,
  onBackPress,
}: AppHeaderProps) {
  const normalizedActionLabel = actionLabel?.trim().toLowerCase();
  const hideTrailingAction = showBackButton && !!normalizedActionLabel && ['back', 'close', 'назад'].includes(normalizedActionLabel);

  const trailingAction =
    actionSlot ??
    (actionLabel && onActionPress && !hideTrailingAction ? <TextButton label={actionLabel} onPress={onActionPress} /> : null);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.brandCluster}>
          {showBackButton && onBackPress ? <BackButton onPress={onBackPress} /> : null}
          <BrandWordmark size="sm" />
        </View>
        {trailingAction}
      </View>

      <View style={styles.copyBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <Divider />
    </View>
  );
}

const styles = StyleSheet.create({
  brandCluster: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    gap: theme.spacing.lg,
  },
  copyBlock: {
    gap: theme.spacing.sm,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 420,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 28,
    lineHeight: 34,
    maxWidth: 460,
  },
});
