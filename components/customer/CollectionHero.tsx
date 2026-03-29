import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/lib/theme/tokens';

type CollectionHeroProps = {
  body: string;
  eyebrow: string;
  onPress: () => void;
  title: string;
};

export function CollectionHero({ body, eyebrow, onPress, title }: CollectionHeroProps) {
  return (
    <Card padding="lg" variant="inverse">
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button label="Explore collection" onPress={onPress} size="sm" style={styles.button} variant="secondary" />
    </Card>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  button: {
    alignSelf: 'flex-start',
  },
  eyebrow: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxxl,
    lineHeight: theme.typography.lineHeight.xxxl,
  },
});
