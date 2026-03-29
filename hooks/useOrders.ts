import { useEffect, useMemo, useState } from 'react';

import {
  subscribeToCustomerOrders,
  subscribeToFranchiseeOrders,
  subscribeToProductionOrders,
} from '@/services/orders';
import type { FranchiseeOrderScope, Order } from '@/types/order';

const SUBSCRIPTION_IDLE_MS = 2500;

const ordersCache = new Map<string, Order[]>();
const orderListeners = new Map<string, Set<(orders: Order[]) => void>>();
const orderSubscriptions = new Map<string, () => void>();
const orderCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearCleanupTimer(cacheKey: string) {
  const activeTimer = orderCleanupTimers.get(cacheKey);

  if (!activeTimer) {
    return;
  }

  clearTimeout(activeTimer);
  orderCleanupTimers.delete(cacheKey);
}

function scheduleSubscriptionCleanup(cacheKey: string) {
  clearCleanupTimer(cacheKey);

  const timer = setTimeout(() => {
    if ((orderListeners.get(cacheKey)?.size ?? 0) > 0) {
      return;
    }

    orderSubscriptions.get(cacheKey)?.();
    orderSubscriptions.delete(cacheKey);
    orderCleanupTimers.delete(cacheKey);
  }, SUBSCRIPTION_IDLE_MS);

  orderCleanupTimers.set(cacheKey, timer);
}

function publishOrders(cacheKey: string, nextOrders: Order[]) {
  ordersCache.set(cacheKey, nextOrders);

  orderListeners.get(cacheKey)?.forEach((listener) => {
    listener(nextOrders);
  });
}

function ensureOrdersSubscription(
  cacheKey: string,
  subscribe: (onOrders: (orders: Order[]) => void) => () => void,
) {
  clearCleanupTimer(cacheKey);

  if (orderSubscriptions.has(cacheKey)) {
    return;
  }

  const unsubscribe = subscribe((nextOrders) => {
    publishOrders(cacheKey, nextOrders);
  });

  orderSubscriptions.set(cacheKey, unsubscribe);
}

function useSubscribedOrders(
  cacheKey: string | null,
  subscribe: ((onOrders: (orders: Order[]) => void) => () => void) | null,
) {
  const [orders, setOrders] = useState<Order[]>(() => (cacheKey ? ordersCache.get(cacheKey) ?? [] : []));
  const [isLoading, setIsLoading] = useState(() => (cacheKey ? !ordersCache.has(cacheKey) : false));

  useEffect(() => {
    if (!subscribe || !cacheKey) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    const cachedOrders = ordersCache.get(cacheKey);
    const listener = (nextOrders: Order[]) => {
      setOrders(nextOrders);
      setIsLoading(false);
    };

    if (cachedOrders) {
      setOrders(cachedOrders);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const listeners = orderListeners.get(cacheKey) ?? new Set<(orders: Order[]) => void>();
    listeners.add(listener);
    orderListeners.set(cacheKey, listeners);

    ensureOrdersSubscription(cacheKey, subscribe);

    return () => {
      const activeListeners = orderListeners.get(cacheKey);

      activeListeners?.delete(listener);

      if (!activeListeners?.size) {
        orderListeners.delete(cacheKey);
        scheduleSubscriptionCleanup(cacheKey);
      }
    };
  }, [cacheKey, subscribe]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled'),
    [orders],
  );
  const orderHistory = useMemo(
    () => orders.filter((order) => order.status === 'delivered' || order.status === 'cancelled'),
    [orders],
  );

  return {
    activeOrders,
    isLoading,
    orderHistory,
    orders,
  };
}

export function useCustomerOrders(customerId: string | null) {
  const subscribe = useMemo(
    () => (customerId ? (onOrders: (orders: Order[]) => void) => subscribeToCustomerOrders(customerId, onOrders) : null),
    [customerId],
  );

  return useSubscribedOrders(customerId ? `customer:${customerId}` : null, subscribe);
}

export function useFranchiseeOrders(scope: FranchiseeOrderScope | string | null) {
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
        ? (onOrders: (orders: Order[]) => void) => subscribeToFranchiseeOrders(scope, onOrders)
        : null,
    [scope],
  );

  return useSubscribedOrders(cacheKey, subscribe);
}

export function useProductionOrders() {
  const subscribe = useMemo(
    () => (onOrders: (orders: Order[]) => void) => subscribeToProductionOrders(onOrders),
    [],
  );

  return useSubscribedOrders('production', subscribe);
}
