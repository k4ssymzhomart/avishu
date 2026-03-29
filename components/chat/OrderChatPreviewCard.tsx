import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { theme } from '@/lib/theme/tokens';
import { formatChatTimestamp, formatOrderStatus } from '@/lib/utils/format';
import type { OrderChatThread } from '@/types/chat';

type OrderChatPreviewCardProps = {
  language?: 'en' | 'ru';
  onPress: () => void;
  thread: OrderChatThread;
};

export function OrderChatPreviewCard({ language = 'en', onPress, thread }: OrderChatPreviewCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text numberOfLines={1} style={styles.title}>
            {thread.productName}
          </Text>
          <Text style={styles.timestamp}>{formatChatTimestamp(thread.lastMessageAt, language)}</Text>
        </View>

        <Text style={styles.orderId}>{thread.orderId}</Text>
        <Text numberOfLines={2} style={styles.message}>
          {thread.lastMessageText}
        </Text>
      </View>

      <View style={styles.side}>
        <Badge
          label={formatOrderStatus(thread.orderStatus, language)}
          variant={thread.unreadCountForCustomer ? 'inverse' : 'outline'}
        />
        {thread.unreadCountForCustomer ? (
          <Text style={styles.unread}>
            {language === 'ru' ? `${thread.unreadCountForCustomer} непрочит.` : `${thread.unreadCountForCustomer} unread`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    marginRight: theme.spacing.md,
  },
  message: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  orderId: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.82,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 96,
    paddingVertical: theme.spacing.md,
  },
  side: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  timestamp: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
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
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  unread: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
});
