import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Divider } from '@/components/ui/Divider';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { theme } from '@/lib/theme/tokens';
import { franchiseeFlowStages } from '@/lib/utils/franchisee';
import type { OrderStatus } from '@/types/order';

type FranchiseeFlowStripProps = {
  counts: Record<OrderStatus, number>;
  tone?: 'light' | 'dark';
};

export function FranchiseeFlowStrip({ counts, tone = 'light' }: FranchiseeFlowStripProps) {
  const { width } = useWindowDimensions();
  const { getStatusLabel } = useFranchiseeI18n();
  const isWide = width >= 960;
  const isTablet = width >= 640;

  return (
    <View style={[styles.container, tone === 'dark' ? styles.containerDark : null]}>
      {franchiseeFlowStages.map((stage, index) => (
        <View
          key={stage.status}
          style={[
            styles.cell,
            isWide ? styles.cellWide : isTablet ? styles.cellTablet : styles.cellMobile,
            tone === 'dark' ? styles.cellDark : null,
          ]}
        >
          <Text style={[styles.value, tone === 'dark' ? styles.valueDark : null]}>
            {counts[stage.status].toString().padStart(2, '0')}
          </Text>
          <Text style={[styles.label, tone === 'dark' ? styles.labelDark : null]}>{getStatusLabel(stage.status)}</Text>
          {index < franchiseeFlowStages.length - 1 ? <Divider style={[styles.divider, tone === 'dark' ? styles.dividerDark : null]} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    gap: theme.spacing.sm,
    minHeight: 92,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  cellDark: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cellMobile: {
    width: '48%',
  },
  cellTablet: {
    width: '31.5%',
  },
  cellWide: {
    flex: 1,
    width: 'auto',
  },
  container: {
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  containerDark: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  divider: {
    marginTop: 'auto',
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  labelDark: {
    color: theme.colors.text.inverseMuted,
  },
  value: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  valueDark: {
    color: theme.colors.text.inverse,
  },
});
