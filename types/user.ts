export type UserRole = 'customer' | 'franchisee' | 'production';

export type User = {
  branchAddress?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  franchiseId?: string | null;
  franchiseName?: string | null;
  id: string;
  linkedFranchiseIds?: string[] | null;
  name: string;
  productionUnitId?: string | null;
  productionUnitName?: string | null;
  role: UserRole;
  phoneNumber?: string | null;
};
