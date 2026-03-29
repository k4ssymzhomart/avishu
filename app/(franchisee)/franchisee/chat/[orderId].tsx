import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { AssetIcon } from '@/components/icons/AssetIcon';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useOrderChatMessages } from '@/hooks/useChat';
import { useFranchiseeI18n } from '@/hooks/useFranchiseeI18n';
import { useFranchiseeWorkspace } from '@/hooks/useFranchiseeWorkspace';
import { useFranchiseeOrders } from '@/hooks/useOrders';
import { theme } from '@/lib/theme/tokens';
import { sendOrderMessage } from '@/services/chat';
import type { OrderChatMessage } from '@/types/chat';

export default function FranchiseeChatThreadScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const workspace = useFranchiseeWorkspace();
  const { copy, formatRelativeLabel, getProcessSteps, getStatusLabel } = useFranchiseeI18n();
  const scope = useMemo(
    () =>
      workspace.userId
        ? {
            branchId: workspace.branchId ?? null,
            franchiseId: workspace.franchiseId,
          }
        : null,
    [workspace.branchId, workspace.franchiseId, workspace.userId],
  );
  const { orders } = useFranchiseeOrders(scope);
  const { isLoading, messages } = useOrderChatMessages(orderId ?? null, 'franchisee');
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<OrderChatMessage[]>([]);

  const order = useMemo(() => orders.find((entry) => entry.id === orderId), [orderId, orders]);
  const processSteps = useMemo(() => (order ? getProcessSteps(order) : []), [getProcessSteps, order]);
  const displayMessages = useMemo(
    () => [...messages, ...optimisticMessages].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)),
    [messages, optimisticMessages],
  );

  useEffect(() => {
    setOptimisticMessages((current) =>
      current.filter(
        (optimisticMessage) =>
          !messages.some(
            (message) =>
              message.senderId === optimisticMessage.senderId &&
              message.text === optimisticMessage.text &&
              Math.abs(Date.parse(message.createdAt) - Date.parse(optimisticMessage.createdAt)) < 60000,
          ),
      ),
    );
  }, [messages]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 40);

    return () => clearTimeout(timeout);
  }, [displayMessages.length]);

  const handleSend = async () => {
    if (!orderId || !draft.trim().length || !workspace.userId || isSending) {
      return;
    }

    const nextText = draft.trim();
    const optimisticMessage: OrderChatMessage = {
      createdAt: new Date().toISOString(),
      id: `optimistic-${Date.now()}`,
      orderId,
      senderId: workspace.userId,
      senderName: workspace.branchName ?? workspace.profile?.name ?? 'AVISHU Boutique',
      senderRole: 'franchisee',
      text: nextText,
    };

    setIsSending(true);
    setDraft('');
    inputRef.current?.clear();
    setOptimisticMessages((current) => [...current, optimisticMessage]);

    try {
      await sendOrderMessage({
        orderId,
        senderId: workspace.userId,
        senderName: workspace.branchName ?? workspace.profile?.name ?? 'AVISHU Boutique',
        senderRole: 'franchisee',
        text: nextText,
      });
      Keyboard.dismiss();
      inputRef.current?.clear();
    } catch {
      setDraft(nextText);
      setOptimisticMessages((current) => current.filter((message) => message.id !== optimisticMessage.id));
      inputRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Screen
      contentContainerStyle={styles.content}
      footer={
        <View style={styles.composerShell}>
          <View style={styles.composerField}>
            <Text style={styles.composerLabel}>{copy.chat.composerLabel}</Text>
            <View style={styles.composerRow}>
              <TextInput
                multiline
                onChangeText={setDraft}
                placeholder={copy.chat.composerPlaceholder}
                placeholderTextColor={theme.colors.text.tertiary}
                ref={inputRef}
                returnKeyType="default"
                style={styles.composerInput}
                textAlignVertical="top"
                value={draft}
              />
              <Pressable
                disabled={isSending || !draft.trim().length}
                onPress={() => void handleSend()}
                style={({ pressed }) => [
                  styles.sendButton,
                  pressed ? styles.sendButtonPressed : null,
                  isSending || !draft.trim().length ? styles.sendButtonDisabled : null,
                ]}
              >
                <View style={styles.sendIconWrap}>
                  <AssetIcon color={theme.colors.text.inverse} name="backArrow" size={14} />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      }
      keyboardVerticalOffset={18}
      scroll
      scrollRef={scrollRef}
    >
      <AppHeader
        eyebrow={copy.chat.eyebrow}
        onBackPress={() => router.back()}
        showBackButton
        subtitle={order ? `${order.customerName} / ${getStatusLabel(order.status)}` : copy.chat.noOrderSubtitle}
        title={order ? order.productName : copy.chat.titleFallback}
      />

      {order ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{copy.chat.titleOrder}</Text>
          <Text style={styles.summaryValue}>{order.id}</Text>
          <Text style={styles.summaryBody}>{copy.chat.noOrderSubtitle}</Text>
        </View>
      ) : null}

      {processSteps.length ? (
        <View style={styles.processCard}>
          <Text style={styles.processLabel}>{copy.chat.process}</Text>
          {processSteps.map((step, index) => (
            <View key={step.label}>
              {index ? <Divider /> : null}
              <View style={styles.processRow}>
                <Text style={[styles.processValue, step.isCurrent ? styles.processValueCurrent : null]}>
                  {step.label}
                </Text>
                <Text style={styles.processMeta}>
                  {step.timestamp ? formatRelativeLabel(step.timestamp) : step.isCurrent ? copy.common.now : copy.common.pending}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {isLoading && !displayMessages.length ? (
        <LoadingState label={copy.chat.titleFallback} />
      ) : displayMessages.length ? (
        <View style={styles.messageList}>
          {displayMessages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
        </View>
      ) : (
        <EmptyState description={copy.chat.emptyDescription} title={copy.chat.emptyTitle} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  composerField: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 24,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  composerInput: {
    color: theme.colors.text.primary,
    flex: 1,
    fontSize: theme.typography.size.md,
    maxHeight: 120,
    minHeight: 40,
    paddingVertical: theme.spacing.xs,
    textAlignVertical: 'top',
  },
  composerLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  composerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  composerShell: {
    gap: theme.spacing.md,
  },
  content: {
    gap: theme.spacing.xl,
  },
  messageList: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  processCard: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.md,
    overflow: 'hidden',
    padding: theme.spacing.lg,
  },
  processLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  processMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  processRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  processValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.wide,
    textTransform: 'uppercase',
  },
  processValueCurrent: {
    fontWeight: theme.typography.weight.semibold,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 18,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    opacity: 0.42,
  },
  sendButtonPressed: {
    opacity: 0.82,
  },
  sendIconWrap: {
    transform: [{ rotate: '180deg' }],
  },
  summaryBody: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.thin,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  summaryLabel: {
    color: theme.colors.text.inverseMuted,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
});
