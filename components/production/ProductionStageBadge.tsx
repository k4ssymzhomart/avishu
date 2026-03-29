import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import { formatProductionStage } from '@/lib/utils/production';
import type { OrderStatus } from '@/types/order';

type ProductionStageBadgeProps = {
  status: OrderStatus;
};

export function ProductionStageBadge({ status }: ProductionStageBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        status === 'in_production' ? styles.inProduction : null,
        status === 'ready' ? styles.ready : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          status === 'in_production' ? styles.inProductionLabel : null,
          status === 'ready' ? styles.readyLabel : null,
        ]}
      >
        {formatProductionStage(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 110,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  inProduction: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.text.inverseMuted,
  },
  inProductionLabel: {
    color: theme.colors.text.inverse,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  ready: {
    backgroundColor: theme.colors.surface.muted,
  },
  readyLabel: {
    color: theme.colors.text.primary,
  },
});
