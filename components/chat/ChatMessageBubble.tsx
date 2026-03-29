import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';
import { formatChatTimestamp } from '@/lib/utils/format';
import type { ChatSenderRole, OrderChatMessage } from '@/types/chat';

type ChatMessageBubbleProps = {
  language?: 'en' | 'ru';
  message: OrderChatMessage;
  viewerRole?: ChatSenderRole;
};

function getSenderFallback(role: ChatSenderRole, language: 'en' | 'ru') {
  if (role === 'customer') {
    return language === 'ru' ? 'РљР»РёРµРЅС‚' : 'Customer';
  }

  if (role === 'franchisee') {
    return 'AVISHU Boutique';
  }

  if (role === 'production') {
    return 'AVISHU Atelier';
  }

  return 'AVISHU Care';
}

export function ChatMessageBubble({ language = 'en', message, viewerRole = 'customer' }: ChatMessageBubbleProps) {
  const isOwnMessage = message.senderRole === viewerRole;
  const isCustomerMessage = message.senderRole === 'customer';
  const senderLabel =
    message.senderName?.trim().length ? message.senderName.trim() : getSenderFallback(message.senderRole, language);

  return (
    <View style={[styles.row, isOwnMessage ? styles.rowOwn : null]}>
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.incomingBubble,
          !isOwnMessage && isCustomerMessage ? styles.incomingCustomerBubble : null,
        ]}
      >
        {!isOwnMessage ? (
          <Text style={[styles.sender, isCustomerMessage ? styles.senderCustomer : null]}>{senderLabel}</Text>
        ) : null}
        <Text style={[styles.text, isOwnMessage ? styles.ownText : null]}>{message.text}</Text>
        <Text style={[styles.timestamp, isOwnMessage ? styles.ownTimestamp : null]}>
          {formatChatTimestamp(message.createdAt, language)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: theme.borders.width.thin,
    borderRadius: 22,
    gap: 6,
    maxWidth: '76%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  incomingBubble: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
  },
  incomingCustomerBubble: {
    backgroundColor: theme.colors.surface.default,
  },
  ownBubble: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  ownText: {
    color: theme.colors.text.inverse,
  },
  ownTimestamp: {
    color: theme.colors.text.inverseMuted,
  },
  row: {
    flexDirection: 'row',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  sender: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  senderCustomer: {
    color: theme.colors.text.primary,
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
