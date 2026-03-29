export type ProductionUnitStatus = 'active' | 'busy';

export type ProductionUnit = {
  activeTasks: number;
  capacity?: number | null;
  id: string;
  linkedFranchises: string[];
  location: string;
  name: string;
  status: ProductionUnitStatus;
  workersCount: number;
};

export type ProductionUnitDraft = Pick<
  ProductionUnit,
  'capacity' | 'linkedFranchises' | 'location' | 'name' | 'status' | 'workersCount'
> & {
  id?: string;
};
