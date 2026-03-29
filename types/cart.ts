import type { DeliveryMethod, PaymentMethod } from '@/types/order';
import type { ProductAvailability } from '@/types/product';

export type CheckoutMode = 'direct' | 'cart';
export type CheckoutPaymentMethod = PaymentMethod;

export type CartItem = {
  addedAt: string;
  availability: ProductAvailability;
  colorId?: string | null;
  colorLabel?: string | null;
  id: string;
  imageUrl?: string;
  preferredReadyDate?: string | null;
  price: number;
  productCollection?: string | null;
  productId: string;
  productName: string;
  quantity: number;
  size: string;
};

export type CheckoutDraft = {
  colorId?: string | null;
  colorLabel?: string | null;
  deliveryAddress: string;
  deliveryMethod: DeliveryMethod;
  deliveryNote: string;
  mode: CheckoutMode;
  paymentMethod: CheckoutPaymentMethod | null;
  preferredReadyDate?: string | null;
  productId: string | null;
  selectedCartItemIds: string[];
  size: string | null;
};

export type CheckoutReceipt = {
  deliveryMethod: DeliveryMethod;
  itemCount: number;
  items: Array<{
    colorLabel?: string | null;
    productName: string;
    size?: string | null;
  }>;
  orderIds: string[];
  paymentMethod: CheckoutPaymentMethod;
  total: number;
};
