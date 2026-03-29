import type { Product, ProductColorOption } from '@/types/product';

export function buildPreorderDates(leadDays: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + leadDays + index);
    return date.toISOString();
  });
}

function inferSizes(product: Product) {
  if (product.sizes?.length) {
    return product.sizes;
  }

  if (product.category === 'OUTERWEAR') {
    return ['S', 'M', 'L', 'XL'];
  }

  if (product.category === 'CARDIGANS / KNIT') {
    return ['S', 'M', 'L'];
  }

  return ['XS', 'S', 'M', 'L', 'XL'];
}

function inferColors(product: Product): ProductColorOption[] {
  if (product.colors?.length) {
    return product.colors;
  }

  if (product.category === 'BASICS') {
    return [
      { id: 'chalk', label: 'Chalk', swatch: '#DDD9D2' },
      { id: 'ink', label: 'Ink', swatch: '#212224' },
    ];
  }

  return [
    { id: 'stone', label: 'Stone', swatch: '#CBC6BC' },
    { id: 'black', label: 'Black', swatch: '#111111' },
  ];
}

export function getProductCatalogMeta(product: Product) {
  return {
    colors: inferColors(product),
    description:
      product.description ??
      'A monochrome AVISHU piece composed for a calm silhouette, strong proportion, and daily wear.',
    fit: product.fit ?? 'Relaxed fit',
    material: product.material ?? 'Signature AVISHU textile blend',
    sizes: inferSizes(product),
  };
}

export function buildOrderProductName(product: Product, options: { colorLabel?: string | null; size?: string | null }) {
  const suffix = [options.colorLabel, options.size].filter(Boolean).join(' / ');

  return suffix ? `${product.name} / ${suffix}` : product.name;
}
