import { StyleSheet, Text, View } from 'react-native';

import { BackButton } from '@/components/ui/BackButton';
import { theme } from '@/lib/theme/tokens';

type CheckoutHeaderProps = {
  currentStep: number;
  onBackPress: () => void;
  subtitle?: string;
  title: string;
};

const totalSteps = 5;

export function CheckoutHeader({ currentStep, onBackPress, subtitle, title }: CheckoutHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <BackButton onPress={onBackPress} />
        <Text style={styles.stepMeta}>{`Step ${currentStep} / ${totalSteps}`}</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>AVISHU / PURCHASE FLOW</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index + 1 <= currentStep;

          return <View key={index} style={[styles.progressSegment, isActive ? styles.progressSegmentActive : null]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
  copy: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  progressRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  progressSegment: {
    backgroundColor: '#E5E2DA',
    flex: 1,
    height: 4,
  },
  progressSegmentActive: {
    backgroundColor: theme.colors.surface.inverse,
  },
  stepMeta: {
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
