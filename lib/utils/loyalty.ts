import type { LoyaltyBenefits, LoyaltySummary, LoyaltyTier } from '@/types/customerProfile';
import type { OrderStatus, OrderType } from '@/types/order';

type LoyaltyTierConfig = {
  benefits: LoyaltyBenefits;
  minimumPoints: number;
  tier: LoyaltyTier;
};

export const LOYALTY_KZT_PER_POINT = 1000;
export const LOYALTY_FIRST_COMPLETED_ORDER_BONUS = 5;
export const LOYALTY_PREORDER_BONUS = 3;

const loyaltyTierConfig: LoyaltyTierConfig[] = [
  {
    benefits: {
      discountPercent: 0,
      earlyAccess: false,
      label: 'ACCESS',
      perkLabels: ['POINTS ONLY', 'CLIENT ACCESS', 'ORDER HISTORY'],
      prioritySupport: false,
      rewardText: 'Points accumulate after each completed order.',
    },
    minimumPoints: 0,
    tier: 'BASIC',
  },
  {
    benefits: {
      discountPercent: 3,
      earlyAccess: true,
      label: 'COLLECTION',
      perkLabels: ['3% OFF', 'EARLY ACCESS', 'PRIORITY SUPPORT'],
      prioritySupport: true,
      rewardText: '3% off future orders with boutique priority.',
    },
    minimumPoints: 100,
    tier: 'SILVER',
  },
  {
    benefits: {
      discountPercent: 5,
      earlyAccess: true,
      label: 'ATELIER',
      perkLabels: ['5% OFF', 'EARLY ACCESS', 'PRIORITY SUPPORT'],
      prioritySupport: true,
      rewardText: '5% off future orders with atelier-level perks.',
    },
    minimumPoints: 300,
    tier: 'BLACK',
  },
];

export function isCompletedOrderStatus(status: OrderStatus) {
  return status === 'delivered';
}

export function calculateBaseLoyaltyPoints(amountKzt: number) {
  return Math.max(0, Math.floor(Math.max(amountKzt, 0) / LOYALTY_KZT_PER_POINT));
}

export function calculateOrderLoyaltyReward(input: {
  amountKzt: number;
  completedOrdersBefore: number;
  type: OrderType;
}) {
  const basePoints = calculateBaseLoyaltyPoints(input.amountKzt);
  const firstOrderBonusApplied = input.completedOrdersBefore <= 0;
  const preorderBonusApplied = input.type === 'preorder';
  const bonusPoints =
    (firstOrderBonusApplied ? LOYALTY_FIRST_COMPLETED_ORDER_BONUS : 0) +
    (preorderBonusApplied ? LOYALTY_PREORDER_BONUS : 0);

  return {
    awardedPoints: basePoints + bonusPoints,
    basePoints,
    bonusPoints,
    firstOrderBonusApplied,
    preorderBonusApplied,
  };
}

export function buildLoyaltySummary(input?: {
  lifetimeSpent?: number | null;
  points?: number | null;
  totalOrders?: number | null;
}) {
  const points = Math.max(0, Math.round(input?.points ?? 0));
  const lifetimeSpent = Math.max(0, Math.round(input?.lifetimeSpent ?? 0));
  const totalOrders = Math.max(0, Math.round(input?.totalOrders ?? 0));
  const currentTier =
    [...loyaltyTierConfig].reverse().find((entry) => points >= entry.minimumPoints) ?? loyaltyTierConfig[0];
  const nextTier = loyaltyTierConfig.find((entry) => entry.minimumPoints > points) ?? null;
  const pointsToNextTier = nextTier ? Math.max(nextTier.minimumPoints - points, 0) : 0;
  const progressPercent = nextTier
    ? Math.max(
        0,
        Math.min(
          100,
          Math.floor(
            ((points - currentTier.minimumPoints) / Math.max(nextTier.minimumPoints - currentTier.minimumPoints, 1)) *
              100,
          ),
        ),
      )
    : 100;

  return {
    benefits: currentTier.benefits,
    lifetimeSpent,
    nextTier: nextTier?.tier ?? null,
    nextTierThreshold: nextTier?.minimumPoints ?? null,
    points,
    pointsToNextTier,
    progressPercent,
    tier: currentTier.tier,
    totalOrders,
  } satisfies LoyaltySummary;
}
