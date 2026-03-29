export type ProductAvailability = 'in_stock' | 'preorder';
export type ProductCreatedBy = 'admin' | string;

export type ProductColorOption = {
  id: string;
  label: string;
  swatch: string;
};

export type Product = {
  assignedBranches: string[];
  category?: string;
  colors?: ProductColorOption[];
  collection?: string;
  createdBy: ProductCreatedBy;
  description?: string;
  fit?: string;
  imageUrl?: string;
  id: string;
  material?: string;
  name: string;
  price: number;
  availability: ProductAvailability;
  preorderLeadDays?: number;
  sizes?: string[];
};

export type ProductDraft = Omit<Product, 'id'> & {
  id?: string;
};
