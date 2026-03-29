import { create } from 'zustand';

import { demoChatMessages, demoChatThreads, demoOrders, demoProducts } from '@/lib/constants/demo';
import type { CreateOrderChatMessageInput, OrderChatMessage, OrderChatThread } from '@/types/chat';
import type { CreateOrderInput, Order, OrderStatus } from '@/types/order';
import type { Product } from '@/types/product';

type DemoRealtimeState = {
  chatMessages: OrderChatMessage[];
  chatThreads: OrderChatThread[];
  clearOrders: () => void;
  createOrder: (input: CreateOrderInput) => Order;
  markCustomerThreadRead: (orderId: string) => void;
  markSupportThreadRead: (orderId: string) => void;
  orders: Order[];
  products: Product[];
  resetDemo: () => void;
  seedProducts: () => void;
  sendMessage: (input: CreateOrderChatMessageInput) => OrderChatMessage;
  updateProductionNote: (orderId: string, note: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
};

function generateId(prefix: string) {
  return `${prefix}-${Math.floor(Date.now() / 1000).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function sortThreads(threads: OrderChatThread[]) {
  return [...threads].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function statusMessage(status: OrderStatus) {
  if (status === 'accepted') {
    return 'Boutique confirmed your order and queued it for production.';
  }

  if (status === 'in_production') {
    return 'Your order has entered production.';
  }

  if (status === 'ready') {
    return 'Your piece is ready for delivery preparation.';
  }

  if (status === 'out_for_delivery') {
    return 'Your order is out for delivery.';
  }

  if (status === 'delivered') {
    return 'Your order has been delivered.';
  }

  return 'Your order is placed. Boutique confirmation is in progress.';
}

function nextTimeline(status: OrderStatus, previousTimeline: Order['timeline'], timestamp: string) {
  if (status === 'accepted') {
    return {
      ...previousTimeline,
      acceptedAt: previousTimeline.acceptedAt ?? timestamp,
    };
  }

  if (status === 'in_production') {
    return {
      ...previousTimeline,
      acceptedAt: previousTimeline.acceptedAt ?? timestamp,
      inProductionAt: previousTimeline.inProductionAt ?? timestamp,
    };
  }

  if (status === 'ready') {
    return {
      ...previousTimeline,
      acceptedAt: previousTimeline.acceptedAt ?? timestamp,
      inProductionAt: previousTimeline.inProductionAt ?? timestamp,
      readyAt: previousTimeline.readyAt ?? timestamp,
    };
  }

  if (status === 'out_for_delivery') {
    return {
      ...previousTimeline,
      acceptedAt: previousTimeline.acceptedAt ?? timestamp,
      inProductionAt: previousTimeline.inProductionAt ?? timestamp,
      outForDeliveryAt: previousTimeline.outForDeliveryAt ?? timestamp,
      readyAt: previousTimeline.readyAt ?? timestamp,
    };
  }

  if (status === 'delivered') {
    return {
      ...previousTimeline,
      acceptedAt: previousTimeline.acceptedAt ?? timestamp,
      cancelledAt: previousTimeline.cancelledAt ?? null,
      deliveredAt: previousTimeline.deliveredAt ?? timestamp,
      inProductionAt: previousTimeline.inProductionAt ?? timestamp,
      outForDeliveryAt: previousTimeline.outForDeliveryAt ?? timestamp,
      readyAt: previousTimeline.readyAt ?? timestamp,
    };
  }

  if (status === 'cancelled') {
    return {
      ...previousTimeline,
      cancelledAt: previousTimeline.cancelledAt ?? timestamp,
    };
  }

  return previousTimeline;
}

export const useDemoRealtimeStore = create<DemoRealtimeState>((set, get) => ({
  chatMessages: demoChatMessages,
  chatThreads: sortThreads(demoChatThreads),
  clearOrders: () => {
    set({ chatMessages: [], chatThreads: [], orders: [] });
  },
  createOrder: (input) => {
    const timestamp = new Date().toISOString();
    const order: Order = {
      branchId: input.branchId ?? input.franchiseId,
      branchName: input.branchName ?? 'AVISHU Boutique',
      createdAt: timestamp,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhoneNumber: input.customerPhoneNumber ?? null,
      delivery: input.delivery,
      franchiseId: input.franchiseId,
      id: generateId('AV'),
      paymentMethod: input.paymentMethod ?? null,
      preferredReadyDate: input.preferredReadyDate ?? null,
      productCollection: input.productCollection ?? null,
      productId: input.productId,
      productImageUrl: input.productImageUrl ?? null,
      productName: input.productName,
      productPrice: input.productPrice,
      productionNote: null,
      productionNoteUpdatedAt: null,
      selectedColorId: input.selectedColorId ?? null,
      selectedColorLabel: input.selectedColorLabel ?? null,
      selectedSize: input.selectedSize ?? null,
      status: 'placed',
      timeline: {
        acceptedAt: null,
        cancelledAt: null,
        deliveredAt: null,
        inProductionAt: null,
        outForDeliveryAt: null,
        placedAt: timestamp,
        readyAt: null,
      },
      type: input.type,
      updatedAt: timestamp,
    };

    const thread: OrderChatThread = {
      branchId: order.branchId ?? null,
      branchName: order.branchName ?? null,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhoneNumber: input.customerPhoneNumber ?? null,
      franchiseId: input.franchiseId,
      id: order.id,
      lastMessageAt: timestamp,
      lastMessageText: statusMessage('placed'),
      orderId: order.id,
      orderStatus: 'placed',
      productName: input.productName,
      unreadCountForCustomer: 1,
      unreadCountForSupport: 0,
      updatedAt: timestamp,
    };

    const message: OrderChatMessage = {
      createdAt: timestamp,
      id: generateId('msg'),
      orderId: order.id,
      senderId: 'avishu-support',
      senderName: 'AVISHU Care',
      senderRole: 'support',
      text: statusMessage('placed'),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, message],
      chatThreads: sortThreads([thread, ...state.chatThreads]),
      orders: [order, ...state.orders],
    }));

    return order;
  },
  markCustomerThreadRead: (orderId) => {
    set((state) => ({
      chatThreads: state.chatThreads.map((thread) =>
        thread.orderId === orderId ? { ...thread, unreadCountForCustomer: 0 } : thread,
      ),
    }));
  },
  markSupportThreadRead: (orderId) => {
    set((state) => ({
      chatThreads: state.chatThreads.map((thread) =>
        thread.orderId === orderId ? { ...thread, unreadCountForSupport: 0 } : thread,
      ),
    }));
  },
  orders: demoOrders,
  products: demoProducts,
  resetDemo: () => {
    set({
      chatMessages: demoChatMessages,
      chatThreads: sortThreads(demoChatThreads),
      orders: demoOrders,
      products: demoProducts,
    });
  },
  seedProducts: () => {
    set((state) => ({
      products: state.products.length ? state.products : demoProducts,
    }));
  },
  sendMessage: (input) => {
    const timestamp = new Date().toISOString();
    const message: OrderChatMessage = {
      createdAt: timestamp,
      id: generateId('msg'),
      orderId: input.orderId,
      senderId: input.senderId,
      senderName: input.senderName,
      senderRole: input.senderRole,
      text: input.text.trim(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, message],
      chatThreads: sortThreads(
        state.chatThreads.map((thread) =>
          thread.orderId === input.orderId
            ? {
                ...thread,
                lastMessageAt: timestamp,
                lastMessageText: message.text,
                unreadCountForCustomer: input.senderRole === 'customer' ? 0 : thread.unreadCountForCustomer + 1,
                unreadCountForSupport: input.senderRole === 'customer' ? thread.unreadCountForSupport + 1 : 0,
                updatedAt: timestamp,
              }
            : thread,
        ),
      ),
    }));

    return message;
  },
  updateProductionNote: (orderId, note) => {
    const timestamp = new Date().toISOString();

    set((state) => ({
      orders: state.orders.map((entry) =>
        entry.id === orderId
          ? {
              ...entry,
              productionNote: note || null,
              productionNoteUpdatedAt: note ? timestamp : null,
              updatedAt: timestamp,
            }
          : entry,
      ),
    }));
  },
  updateOrderStatus: (orderId, status) => {
    const timestamp = new Date().toISOString();
    const note = statusMessage(status);
    const order = get().orders.find((item) => item.id === orderId);

    set((state) => ({
      chatMessages:
        order && status !== 'placed'
          ? [
              ...state.chatMessages,
              {
                createdAt: timestamp,
                id: generateId('msg'),
                orderId,
                senderId: 'avishu-support',
                senderName: 'AVISHU Care',
                senderRole: 'support',
                text: note,
              },
            ]
          : state.chatMessages,
      chatThreads: sortThreads(
        state.chatThreads.map((thread) =>
          thread.orderId === orderId
            ? {
                ...thread,
                lastMessageAt: timestamp,
                lastMessageText: note,
                orderStatus: status,
                unreadCountForCustomer: thread.unreadCountForCustomer + 1,
                updatedAt: timestamp,
              }
            : thread,
        ),
      ),
      orders: state.orders.map((entry) =>
        entry.id === orderId
          ? {
              ...entry,
              status,
              timeline: nextTimeline(status, entry.timeline, timestamp),
              updatedAt: timestamp,
            }
          : entry,
      ),
    }));
  },
}));
