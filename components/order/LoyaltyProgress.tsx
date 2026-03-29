import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';

type LoyaltyProgressProps = {
  body?: string;
  current?: number;
  helper?: string;
  target?: number;
  title?: string;
};

export function LoyaltyProgress({
  body = 'A lightweight loyalty layer for the MVP. It can expand later into offers, private drops, and customer benefits.',
  current = 65,
  helper = 'AVISHU Circle',
  target = 100,
  title = 'Loyalty progress',
}: LoyaltyProgressProps) {
  const progress = Math.min(current / target, 1);

  return (
    <Card padding="lg">
      <Text style={styles.eyebrow}>{helper}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>{`${current}% complete`}</Text>
        <Text style={styles.meta}>{`target ${target}%`}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: theme.borders.radius.sm,
    height: 10,
    overflow: 'hidden',
  },
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  fill: {
    backgroundColor: theme.colors.surface.inverse,
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
});
