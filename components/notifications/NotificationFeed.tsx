import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetIcon, type AssetIconName } from '@/components/icons/AssetIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { theme } from '@/lib/theme/tokens';
import { formatRelativeTime } from '@/lib/utils/format';

export type NotificationFeedItem = {
  action: () => void;
  body: string;
  icon: AssetIconName;
  id: string;
  timestamp: string;
  title: string;
  unread?: boolean;
};

type NotificationFeedProps = {
  emptyDescription: string;
  emptyTitle: string;
  isLoading: boolean;
  items: NotificationFeedItem[];
};

export function NotificationFeed({ emptyDescription, emptyTitle, isLoading, items }: NotificationFeedProps) {
  if (isLoading && !items.length) {
    return <LoadingState label="Loading notifications" />;
  }

  if (!items.length) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={item.action} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
          <View style={styles.iconChip}>
            <AssetIcon color={theme.colors.text.primary} name={item.icon} size={14} />
          </View>

          <View style={styles.copy}>
            <View style={styles.rowTop}>
              <Text numberOfLines={1} style={styles.title}>
                {item.title}
              </Text>
              <Text style={styles.time}>{formatRelativeTime(item.timestamp)}</Text>
            </View>
            <Text numberOfLines={2} style={styles.body}>
              {item.body}
            </Text>
          </View>

          {item.unread ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  iconChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  list: {
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: theme.borders.width.thin,
  },
  pressed: {
    opacity: 0.82,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 86,
    paddingVertical: theme.spacing.md,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  time: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  unreadDot: {
    backgroundColor: theme.colors.surface.inverse,
    height: 8,
    width: 8,
  },
});
