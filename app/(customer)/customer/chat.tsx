import { useMemo } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { OrderChatPreviewCard } from '@/components/chat/OrderChatPreviewCard';
import { Screen } from '@/components/layout/Screen';
import { RoleBottomNav } from '@/components/navigation/RoleBottomNav';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useCustomerChatThreads } from '@/hooks/useChat';
import { useCustomerI18n } from '@/hooks/useCustomerI18n';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';

function getLayout(width: number) {
  const maxContentWidth = width >= 1360 ? 1100 : width >= 960 ? 900 : undefined;

  return { isWide: width >= 960, maxContentWidth };
}

export default function CustomerChatScreen() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { copy, language, navItems } = useCustomerI18n();
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
      footer={<RoleBottomNav activeKey="chat" items={navItems} variant="floating" />}
      footerMaxWidth={540}
      footerMode="floating"
      maxContentWidth={layout.maxContentWidth}
      scroll
    >
      <View style={[styles.header, layout.isWide ? styles.headerWide : null]}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{language === 'ru' ? 'AVISHU / ЧАТ' : 'AVISHU / CHAT'}</Text>
          <Text style={styles.title}>{copy.chat.supportTitle}</Text>
          <Text style={styles.subtitle}>{copy.chat.subtitle}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>{unreadCount}</Text>
          <Text style={styles.summaryLabel}>{copy.chat.unread}</Text>
        </View>
      </View>

      {isLoading ? (
        <LoadingState label={language === 'ru' ? 'Загрузка диалогов' : 'Loading conversations'} />
      ) : threads.length ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{copy.chat.current}</Text>
              <Text style={styles.sectionMeta}>{`${activeThreads.length} ${language === 'ru' ? 'активно' : 'active'}`}</Text>
            </View>
            {activeThreads.length ? (
              <View style={styles.threadList}>
                {activeThreads.map((thread) => (
                  <OrderChatPreviewCard
                    language={language}
                    key={thread.id}
                    onPress={() => router.push(`/customer/chat/${thread.orderId}`)}
                    thread={thread}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                description={copy.chat.noActiveDescription}
                title={copy.chat.noActiveTitle}
              />
            )}
          </View>

          {archivedThreads.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{copy.chat.archived}</Text>
                <Text style={styles.sectionMeta}>{`${archivedThreads.length} ${copy.chat.closed}`}</Text>
              </View>
              <View style={styles.threadList}>
                {archivedThreads.map((thread) => (
                  <OrderChatPreviewCard
                    language={language}
                    key={thread.id}
                    onPress={() => router.push(`/customer/chat/${thread.orderId}`)}
                    thread={thread}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <EmptyState
          description={copy.chat.emptyDescription}
          title={copy.chat.emptyTitle}
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
