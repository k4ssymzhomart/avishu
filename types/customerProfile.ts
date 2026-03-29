import type { UserRole } from '@/types/user';

export type LoyaltyTier = 'BASIC' | 'SILVER' | 'BLACK';

export type LoyaltyBenefitLabel = 'ACCESS' | 'COLLECTION' | 'ATELIER';

export type LoyaltyBenefits = {
  discountPercent: number;
  earlyAccess: boolean;
  label: LoyaltyBenefitLabel;
  perkLabels: string[];
  prioritySupport: boolean;
  rewardText: string;
};

export type LoyaltySummary = {
  benefits: LoyaltyBenefits;
  lifetimeSpent: number;
  nextTier: LoyaltyTier | null;
  nextTierThreshold: number | null;
  points: number;
  pointsToNextTier: number;
  progressPercent: number;
  tier: LoyaltyTier;
  totalOrders: number;
};

export type CustomerAddress = {
  city?: string | null;
  id: string;
  isDefault?: boolean;
  label: string;
  line1: string;
  line2?: string | null;
  note?: string | null;
};

export type CustomerProfile = {
  addresses: CustomerAddress[];
  assignedFranchiseId: string | null;
  assignedFranchiseName: string | null;
  createdAt: string;
  displayName: string;
  loyalty: LoyaltySummary;
  phone: string | null;
  role: UserRole;
  uid: string;
  updatedAt: string;
};

export type CustomerProfileSeed = {
  displayName?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  phone?: string | null;
  role?: UserRole | null;
  uid: string;
};
