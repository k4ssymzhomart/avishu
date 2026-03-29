import { demoUsersByRole } from '@/lib/constants/demo';
import { formatDateLabel, formatDeliveryMethod, formatRelativeTime } from '@/lib/utils/format';
import type { Order, OrderStatus } from '@/types/order';

export type ProductionPriority = {
  label: 'Urgent' | 'Preorder' | 'Standard';
  tone: 'critical' | 'muted' | 'neutral';
};

export function formatProductionStage(status: OrderStatus) {
  if (status === 'accepted') {
    return 'Queued';
  }

  if (status === 'in_production') {
    return 'In production';
  }

  if (status === 'ready') {
    return 'Ready';
  }

  return 'Production';
}

export function getProductionTiming(order: Order) {
  if (order.preferredReadyDate) {
    return {
      label: order.type === 'preorder' ? 'Preorder target' : 'Due date',
      value: formatDateLabel(order.preferredReadyDate, { withYear: true }),
    };
  }

  if (order.status === 'accepted' && order.timeline.acceptedAt) {
    return {
      label: 'Queued',
      value: formatRelativeTime(order.timeline.acceptedAt),
    };
  }

  if (order.status === 'in_production' && order.timeline.inProductionAt) {
    return {
      label: 'Started',
      value: formatRelativeTime(order.timeline.inProductionAt),
    };
  }

  if (order.status === 'ready' && order.timeline.readyAt) {
    return {
      label: 'Completed',
      value: formatRelativeTime(order.timeline.readyAt),
    };
  }

  return {
    label: 'Received',
    value: formatRelativeTime(order.createdAt),
  };
}

export function getProductionStageMeta(order: Order) {
  if (order.status === 'ready' && order.timeline.readyAt) {
    return `Ready ${formatRelativeTime(order.timeline.readyAt)}`;
  }

  if (order.status === 'in_production' && order.timeline.inProductionAt) {
    return `Started ${formatRelativeTime(order.timeline.inProductionAt)}`;
  }

  if (order.status === 'accepted' && order.timeline.acceptedAt) {
    return `Queued ${formatRelativeTime(order.timeline.acceptedAt)}`;
  }

  return `Updated ${formatRelativeTime(order.updatedAt)}`;
}

export function getProductionTaskAction(status: OrderStatus) {
  if (status === 'accepted') {
    return {
      label: 'Start production',
      nextStatus: 'in_production' as const,
    };
  }

  if (status === 'in_production') {
    return {
      label: 'Complete task',
      nextStatus: 'ready' as const,
    };
  }

  return null;
}

export function getProductionNavKey(status?: OrderStatus | null) {
  if (status === 'ready') {
    return 'ready';
  }

  if (status === 'in_production') {
    return 'active';
  }

  return 'queue';
}

export function getProductionDeliveryLabel(order: Order) {
  return formatDeliveryMethod(order.delivery.method);
}

function normalizeLabel(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => {
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }

      return `${segment[0].toUpperCase()}${segment.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

export function getProductionBranchLabel(order: Order) {
  if (order.branchName?.trim().length) {
    return order.branchName.trim();
  }

  const boutiqueAddress = order.delivery.address?.trim();

  if (boutiqueAddress?.toLowerCase().includes('boutique')) {
    return boutiqueAddress.replace(/\s+boutique$/i, '');
  }

  if (order.franchiseId === demoUsersByRole.franchisee.id) {
    return demoUsersByRole.franchisee.name;
  }

  const normalizedId = order.franchiseId
    .replace(/^avishu[-_]?/i, '')
    .replace(/^franchise[-_]?/i, '')
    .trim();

  if (!normalizedId.length) {
    return 'AVISHU Boutique';
  }

  return normalizeLabel(normalizedId);
}

export function getProductionImageFallbackLabel(order: Order) {
  return order.productCollection?.trim() || 'AVISHU';
}

export function getProductionPriority(order: Order): ProductionPriority {
  const now = Date.now();
  const targetTimestamp = order.preferredReadyDate ? Date.parse(order.preferredReadyDate) : Number.NaN;
  const acceptedTimestamp = order.timeline.acceptedAt ? Date.parse(order.timeline.acceptedAt) : Date.parse(order.updatedAt);
  const hasUrgentTarget = Number.isFinite(targetTimestamp) && targetTimestamp - now <= 3 * 24 * 60 * 60 * 1000;
  const hasAgedQueue = order.status === 'accepted' && Number.isFinite(acceptedTimestamp) && now - acceptedTimestamp >= 12 * 60 * 60 * 1000;

  if (hasUrgentTarget || hasAgedQueue) {
    return {
      label: 'Urgent',
      tone: 'critical',
    };
  }

  if (order.type === 'preorder') {
    return {
      label: 'Preorder',
      tone: 'neutral',
    };
  }

  return {
    label: 'Standard',
    tone: 'muted',
  };
}

const productionNotificationEventsByStatus = {
  placed: ['production.new_task_assigned'],
  accepted: ['production.new_task_assigned', 'production.task_priority_change'],
  cancelled: ['production.task_priority_change'],
  in_production: ['production.task_priority_change', 'production.task_completed'],
  ready: ['production.ready_for_handoff'],
  out_for_delivery: ['production.ready_for_handoff'],
  delivered: ['production.ready_for_handoff'],
} as const;

export function getProductionNotificationContext(order: Order) {
  return {
    channelKey: `production:${order.id}`,
    eventKeys: productionNotificationEventsByStatus[order.status],
  };
}

export function sortProductionTasks(orders: Order[], mode: 'open' | 'ready' = 'open') {
  if (mode === 'ready') {
    return [...orders].sort(
      (left, right) =>
        Date.parse(right.timeline.readyAt ?? right.updatedAt) - Date.parse(left.timeline.readyAt ?? left.updatedAt),
    );
  }

  return [...orders].sort((left, right) => {
    const leftPriority = left.preferredReadyDate ? Date.parse(left.preferredReadyDate) : Date.parse(left.updatedAt);
    const rightPriority = right.preferredReadyDate ? Date.parse(right.preferredReadyDate) : Date.parse(right.updatedAt);

    return leftPriority - rightPriority;
  });
}
