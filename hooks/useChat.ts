import { useEffect, useMemo, useState } from 'react';

import {
  markCustomerThreadRead,
  markSupportThreadRead,
  sendOrderMessage,
  subscribeToCustomerChatThreads,
  subscribeToFranchiseeChatThreads,
  subscribeToOrderMessages,
  subscribeToSupportChatThreads,
} from '@/services/chat';
import type { CreateOrderChatMessageInput, OrderChatMessage, OrderChatThread } from '@/types/chat';
import type { FranchiseeOrderScope } from '@/types/order';

const SUBSCRIPTION_IDLE_MS = 2500;

const threadCache = new Map<string, OrderChatThread[]>();
const threadListeners = new Map<string, Set<(threads: OrderChatThread[]) => void>>();
const threadSubscriptions = new Map<string, () => void>();
const threadCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

const messageCache = new Map<string, OrderChatMessage[]>();
const messageListeners = new Map<string, Set<(messages: OrderChatMessage[]) => void>>();
const messageSubscriptions = new Map<string, () => void>();
const messageCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearThreadCleanupTimer(cacheKey: string) {
  const activeTimer = threadCleanupTimers.get(cacheKey);

  if (!activeTimer) {
    return;
  }

  clearTimeout(activeTimer);
  threadCleanupTimers.delete(cacheKey);
}

function clearMessageCleanupTimer(cacheKey: string) {
  const activeTimer = messageCleanupTimers.get(cacheKey);

  if (!activeTimer) {
    return;
  }

  clearTimeout(activeTimer);
  messageCleanupTimers.delete(cacheKey);
}

function scheduleThreadCleanup(cacheKey: string) {
  clearThreadCleanupTimer(cacheKey);

  const timer = setTimeout(() => {
    if ((threadListeners.get(cacheKey)?.size ?? 0) > 0) {
      return;
    }

    threadSubscriptions.get(cacheKey)?.();
    threadSubscriptions.delete(cacheKey);
    threadCleanupTimers.delete(cacheKey);
  }, SUBSCRIPTION_IDLE_MS);

  threadCleanupTimers.set(cacheKey, timer);
}

function scheduleMessageCleanup(cacheKey: string) {
  clearMessageCleanupTimer(cacheKey);

  const timer = setTimeout(() => {
    if ((messageListeners.get(cacheKey)?.size ?? 0) > 0) {
      return;
    }

    messageSubscriptions.get(cacheKey)?.();
    messageSubscriptions.delete(cacheKey);
    messageCleanupTimers.delete(cacheKey);
  }, SUBSCRIPTION_IDLE_MS);

  messageCleanupTimers.set(cacheKey, timer);
}

function publishThreads(cacheKey: string, nextThreads: OrderChatThread[]) {
  threadCache.set(cacheKey, nextThreads);

  threadListeners.get(cacheKey)?.forEach((listener) => {
    listener(nextThreads);
  });
}

function publishMessages(cacheKey: string, nextMessages: OrderChatMessage[]) {
  messageCache.set(cacheKey, nextMessages);

  messageListeners.get(cacheKey)?.forEach((listener) => {
    listener(nextMessages);
  });
}

function ensureThreadSubscription(
  cacheKey: string,
  subscribe: (onThreads: (threads: OrderChatThread[]) => void) => () => void,
) {
  clearThreadCleanupTimer(cacheKey);

  if (threadSubscriptions.has(cacheKey)) {
    return;
  }

  threadSubscriptions.set(
    cacheKey,
    subscribe((nextThreads) => {
      publishThreads(cacheKey, nextThreads);
    }),
  );
}

function ensureMessageSubscription(
  cacheKey: string,
  subscribe: (onMessages: (messages: OrderChatMessage[]) => void) => () => void,
) {
  clearMessageCleanupTimer(cacheKey);

  if (messageSubscriptions.has(cacheKey)) {
    return;
  }

  messageSubscriptions.set(
    cacheKey,
    subscribe((nextMessages) => {
      publishMessages(cacheKey, nextMessages);
    }),
  );
}

function useThreadSubscription(
  cacheKey: string | null,
  subscribe: ((onThreads: (threads: OrderChatThread[]) => void) => () => void) | null,
) {
  const [threads, setThreads] = useState<OrderChatThread[]>(() => (cacheKey ? threadCache.get(cacheKey) ?? [] : []));
  const [isLoading, setIsLoading] = useState(() => (cacheKey ? !threadCache.has(cacheKey) : false));

  useEffect(() => {
    if (!subscribe || !cacheKey) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    const cachedThreads = threadCache.get(cacheKey);
    const listener = (nextThreads: OrderChatThread[]) => {
      setThreads(nextThreads);
      setIsLoading(false);
    };

    if (cachedThreads) {
      setThreads(cachedThreads);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const listeners = threadListeners.get(cacheKey) ?? new Set<(threads: OrderChatThread[]) => void>();
    listeners.add(listener);
    threadListeners.set(cacheKey, listeners);

    ensureThreadSubscription(cacheKey, subscribe);

    return () => {
      const activeListeners = threadListeners.get(cacheKey);

      activeListeners?.delete(listener);

      if (!activeListeners?.size) {
        threadListeners.delete(cacheKey);
        scheduleThreadCleanup(cacheKey);
      }
    };
  }, [cacheKey, subscribe]);

  return {
    isLoading,
    threads,
  };
}

function useMessageSubscription(
  cacheKey: string | null,
  subscribe: ((onMessages: (messages: OrderChatMessage[]) => void) => () => void) | null,
) {
  const [messages, setMessages] = useState<OrderChatMessage[]>(() => (cacheKey ? messageCache.get(cacheKey) ?? [] : []));
  const [isLoading, setIsLoading] = useState(() => (cacheKey ? !messageCache.has(cacheKey) : false));

  useEffect(() => {
    if (!subscribe || !cacheKey) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const cachedMessages = messageCache.get(cacheKey);
    const listener = (nextMessages: OrderChatMessage[]) => {
      setMessages(nextMessages);
      setIsLoading(false);
    };

    if (cachedMessages) {
      setMessages(cachedMessages);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const listeners = messageListeners.get(cacheKey) ?? new Set<(messages: OrderChatMessage[]) => void>();
    listeners.add(listener);
    messageListeners.set(cacheKey, listeners);

    ensureMessageSubscription(cacheKey, subscribe);

    return () => {
      const activeListeners = messageListeners.get(cacheKey);

      activeListeners?.delete(listener);

      if (!activeListeners?.size) {
        messageListeners.delete(cacheKey);
        scheduleMessageCleanup(cacheKey);
      }
    };
  }, [cacheKey, subscribe]);

  return {
    isLoading,
    messages,
  };
}

export function useCustomerChatThreads(customerId: string | null) {
  const subscribe = useMemo(
    () =>
      customerId
        ? (onThreads: (nextThreads: OrderChatThread[]) => void) => subscribeToCustomerChatThreads(customerId, onThreads)
        : null,
    [customerId],
  );

  return useThreadSubscription(customerId ? `customer:${customerId}` : null, subscribe);
}

export function useSupportChatThreads(orderIds: string[]) {
  const subscribe = useMemo(
    () => (onThreads: (nextThreads: OrderChatThread[]) => void) => subscribeToSupportChatThreads(onThreads),
    [],
  );
  const { isLoading, threads } = useThreadSubscription('support:all', subscribe);

  const filteredThreads = useMemo(() => {
    if (!orderIds.length) {
      return [];
    }

    const orderIdSet = new Set(orderIds);
    return threads.filter((thread) => orderIdSet.has(thread.orderId));
  }, [orderIds, threads]);

  return {
    isLoading,
    threads: filteredThreads,
  };
}

export function useFranchiseeChatThreads(scope: FranchiseeOrderScope | string | null) {
  const cacheKey = useMemo(() => {
    if (!scope) {
      return null;
    }

    if (typeof scope === 'string') {
      return `franchisee:${scope}`;
    }

    return `franchisee:${scope.franchiseId}:${scope.branchId ?? 'all'}`;
  }, [scope]);

  const subscribe = useMemo(
    () =>
      scope
        ? (onThreads: (nextThreads: OrderChatThread[]) => void) => subscribeToFranchiseeChatThreads(scope, onThreads)
        : null,
    [scope],
  );

  return useThreadSubscription(cacheKey, subscribe);
}

export function useOrderChatMessages(orderId: string | null, viewer: 'customer' | 'support' | 'franchisee' = 'customer') {
  const subscribe = useMemo(
    () =>
      orderId ? (onMessages: (nextMessages: OrderChatMessage[]) => void) => subscribeToOrderMessages(orderId, onMessages) : null,
    [orderId],
  );
  const cacheKey = orderId ? `order:${orderId}` : null;
  const result = useMessageSubscription(cacheKey, subscribe);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    void (viewer === 'customer' ? markCustomerThreadRead(orderId) : markSupportThreadRead(orderId));
  }, [orderId, viewer]);

  const sendMessage = useMemo(
    () =>
      async (input: CreateOrderChatMessageInput) => {
        if (!orderId || !cacheKey) {
          return null;
        }

        const optimisticMessage: OrderChatMessage = {
          createdAt: new Date().toISOString(),
          id: `optimistic-${Math.floor(Date.now() / 1000).toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          orderId,
          senderId: input.senderId,
          senderName: input.senderName,
          senderRole: input.senderRole,
          text: input.text.trim(),
        };
        const previousMessages = messageCache.get(cacheKey) ?? result.messages;
        const nextMessages = [...previousMessages, optimisticMessage];

        publishMessages(cacheKey, nextMessages);

        try {
          await sendOrderMessage(input);
          return optimisticMessage.id;
        } catch (error) {
          publishMessages(cacheKey, previousMessages);
          throw error;
        }
      },
    [cacheKey, orderId, result.messages],
  );

  return {
    ...result,
    sendMessage,
  };
}
