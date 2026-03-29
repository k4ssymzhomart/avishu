export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'in_production'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type OrderType = 'purchase' | 'preorder';
export type PaymentMethod = 'kaspi';

export type DeliveryMethod = 'boutique_pickup' | 'city_courier' | 'express_courier';

export type OrderTimeline = {
  acceptedAt?: string | null;
  cancelledAt?: string | null;
  deliveredAt?: string | null;
  inProductionAt?: string | null;
  outForDeliveryAt?: string | null;
  placedAt: string;
  readyAt?: string | null;
};

export type DeliveryDetails = {
  address?: string | null;
  mapPreviewLabel?: string | null;
  method: DeliveryMethod;
  note?: string | null;
};

export type OrderLoyaltyReward = {
  awardedAt: string | null;
  awardedPoints: number;
  basePoints: number;
  bonusPoints: number;
  firstOrderBonusApplied: boolean;
  preorderBonusApplied: boolean;
  statusAtAward: OrderStatus;
};

export type Order = {
  branchId?: string | null;
  branchName?: string | null;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerPhoneNumber?: string | null;
  delivery: DeliveryDetails;
  franchiseId: string;
  id: string;
  paymentMethod?: PaymentMethod | null;
  preferredReadyDate?: string | null;
  productCollection?: string | null;
  productId: string;
  productImageUrl?: string | null;
  loyalty?: OrderLoyaltyReward | null;
  productName: string;
  productPrice: number;
  productionUnitId: string | null;
  productionNote: string | null;
  productionNoteUpdatedAt: string | null;
  productionUnitName?: string | null;
  selectedColorId?: string | null;
  selectedColorLabel?: string | null;
  selectedSize?: string | null;
  status: OrderStatus;
  timeline: OrderTimeline;
  type: OrderType;
  updatedAt: string;
};

export type FranchiseeOrderScope = {
  branchId?: string | null;
  franchiseId: string;
};

export type CreateOrderInput = Pick<
  Order,
  | 'customerId'
  | 'customerName'
  | 'customerPhoneNumber'
  | 'delivery'
  | 'branchId'
  | 'branchName'
  | 'franchiseId'
  | 'paymentMethod'
  | 'preferredReadyDate'
  | 'productCollection'
  | 'productId'
  | 'productImageUrl'
  | 'productName'
  | 'productPrice'
  | 'selectedColorId'
  | 'selectedColorLabel'
  | 'selectedSize'
  | 'type'
> & {
  productionUnitId?: string | null;
  productionUnitName?: string | null;
};
