import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';

type ProductionBoardEmptyStateProps = {
  description: string;
  title: string;
  eyebrow?: string;
};

export function ProductionBoardEmptyState({
  description,
  title,
  eyebrow = 'AVISHU / PRODUCTION',
}: ProductionBoardEmptyStateProps) {
  return (
    <Card padding="lg" style={styles.card} variant="muted">
      <View style={styles.previewFrame}>
        <Text style={styles.previewLabel}>ATELIER</Text>
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.lg,
  },
  copy: {
    gap: theme.spacing.sm,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 420,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  previewFrame: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    height: 148,
    justifyContent: 'center',
  },
  previewLabel: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
});
