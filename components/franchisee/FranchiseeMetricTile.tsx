import { StyleSheet, Text, View } from 'react-native';

import { Divider } from '@/components/ui/Divider';
import { theme } from '@/lib/theme/tokens';

type FranchiseeMetricTileProps = {
  helper?: string;
  label: string;
  tone?: 'light' | 'dark';
  value: string;
};

export function FranchiseeMetricTile({ helper, label, tone = 'light', value }: FranchiseeMetricTileProps) {
  return (
    <View style={[styles.tile, tone === 'dark' ? styles.tileDark : null]}>
      <Text style={[styles.label, tone === 'dark' ? styles.labelDark : null]}>{label}</Text>
      <Text style={[styles.value, tone === 'dark' ? styles.valueDark : null]}>{value}</Text>
      {helper ? (
        <>
          <Divider style={tone === 'dark' ? styles.dividerDark : null} />
          <Text style={[styles.helper, tone === 'dark' ? styles.helperDark : null]}>{helper}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  helper: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  helperDark: {
    color: theme.colors.text.inverseMuted,
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
  tile: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    minHeight: 168,
    padding: theme.spacing.lg,
  },
  tileDark: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  value: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
  },
  valueDark: {
    color: theme.colors.text.inverse,
  },
});
