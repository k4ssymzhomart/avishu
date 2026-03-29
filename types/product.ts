export type ProductAvailability = 'in_stock' | 'preorder';

export type ProductColorOption = {
  id: string;
  label: string;
  swatch: string;
};

export type Product = {
  category?: string;
  colors?: ProductColorOption[];
  collection?: string;
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
