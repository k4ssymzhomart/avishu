import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type SectionTitleProps = {
  label: string;
  description?: string;
};

export function SectionTitle({ label, description }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  description: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 320,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
});
