import type { OrderStatus } from '@/types/order';

export type ChatSenderRole = 'customer' | 'support' | 'franchisee' | 'production';

export type OrderChatThread = {
  branchId?: string | null;
  branchName?: string | null;
  customerId: string;
  customerName: string;
  customerPhoneNumber?: string | null;
  franchiseId?: string | null;
  id: string;
  lastMessageAt: string;
  lastMessageText: string;
  orderId: string;
  orderStatus: OrderStatus;
  productName: string;
  unreadCountForCustomer: number;
  unreadCountForSupport: number;
  updatedAt: string;
};

export type OrderChatMessage = {
  createdAt: string;
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatSenderRole;
  text: string;
};

export type CreateOrderChatMessageInput = Pick<
  OrderChatMessage,
  'orderId' | 'senderId' | 'senderName' | 'senderRole' | 'text'
>;
