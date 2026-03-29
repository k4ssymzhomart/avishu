import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import { formatChatTimestamp } from '@/lib/utils/format';
import type { OrderChatMessage } from '@/types/chat';

type ChatMessageBubbleProps = {
  message: OrderChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isCustomer = message.senderRole === 'customer';
  const senderLabel = message.senderName?.trim().length ? message.senderName.trim() : 'AVISHU Care';

  return (
    <View style={[styles.row, isCustomer ? styles.rowCustomer : null]}>
      <View style={[styles.bubble, isCustomer ? styles.customerBubble : styles.supportBubble]}>
        {!isCustomer ? <Text style={styles.sender}>{senderLabel}</Text> : null}
        <Text style={[styles.text, isCustomer ? styles.customerText : null]}>{message.text}</Text>
        <Text style={[styles.timestamp, isCustomer ? styles.customerTimestamp : null]}>
          {formatChatTimestamp(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: theme.borders.width.thin,
    gap: 6,
    maxWidth: '76%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  customerBubble: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  customerText: {
    color: theme.colors.text.inverse,
  },
  customerTimestamp: {
    color: theme.colors.text.inverseMuted,
  },
  row: {
    flexDirection: 'row',
  },
  rowCustomer: {
    justifyContent: 'flex-end',
  },
  sender: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  supportBubble: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  timestamp: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
});
