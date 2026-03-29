import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { OrderChatPreviewCard } from '@/components/chat/OrderChatPreviewCard';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomerChatThreads } from '@/hooks/useChat';
import { customerBottomNav } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';

function getLayout(width: number) {
  const maxContentWidth = width >= 1360 ? 1100 : width >= 960 ? 900 : undefined;

  return { isWide: width >= 960, maxContentWidth };
}

export default function CustomerChatScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { isLoading, threads } = useCustomerChatThreads(currentUserId);
  const { width } = useWindowDimensions();
  const layout = useMemo(() => getLayout(width), [width]);

  const activeThreads = threads.filter(
    (thread) => thread.orderStatus !== 'delivered' && thread.orderStatus !== 'cancelled',
  );
  const archivedThreads = threads.filter(
    (thread) => thread.orderStatus === 'delivered' || thread.orderStatus === 'cancelled',
  );
  const unreadCount = threads.reduce((count, thread) => count + thread.unreadCountForCustomer, 0);

  return (
    <Screen
      footer={<RoleBottomNav activeKey="chat" items={customerBottomNav} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <View style={[styles.header, layout.isWide ? styles.headerWide : null]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AVISHU / CHAT</Text>
          <Text style={styles.title}>Support chat</Text>
          <Text style={styles.subtitle}>
            Each conversation stays tied to one order so sizing and delivery updates remain easy to follow.
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{unreadCount}</Text>
          <Text style={styles.summaryLabel}>Unread</Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingState label="Loading conversations" />
      ) : threads.length ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current conversations</Text>
              <Text style={styles.sectionMeta}>{activeThreads.length} active</Text>
            </View>
            {activeThreads.length ? (
              <View style={styles.threadList}>
                {activeThreads.map((thread) => (
                  <OrderChatPreviewCard
                    key={thread.id}
                    onPress={() => router.push(`/customer/chat/${thread.orderId}`)}
                    thread={thread}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                description="Open support threads will appear here as soon as an order receives its first update."
                title="No active conversations"
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Archived conversations</Text>
              <Text style={styles.sectionMeta}>{archivedThreads.length} closed</Text>
            </View>
            {archivedThreads.length ? (
              <View style={styles.threadList}>
                {archivedThreads.map((thread) => (
                  <OrderChatPreviewCard
                    key={thread.id}
                    onPress={() => router.push(`/customer/chat/${thread.orderId}`)}
                    thread={thread}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                description="Delivered order threads will move here once the active support flow is complete."
                title="No archived conversations"
              />
            )}
          </View>
        </>
      ) : (
        <EmptyState
          description="Your order conversations will appear here automatically after the boutique sends the first update."
          title="No messages yet"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  header: {
    gap: theme.spacing.lg,
  },
  headerCopy: {
    gap: theme.spacing.sm,
    maxWidth: 560,
  },
  headerWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    borderBottomColor: theme.colors.border.subtle,
    borderBottomWidth: theme.borders.width.thin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
  },
  sectionMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
    maxWidth: 480,
  },
  summaryBox: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.subtle,
    borderWidth: theme.borders.width.thin,
    gap: 2,
    minWidth: 118,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  threadList: {
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: theme.borders.width.thin,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: 28,
    lineHeight: 34,
  },
});
