import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import type { OrderStatus } from '@/types/order';

const steps = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_production', label: 'In production' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function resolveStepIndex(status: OrderStatus) {
  return steps.findIndex((step) => step.key === status);
}

export function CustomerOrderTracker({ status }: { status: OrderStatus }) {
  const currentIndex = resolveStepIndex(status);

  return (
    <View style={styles.grid}>
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;

        return (
          <View key={step.key} style={[styles.step, isActive ? styles.stepActive : null]}>
            <Text style={[styles.index, isActive ? styles.inverseText : null]}>{`0${index + 1}`}</Text>
            <Text style={[styles.label, isActive ? styles.inverseText : null]}>{step.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  index: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
  },
  inverseText: {
    color: theme.colors.text.inverse,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.xs,
    textTransform: 'uppercase',
  },
  step: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 18,
    borderWidth: theme.borders.width.thin,
    flexGrow: 1,
    gap: theme.spacing.xs,
    minWidth: 104,
    minHeight: 76,
    padding: theme.spacing.md,
  },
  stepActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
});
