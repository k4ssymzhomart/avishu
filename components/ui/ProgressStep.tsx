import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import type { OrderStatus } from '@/types/order';

const steps: OrderStatus[] = ['placed', 'accepted', 'in_production', 'ready'];

type ProgressStepProps = {
  currentStatus: OrderStatus;
};

export function ProgressStep({ currentStatus }: ProgressStepProps) {
  const currentIndex = steps.indexOf(currentStatus);

  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <View key={step} style={[styles.step, isActive || isComplete ? styles.stepActive : null]}>
            <Text style={[styles.index, isActive || isComplete ? styles.inverseText : null]}>{`0${index + 1}`}</Text>
            <Text style={[styles.label, isActive || isComplete ? styles.inverseText : null]}>{step.replace('_', ' ')}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  step: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    gap: theme.spacing.xs,
    minHeight: 72,
    padding: theme.spacing.md,
  },
  stepActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
});
