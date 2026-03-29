import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Divider } from '@/components/ui/Divider';
import { theme } from '@/lib/theme/tokens';

type FranchiseeLaneSectionProps = {
  count: number;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  label: string;
  priority?: boolean;
  children: ReactNode;
};

export function FranchiseeLaneSection({
  children,
  count,
  description,
  emptyDescription,
  emptyTitle,
  label,
  priority = false,
}: FranchiseeLaneSectionProps) {
  return (
    <View style={[styles.section, priority ? styles.sectionPriority : null]}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={[styles.label, priority ? styles.labelPriority : null]}>{label}</Text>
          <Text style={[styles.description, priority ? styles.descriptionPriority : null]}>{description}</Text>
        </View>
        <Text style={[styles.count, priority ? styles.countPriority : null]}>{count.toString().padStart(2, '0')}</Text>
      </View>

      <Divider style={priority ? styles.dividerPriority : null} />

      {count ? (
        children
      ) : (
        <View style={[styles.emptyState, priority ? styles.emptyStatePriority : null]}>
          <Text style={[styles.emptyTitle, priority ? styles.emptyTitlePriority : null]}>{emptyTitle}</Text>
          <Text style={[styles.emptyDescription, priority ? styles.emptyDescriptionPriority : null]}>{emptyDescription}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  count: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
  },
  countPriority: {
    color: theme.colors.text.inverse,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 480,
  },
  descriptionPriority: {
    color: theme.colors.text.inverseMuted,
  },
  dividerPriority: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  emptyDescription: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
    maxWidth: 440,
  },
  emptyDescriptionPriority: {
    color: theme.colors.text.inverseMuted,
  },
  emptyState: {
    gap: theme.spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  emptyStatePriority: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  emptyTitlePriority: {
    color: theme.colors.text.inverse,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  labelPriority: {
    color: theme.colors.text.inverse,
  },
  section: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  sectionPriority: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
});
