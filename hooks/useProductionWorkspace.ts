import { useEffect, useMemo, useRef, useState } from 'react';

import { demoUsersByRole } from '@/lib/constants/demo';
import {
  completeProductionTask,
  getCachedProductionOrders,
  getProductionBoardCacheKey,
  saveProductionTaskNote,
  setCachedProductionOrders,
  startProductionTask,
  subscribeToProductionOrders,
  type ProductionUserContext,
} from '@/services/production';
import { buildUserProfile, ensureUserProfile, subscribeToUserProfile } from '@/services/users';
import { useSessionStore } from '@/store/session';
import {
  getProductionBranchLabel,
  getProductionImageFallbackLabel,
  getProductionNotificationContext,
  getProductionPriority,
  getProductionStageMeta,
  getProductionTiming,
  sortProductionTasks,
} from '@/lib/utils/production';
import type { Order } from '@/types/order';
import type { User } from '@/types/user';

const productionWorkspaceCache = new Map<string, User>();

export type ProductionBoardKey = 'queue' | 'active' | 'ready';

export type ProductionTaskNotification = {
  channelKey: string;
  eventKeys: readonly string[];
};

export type ProductionTask = {
  boardKey: ProductionBoardKey;
  branchLabel: string;
  dueLabel: string;
  dueValue: string;
  id: string;
  imageFallbackLabel: string;
  notification: ProductionTaskNotification;
  order: Order;
  priorityLabel: string;
  priorityTone: 'critical' | 'muted' | 'neutral';
  productImageUrl: string | null;
  stageMeta: string;
};

function getBoardKey(status: Order['status']): ProductionBoardKey {
  if (status === 'ready') {
    return 'ready';
  }

  if (status === 'in_production') {
    return 'active';
  }

  return 'queue';
}

function getFallbackProductionProfile(input: {
  currentUserId: string | null;
  fallbackName: string | null;
  fallbackPhoneNumber: string | null;
  role: User['role'] | null;
}) {
  if (input.role !== 'production') {
    return null;
  }

  const demoProfile = demoUsersByRole.production;

  return buildUserProfile({
    id: input.currentUserId ?? 'avishu-production-floor',
    linkedFranchiseIds: demoProfile.linkedFranchiseIds ?? null,
    name: input.fallbackName ?? demoProfile.name,
    phoneNumber: input.fallbackPhoneNumber ?? demoProfile.phoneNumber ?? null,
    productionUnitId: demoProfile.productionUnitId ?? demoProfile.id,
    productionUnitName: demoProfile.productionUnitName ?? demoProfile.name,
    role: 'production',
  });
}

function toProductionContext(profile: User | null): ProductionUserContext | null {
  if (!profile || profile.role !== 'production') {
    return null;
  }

  return {
    ...profile,
    linkedFranchiseIds: profile.linkedFranchiseIds?.filter(Boolean) ?? [],
    productionUnitId: profile.productionUnitId ?? profile.id,
    productionUnitName: profile.productionUnitName ?? profile.name,
  };
}

function buildTask(order: Order): ProductionTask {
  const timing = getProductionTiming(order);
  const priority = getProductionPriority(order);

  return {
    boardKey: getBoardKey(order.status),
    branchLabel: getProductionBranchLabel(order),
    dueLabel: timing.label,
    dueValue: timing.value,
    id: order.id,
    imageFallbackLabel: getProductionImageFallbackLabel(order),
    notification: getProductionNotificationContext(order),
    order,
    priorityLabel: priority.label,
    priorityTone: priority.tone,
    productImageUrl: order.productImageUrl ?? null,
    stageMeta: getProductionStageMeta(order),
  };
}

function areProfilesEquivalent(left: User | null, right: User | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.id === right.id &&
    left.role === right.role &&
    left.name === right.name &&
    (left.phoneNumber ?? null) === (right.phoneNumber ?? null) &&
    (left.productionUnitId ?? null) === (right.productionUnitId ?? null) &&
    (left.productionUnitName ?? null) === (right.productionUnitName ?? null) &&
    (left.linkedFranchiseIds ?? []).join('|') === (right.linkedFranchiseIds ?? []).join('|')
  );
}

function getOrderSignature(order: Order) {
  return [
    order.id,
    order.status,
    order.updatedAt,
    order.timeline.inProductionAt ?? '',
    order.timeline.readyAt ?? '',
    order.productionNote ?? '',
    order.productionNoteUpdatedAt ?? '',
    order.productImageUrl ?? '',
  ].join('::');
}

function areOrdersEquivalent(left: Order[], right: Order[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (getOrderSignature(left[index]) !== getOrderSignature(right[index])) {
      return false;
    }
  }

  return true;
}

export function useProductionWorkspace() {
  const currentRole = useSessionStore((state) => state.currentRole);
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const currentUserName = useSessionStore((state) => state.currentUserName);
  const currentUserPhoneNumber = useSessionStore((state) => state.currentUserPhoneNumber);

  const fallbackProfile = useMemo(
    () =>
      getFallbackProductionProfile({
        currentUserId,
        fallbackName: currentUserName,
        fallbackPhoneNumber: currentUserPhoneNumber,
        role: currentRole,
      }),
    [currentRole, currentUserId, currentUserName, currentUserPhoneNumber],
  );

  const [profile, setProfile] = useState<User | null>(() =>
    fallbackProfile ? productionWorkspaceCache.get(fallbackProfile.id) ?? fallbackProfile : null,
  );
  const [isContextLoading, setIsContextLoading] = useState(
    () => (fallbackProfile ? !productionWorkspaceCache.has(fallbackProfile.id) : false),
  );
  const productionContext = useMemo(() => toProductionContext(profile), [profile]);
  const cacheKey = useMemo(
    () => (productionContext ? getProductionBoardCacheKey(productionContext) : null),
    [productionContext],
  );
  const [orders, setOrders] = useState<Order[]>(() => getCachedProductionOrders(cacheKey) ?? []);
  const [isOrdersLoading, setIsOrdersLoading] = useState(() => Boolean(cacheKey) && !getCachedProductionOrders(cacheKey));
  const [statusPendingIds, setStatusPendingIds] = useState<string[]>([]);
  const [notePendingIds, setNotePendingIds] = useState<string[]>([]);
  const ordersRef = useRef<Order[]>(orders);
  const cacheKeyRef = useRef<string | null>(cacheKey);

  useEffect(() => {
    cacheKeyRef.current = cacheKey;
  }, [cacheKey]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    if (!fallbackProfile) {
      setProfile(null);
      setIsContextLoading(false);
      return;
    }

    const cachedProfile = productionWorkspaceCache.get(fallbackProfile.id);

    if (cachedProfile) {
      setProfile((current) => (areProfilesEquivalent(current, cachedProfile) ? current : cachedProfile));
      setIsContextLoading(false);
    } else {
      setProfile((current) => (areProfilesEquivalent(current, fallbackProfile) ? current : fallbackProfile));
      setIsContextLoading(true);
    }

    void ensureUserProfile({
      id: fallbackProfile.id,
      linkedFranchiseIds: fallbackProfile.linkedFranchiseIds ?? demoUsersByRole.production.linkedFranchiseIds ?? null,
      name: fallbackProfile.name,
      phoneNumber: fallbackProfile.phoneNumber ?? null,
      productionUnitId: fallbackProfile.productionUnitId ?? demoUsersByRole.production.productionUnitId ?? fallbackProfile.id,
      productionUnitName:
        fallbackProfile.productionUnitName ?? demoUsersByRole.production.productionUnitName ?? fallbackProfile.name,
      role: 'production',
    });

    const unsubscribe = subscribeToUserProfile(fallbackProfile.id, (nextProfile) => {
      const resolvedProfile = nextProfile ?? fallbackProfile;

      productionWorkspaceCache.set(fallbackProfile.id, resolvedProfile);
      setProfile((current) => (areProfilesEquivalent(current, resolvedProfile) ? current : resolvedProfile));
      setIsContextLoading(false);
    });

    return unsubscribe;
  }, [currentUserPhoneNumber, currentUserName, fallbackProfile]);

  useEffect(() => {
    if (!productionContext || !cacheKey) {
      setOrders([]);
      setIsOrdersLoading(false);
      return;
    }

    const cachedOrders = getCachedProductionOrders(cacheKey);

    if (cachedOrders) {
      setOrders((current) => (areOrdersEquivalent(current, cachedOrders) ? current : cachedOrders));
      setIsOrdersLoading(false);
    } else {
      setOrders([]);
      setIsOrdersLoading(true);
    }

    const unsubscribe = subscribeToProductionOrders(productionContext, (nextOrders) => {
      setCachedProductionOrders(cacheKey, nextOrders);
      setOrders((current) => (areOrdersEquivalent(current, nextOrders) ? current : nextOrders));
      setIsOrdersLoading(false);
    });

    return unsubscribe;
  }, [cacheKey, productionContext]);

  const commitOrders = (updater: Order[] | ((current: Order[]) => Order[])) => {
    setOrders((current) => {
      const nextOrders = typeof updater === 'function' ? updater(current) : updater;

      ordersRef.current = nextOrders;
      setCachedProductionOrders(cacheKeyRef.current, nextOrders);

      return nextOrders;
    });
  };

  const startTask = async (orderId: string) => {
    const now = new Date().toISOString();
    const previousOrder = ordersRef.current.find((order) => order.id === orderId) ?? null;

    commitOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'in_production',
              timeline: {
                ...order.timeline,
                inProductionAt: order.timeline.inProductionAt ?? now,
              },
              updatedAt: now,
            }
          : order,
      ),
    );
    setStatusPendingIds((current) => (current.includes(orderId) ? current : [...current, orderId]));

    try {
      await startProductionTask(orderId);
    } catch (error) {
      if (previousOrder) {
        commitOrders((current) => current.map((order) => (order.id === orderId ? previousOrder : order)));
      }
      throw error;
    } finally {
      setStatusPendingIds((current) => current.filter((entry) => entry !== orderId));
    }
  };

  const completeTask = async (orderId: string) => {
    const now = new Date().toISOString();
    const previousOrder = ordersRef.current.find((order) => order.id === orderId) ?? null;

    commitOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'ready',
              timeline: {
                ...order.timeline,
                readyAt: order.timeline.readyAt ?? now,
              },
              updatedAt: now,
            }
          : order,
      ),
    );
    setStatusPendingIds((current) => (current.includes(orderId) ? current : [...current, orderId]));

    try {
      await completeProductionTask(orderId);
    } catch (error) {
      if (previousOrder) {
        commitOrders((current) => current.map((order) => (order.id === orderId ? previousOrder : order)));
      }
      throw error;
    } finally {
      setStatusPendingIds((current) => current.filter((entry) => entry !== orderId));
    }
  };

  const saveTaskNote = async (orderId: string, note: string) => {
    const normalizedNote = note.trim();
    const now = new Date().toISOString();
    const previousOrder = ordersRef.current.find((order) => order.id === orderId) ?? null;

    commitOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              productionNote: normalizedNote || null,
              productionNoteUpdatedAt: normalizedNote ? now : null,
              updatedAt: now,
            }
          : order,
      ),
    );
    setNotePendingIds((current) => (current.includes(orderId) ? current : [...current, orderId]));

    try {
      await saveProductionTaskNote(orderId, normalizedNote);
    } catch (error) {
      if (previousOrder) {
        commitOrders((current) => current.map((order) => (order.id === orderId ? previousOrder : order)));
      }
      throw error;
    } finally {
      setNotePendingIds((current) => current.filter((entry) => entry !== orderId));
    }
  };

  const tasksById = useMemo(() => {
    return new Map(orders.map((order) => [order.id, buildTask(order)]));
  }, [orders]);

  const acceptedOrders = useMemo(
    () => sortProductionTasks(orders.filter((order) => order.status === 'accepted')),
    [orders],
  );
  const activeOrders = useMemo(
    () => sortProductionTasks(orders.filter((order) => order.status === 'in_production')),
    [orders],
  );
  const readyOrders = useMemo(
    () => sortProductionTasks(orders.filter((order) => order.status === 'ready'), 'ready'),
    [orders],
  );

  const acceptedTasks = useMemo(
    () => acceptedOrders.map((order) => tasksById.get(order.id)).filter((task): task is ProductionTask => Boolean(task)),
    [acceptedOrders, tasksById],
  );
  const activeTasks = useMemo(
    () => activeOrders.map((order) => tasksById.get(order.id)).filter((task): task is ProductionTask => Boolean(task)),
    [activeOrders, tasksById],
  );
  const readyTasks = useMemo(
    () => readyOrders.map((order) => tasksById.get(order.id)).filter((task): task is ProductionTask => Boolean(task)),
    [readyOrders, tasksById],
  );

  const allTasks = useMemo(() => [...acceptedTasks, ...activeTasks, ...readyTasks], [acceptedTasks, activeTasks, readyTasks]);
  const nextAcceptedTask = acceptedTasks[0] ?? null;
  const nextActiveTask = activeTasks[0] ?? null;
  const latestReadyTask = readyTasks[0] ?? null;

  return {
    acceptedTasks,
    activeTasks,
    allTasks,
    completeTask,
    hasTasks: orders.length > 0,
    isContextLoading,
    isLoading: isOrdersLoading && orders.length === 0,
    isNoteSaving: (orderId: string) => notePendingIds.includes(orderId),
    isStatusUpdating: (orderId: string) => statusPendingIds.includes(orderId),
    latestReadyTask,
    nextAcceptedTask,
    nextActiveTask,
    productionUser: productionContext,
    readyTasks,
    saveTaskNote,
    startTask,
  };
}
