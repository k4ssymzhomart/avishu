import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { AssetIcon } from '@/components/icons/AssetIcon';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useOrderChatMessages } from '@/hooks/useChat';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { useCustomerOrders } from '@/hooks/useOrders';
import { theme } from '@/lib/theme/tokens';
import { formatDeliveryMethod, formatOrderStatus, formatRelativeTime } from '@/lib/utils/format';
import { useSessionStore } from '@/store/session';

function getMaxWidth(width: number) {
  if (width >= 1360) {
    return 1020;
  }

  if (width >= 1180) {
    return 960;
  }

  if (width >= 780) {
    return 860;
  }

  return undefined;
}

export default function CustomerChatThreadScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { copy, language } = useCustomerI18n();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const { orders } = useCustomerOrders(currentUserId);
  const { isLoading, messages, sendMessage } = useOrderChatMessages(orderId ?? null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { width } = useWindowDimensions();

  const maxContentWidth = useMemo(() => getMaxWidth(width), [width]);
  const order = useMemo(() => orders.find((entry) => entry.id === orderId), [orderId, orders]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 40);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  const handleSend = async () => {
    if (!orderId || !draft.trim().length || !currentUserId) {
      return;
    }

    const nextText = draft.trim();

    setIsSending(true);
    setDraft('');

    try {
      await sendMessage({
        orderId,
        senderId: currentUserId,
        senderName: currentUserName ?? (language === 'ru' ? 'РљР»РёРµРЅС‚' : 'Customer'),
        senderRole: 'customer',
        text: nextText,
      });
    } catch {
      setDraft(nextText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen
      contentContainerStyle={styles.page}
      footer={
        <View style={styles.composerShell}>
          <View style={styles.composerField}>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder={copy.chatThread.composerPlaceholder}
              placeholderTextColor={theme.colors.text.tertiary}
              style={styles.composerInput}
              textAlignVertical="top"
              value={draft}
            />
          </View>
          <Pressable
            disabled={isSending || !draft.trim().length}
            onPress={() => void handleSend()}
            style={({ pressed }) => [
              styles.sendButton,
              pressed ? styles.sendButtonPressed : null,
              isSending || !draft.trim().length ? styles.sendButtonDisabled : null,
            ]}
          >
            <Text style={styles.sendButtonLabel}>{isSending ? copy.chatThread.sending : copy.chatThread.send}</Text>
          </Pressable>
        </View>
      }
      footerMaxWidth={maxContentWidth}
      maxContentWidth={maxContentWidth}
      scroll
      scrollRef={scrollRef}
    >
      <AppHeader
        eyebrow={language === 'ru' ? 'AVISHU / ЧАТ ПО ЗАКАЗУ' : 'AVISHU / ORDER CHAT'}
        onBackPress={() => router.back()}
        showBackButton
        subtitle={order ? `${order.id} / ${order.productName}` : copy.chatThread.fallbackSubtitle}
        title={copy.chatThread.title}
      />

      {order ? (
        <Card padding="lg" style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderCopy}>
              <Text style={styles.orderEyebrow}>{order.id}</Text>
              <Text style={styles.orderTitle}>{order.productName}</Text>
            </View>
            <Badge label={formatOrderStatus(order.status, language)} variant="muted" />
          </View>

          <View style={styles.orderMetaRow}>
            <View style={styles.orderMetaBlock}>
              <Text style={styles.metaLabel}>{copy.chatThread.delivery}</Text>
              <Text style={styles.metaValue}>{formatDeliveryMethod(order.delivery.method, language)}</Text>
            </View>
            <View style={styles.orderMetaBlock}>
              <Text style={styles.metaLabel}>{copy.chatThread.lastUpdate}</Text>
              <Text style={styles.metaValue}>{formatRelativeTime(order.updatedAt, language)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <AssetIcon color={theme.colors.text.primary} name="address" size={16} />
            <Text style={styles.summaryText}>{order.delivery.address ?? copy.chatThread.addressFallback}</Text>
          </View>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingState label={copy.chatThread.loading} />
      ) : messages.length ? (
        <View style={styles.messageList}>
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} language={language} message={message} viewerRole="customer" />
          ))}
        </View>
      ) : (
        <EmptyState description={copy.chatThread.emptyDescription} title={copy.chatThread.emptyTitle} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  composerField: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 22,
    borderWidth: theme.borders.width.thin,
    flex: 1,
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  composerInput: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.md,
    maxHeight: 120,
    minHeight: 40,
    padding: 0,
  },
  composerShell: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  messageList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  orderCard: {
    borderRadius: 24,
    gap: theme.spacing.lg,
  },
  orderEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  orderHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  orderHeaderCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  orderMetaBlock: {
    backgroundColor: theme.colors.surface.muted,
    borderRadius: 18,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 140,
    padding: theme.spacing.md,
  },
  orderMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  orderTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  page: {
    gap: theme.spacing.xl,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 22,
    justifyContent: 'center',
    minHeight: 58,
    minWidth: 94,
    paddingHorizontal: theme.spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.42,
  },
  sendButtonLabel: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sendButtonPressed: {
    opacity: 0.82,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryText: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
