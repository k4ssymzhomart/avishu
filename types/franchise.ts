export type Franchise = {
  activeOrdersCount: number;
  address: string;
  createdAt: string;
  id: string;
  location: string;
  managerName: string;
  name: string;
  phone: string;
  productionLinked: string[];
};

export type FranchiseDraft = Pick<
  Franchise,
  'address' | 'location' | 'managerName' | 'name' | 'phone' | 'productionLinked'
> & {
  id?: string;
};
