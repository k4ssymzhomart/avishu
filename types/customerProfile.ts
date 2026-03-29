import type { UserRole } from '@/types/user';

export type LoyaltyTier = 'Slate' | 'Monolith' | 'Obsidian';

export type LoyaltySummary = {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  nextTierProgress: number;
  points: number;
  pointsToNextTier: number;
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
  phone?: string | null;
  role?: UserRole | null;
  uid: string;
};
