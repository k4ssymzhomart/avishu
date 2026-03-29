import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({ label, value, helper, style }: StatCardProps) {
  return (
    <Card padding="lg" style={style}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  helper: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  value: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
  },
});
