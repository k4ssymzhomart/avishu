import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import { formatCustomerStage } from '@/lib/utils/format';
import type { OrderStatus } from '@/types/order';

const steps = ['placed', 'accepted', 'in_production', 'ready', 'out_for_delivery', 'delivered'] as const;

function resolveStepIndex(status: OrderStatus) {
  return steps.findIndex((step) => step === status);
}

export function CustomerOrderTracker({
  language = 'en',
  status,
}: {
  language?: 'en' | 'ru';
  status: OrderStatus;
}) {
  const currentIndex = resolveStepIndex(status);

  return (
    <View style={styles.grid}>
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;

        return (
          <View key={step} style={[styles.step, isActive ? styles.stepActive : null]}>
            <Text style={[styles.index, isActive ? styles.inverseText : null]}>{`0${index + 1}`}</Text>
            <Text style={[styles.label, isActive ? styles.inverseText : null]}>{formatCustomerStage(step, language)}</Text>
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
