import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { SkeletonBlock, SkeletonText } from '@/components/ui/SkeletonBlock';
import { theme } from '@/lib/theme/tokens';

type ProductionBoardSkeletonProps = {
  count?: number;
};

export function ProductionBoardSkeleton({ count = 2 }: ProductionBoardSkeletonProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} padding="none" style={styles.card}>
          <SkeletonBlock borderRadius={0} height={220} />

          <View style={styles.body}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <SkeletonBlock height={12} width="44%" />
                <SkeletonBlock height={26} width="82%" />
                <SkeletonBlock height={16} width="52%" />
              </View>
              <SkeletonBlock height={34} width={118} />
            </View>

            <View style={styles.metaGrid}>
              <SkeletonBlock height={76} width="48.5%" />
              <SkeletonBlock height={76} width="48.5%" />
              <SkeletonBlock height={76} width="48.5%" />
              <SkeletonBlock height={76} width="48.5%" />
            </View>

            <View style={styles.noteBlock}>
              <SkeletonText lines={2} />
            </View>

            <View style={styles.actions}>
              <SkeletonBlock height={56} width="100%" />
              <SkeletonBlock height={56} width="100%" />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.sm,
  },
  body: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.lg,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  noteBlock: {
    gap: theme.spacing.sm,
  },
});
