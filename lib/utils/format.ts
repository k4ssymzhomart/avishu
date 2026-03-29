import type { ProductAvailability } from '@/types/product';
import type { DeliveryMethod, OrderStatus, OrderType } from '@/types/order';
import type { UserRole } from '@/types/user';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ru-KZ', {
    currency: 'KZT',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export function formatOrderStatus(status: OrderStatus) {
  if (status === 'placed') {
    return 'Placed';
  }

  if (status === 'accepted') {
    return 'Accepted';
  }

  if (status === 'in_production') {
    return 'In production';
  }

  if (status === 'ready') {
    return 'Ready';
  }

  if (status === 'out_for_delivery') {
    return 'Out for delivery';
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  return 'Delivered';
}

export function formatCustomerStage(status: OrderStatus) {
  if (status === 'placed') {
    return 'Placed';
  }

  if (status === 'accepted') {
    return 'Accepted';
  }

  if (status === 'in_production') {
    return 'In production';
  }

  if (status === 'ready') {
    return 'Ready';
  }

  if (status === 'out_for_delivery') {
    return 'Delivery';
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  return 'Delivered';
}

export function formatOrderType(type: OrderType) {
  return type === 'preorder' ? 'Preorder' : 'Purchase';
}

export function formatAvailability(availability: ProductAvailability) {
  return availability === 'preorder' ? 'Preorder' : 'In stock';
}

export function formatDeliveryMethod(method: DeliveryMethod) {
  if (method === 'boutique_pickup') {
    return 'Boutique pickup';
  }

  if (method === 'express_courier') {
    return 'Express courier';
  }

  return 'City courier';
}

export function formatRole(role: UserRole) {
  return role.toUpperCase();
}

export function formatDateLabel(value?: string | null, options?: { withYear?: boolean }) {
  if (!value) {
    return 'No date selected';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    ...(options?.withYear ? { year: 'numeric' } : null),
  }).format(date);
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes <= 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDateLabel(value, { withYear: true });
}

export function formatChatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}
