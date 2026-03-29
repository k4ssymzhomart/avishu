import { demoUsersByRole } from '@/lib/constants/demo';
import { formatDateLabel, formatDeliveryMethod, formatRelativeTime } from '@/lib/utils/format';
import type { OrderChatThread } from '@/types/chat';
import type { Order, OrderStatus } from '@/types/order';

export const franchiseePlanTarget = 420000;

export const franchiseeFlowStages = [
  { label: 'PLACED', status: 'placed' },
  { label: 'ACCEPTED', status: 'accepted' },
  { label: 'IN PRODUCTION', status: 'in_production' },
  { label: 'READY', status: 'ready' },
  { label: 'OUT FOR DELIVERY', status: 'out_for_delivery' },
  { label: 'DELIVERED', status: 'delivered' },
] as const satisfies ReadonlyArray<{ label: string; status: OrderStatus }>;

export const franchiseeOrderLanes = [
  {
    description: 'Fresh customer intake waiting for boutique confirmation.',
    emptyDescription: 'The next customer order will land here instantly through the live subscription.',
    emptyTitle: 'No new orders',
    key: 'new',
    label: 'NEW',
    statuses: ['placed'],
  },
  {
    description: 'Boutique-approved work already queued for atelier intake.',
    emptyDescription: 'Accepted pieces stay here while production sees them instantly in the workshop queue.',
    emptyTitle: 'Nothing accepted',
    key: 'accepted',
    label: 'ACCEPTED',
    statuses: ['accepted'],
  },
  {
    description: 'Orders already with production, still visible for operational tracking.',
    emptyDescription: 'The workshop updates this lane automatically as pieces move through the floor.',
    emptyTitle: 'Production lane is clear',
    key: 'in_production',
    label: 'IN PRODUCTION',
    statuses: ['in_production'],
  },
  {
    description: 'Completed pieces back at boutique control, ready for pickup or courier release.',
    emptyDescription: 'When the atelier marks a piece ready, it appears here without a reload.',
    emptyTitle: 'No ready handoffs',
    key: 'ready',
    label: 'READY',
    statuses: ['ready'],
  },
  {
    description: 'Delivery has started and the franchisee can still close the loop cleanly.',
    emptyDescription: 'Orders move here once the boutique sends them to pickup release or courier handoff.',
    emptyTitle: 'No active deliveries',
    key: 'delivery',
    label: 'DELIVERY',
    statuses: ['out_for_delivery'],
  },
  {
    description: 'Completed orders remain visible as a calm operational archive.',
    emptyDescription: 'Delivered orders will stay here as the boutique completion history.',
    emptyTitle: 'No completed orders yet',
    key: 'completed',
    label: 'COMPLETED',
    statuses: ['delivered'],
  },
] as const satisfies ReadonlyArray<{
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  key: string;
  label: string;
  statuses: OrderStatus[];
}>;

export type FranchiseeLaneKey = (typeof franchiseeOrderLanes)[number]['key'];

const knownClientPhones: Record<string, string | null> = {
  [demoUsersByRole.customer.id]: demoUsersByRole.customer.phoneNumber ?? null,
  'customer-east': '+7 705 530 10 07',
  'customer-north': '+7 705 530 10 04',
  'customer-south': '+7 705 530 10 06',
  'customer-west': '+7 705 530 10 05',
};

export function calculateFranchiseeDashboardMetrics(orders: Order[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayRevenue = orders.reduce((sum, order) => {
    const isRevenueStage = ['ready', 'out_for_delivery', 'delivered'].includes(order.status);
    const isToday = Date.parse(order.updatedAt) >= startOfToday.getTime();

    return isRevenueStage && isToday ? sum + order.productPrice : sum;
  }, 0);

  const planValue = orders.reduce(
    (sum, order) => (order.status === 'placed' || order.status === 'cancelled' ? sum : sum + order.productPrice),
    0,
  );

  return {
    acceptedCount: orders.filter((order) => order.status === 'accepted').length,
    deliveredCount: orders.filter((order) => order.status === 'delivered').length,
    inProductionCount: orders.filter((order) => order.status === 'in_production').length,
    liveCount: orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length,
    newOrdersCount: orders.filter((order) => order.status === 'placed').length,
    outForDeliveryCount: orders.filter((order) => order.status === 'out_for_delivery').length,
    planProgress: Math.max(0, Math.min(100, Math.round((planValue / franchiseePlanTarget) * 100))),
    readyCount: orders.filter((order) => order.status === 'ready').length,
    todayRevenue,
  };
}

export function getFranchiseeFlowCounts(orders: Order[]) {
  return franchiseeFlowStages.reduce(
    (counts, stage) => ({
      ...counts,
      [stage.status]: orders.filter((order) => order.status === stage.status).length,
    }),
    {
      accepted: 0,
      cancelled: 0,
      delivered: 0,
      in_production: 0,
      out_for_delivery: 0,
      placed: 0,
      ready: 0,
    } satisfies Record<OrderStatus, number>,
  );
}

export function getFranchiseeLaneOrders(orders: Order[], laneKey: FranchiseeLaneKey) {
  const lane = franchiseeOrderLanes.find((entry) => entry.key === laneKey);

  if (!lane) {
    return [];
  }

  return orders.filter((order) => lane.statuses.some((status) => status === order.status));
}

export function getFranchiseeOrderAction(status: OrderStatus) {
  if (status === 'placed') {
    return {
      label: 'Accept & queue',
      nextStatus: 'accepted' as const,
    };
  }

  if (status === 'ready') {
    return {
      label: 'Send to delivery',
      nextStatus: 'out_for_delivery' as const,
    };
  }

  if (status === 'out_for_delivery') {
    return {
      label: 'Mark delivered',
      nextStatus: 'delivered' as const,
    };
  }

  return null;
}

export function getFranchiseeOrderTypeLabel(order: Order) {
  return order.type === 'preorder' ? 'Preorder' : 'In stock';
}

export function getFranchiseeStageMeta(order: Order) {
  if (order.status === 'placed') {
    return `Placed ${formatRelativeTime(order.timeline.placedAt)}`;
  }

  if (order.status === 'accepted') {
    return `Queued for production ${formatRelativeTime(order.timeline.acceptedAt ?? order.updatedAt)}`;
  }

  if (order.status === 'in_production') {
    return `In production ${formatRelativeTime(order.timeline.inProductionAt ?? order.updatedAt)}`;
  }

  if (order.status === 'ready') {
    return `Ready ${formatRelativeTime(order.timeline.readyAt ?? order.updatedAt)}`;
  }

  if (order.status === 'out_for_delivery') {
    return `Delivery started ${formatRelativeTime(order.timeline.outForDeliveryAt ?? order.updatedAt)}`;
  }

  return `Delivered ${formatRelativeTime(order.timeline.deliveredAt ?? order.updatedAt)}`;
}

export function getFranchiseeTimingLabel(order: Order) {
  if (order.preferredReadyDate) {
    return {
      label: order.type === 'preorder' ? 'Preferred ready' : 'Target date',
      value: formatDateLabel(order.preferredReadyDate, { withYear: true }),
    };
  }

  return {
    label: 'Created',
    value: formatRelativeTime(order.createdAt),
  };
}

export function getFranchiseeDeliverySummary(order: Order) {
  return formatDeliveryMethod(order.delivery.method);
}

export function getFranchiseeDestinationSnippet(order: Order) {
  if (order.delivery.address?.trim().length) {
    return order.delivery.address.trim();
  }

  if (order.delivery.method === 'boutique_pickup') {
    return 'Pickup at the boutique counter';
  }

  return 'Delivery details will be confirmed in chat';
}

export function getFranchiseeUnreadSupportCount(threads: OrderChatThread[]) {
  return threads.reduce((sum, thread) => sum + thread.unreadCountForSupport, 0);
}

export function getKnownClientPhone(customerId: string) {
  return knownClientPhones[customerId] ?? null;
}

export function applyFranchiseeOptimisticStatus(order: Order, nextStatus: OrderStatus) {
  const timestamp = new Date().toISOString();
  const nextTimeline = { ...order.timeline };

  if (nextStatus === 'accepted') {
    nextTimeline.acceptedAt = nextTimeline.acceptedAt ?? timestamp;
  }

  if (nextStatus === 'in_production') {
    nextTimeline.acceptedAt = nextTimeline.acceptedAt ?? timestamp;
    nextTimeline.inProductionAt = nextTimeline.inProductionAt ?? timestamp;
  }

  if (nextStatus === 'ready') {
    nextTimeline.acceptedAt = nextTimeline.acceptedAt ?? timestamp;
    nextTimeline.inProductionAt = nextTimeline.inProductionAt ?? timestamp;
    nextTimeline.readyAt = nextTimeline.readyAt ?? timestamp;
  }

  if (nextStatus === 'out_for_delivery') {
    nextTimeline.acceptedAt = nextTimeline.acceptedAt ?? timestamp;
    nextTimeline.inProductionAt = nextTimeline.inProductionAt ?? timestamp;
    nextTimeline.readyAt = nextTimeline.readyAt ?? timestamp;
    nextTimeline.outForDeliveryAt = nextTimeline.outForDeliveryAt ?? timestamp;
  }

  if (nextStatus === 'delivered') {
    nextTimeline.acceptedAt = nextTimeline.acceptedAt ?? timestamp;
    nextTimeline.inProductionAt = nextTimeline.inProductionAt ?? timestamp;
    nextTimeline.readyAt = nextTimeline.readyAt ?? timestamp;
    nextTimeline.outForDeliveryAt = nextTimeline.outForDeliveryAt ?? timestamp;
    nextTimeline.deliveredAt = nextTimeline.deliveredAt ?? timestamp;
  }

  return {
    ...order,
    status: nextStatus,
    timeline: nextTimeline,
    updatedAt: timestamp,
  } satisfies Order;
}

export function getFranchiseeProcessSteps(order: Order) {
  return franchiseeFlowStages.map((stage) => {
    const timestamp =
      stage.status === 'placed'
        ? order.timeline.placedAt
        : stage.status === 'accepted'
          ? order.timeline.acceptedAt
          : stage.status === 'in_production'
            ? order.timeline.inProductionAt
            : stage.status === 'ready'
              ? order.timeline.readyAt
              : stage.status === 'out_for_delivery'
                ? order.timeline.outForDeliveryAt
                : order.timeline.deliveredAt;

    return {
      isComplete: Boolean(timestamp),
      isCurrent: order.status === stage.status,
      label: stage.label,
      timestamp,
    };
  });
}
