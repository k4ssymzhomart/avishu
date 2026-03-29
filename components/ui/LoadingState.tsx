import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { theme } from '@/lib/theme/tokens';

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <Card padding="lg" style={styles.card} variant="muted">
      <Text style={styles.label}>{label}</Text>
      <View style={styles.lineGroup}>
        <SkeletonBlock height={14} width="92%" />
        <SkeletonBlock height={14} width="70%" />
        <SkeletonBlock height={14} width="46%" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  lineGroup: {
    gap: theme.spacing.sm,
  },
});
