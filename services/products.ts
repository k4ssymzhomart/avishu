import { collection, doc, onSnapshot } from 'firebase/firestore';

import { demoProducts } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { Product } from '@/types/product';

const PRODUCTS_COLLECTION = 'products';
const productListeners = new Set<(products: Product[]) => void>();
let productListUnsubscribe: (() => void) | null = null;
let productListCache: Product[] | null = null;

function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => left.name.localeCompare(right.name, 'ru'));
}

function normalizeProduct(record: Partial<Product>, fallbackId: string): Product {
  return {
    availability: record.availability === 'preorder' ? 'preorder' : 'in_stock',
    category: record.category,
    collection: record.collection,
    colors: record.colors ?? [],
    description: record.description,
    fit: record.fit,
    id: record.id ?? fallbackId,
    imageUrl: record.imageUrl,
    material: record.material,
    name: record.name?.trim().length ? record.name.trim() : 'AVISHU Piece',
    preorderLeadDays: record.preorderLeadDays,
    price: typeof record.price === 'number' ? record.price : 0,
    sizes: record.sizes ?? [],
  };
}

function emitProducts(products: Product[]) {
  productListCache = sortProducts(products);
  productListeners.forEach((listener) => listener(productListCache ?? []));
}

export function getCachedProducts() {
  return productListCache;
}

function startProductListSubscription() {
  if (productListUnsubscribe) {
    return;
  }

  const firestore = getFirestoreInstance();

  if (!firestore) {
    return;
  }

  productListUnsubscribe = onSnapshot(
    collection(firestore, PRODUCTS_COLLECTION),
    (snapshot) => {
      emitProducts(snapshot.docs.map((snapshotDoc) => normalizeProduct(snapshotDoc.data() as Product, snapshotDoc.id)));
    },
    () => {
      emitProducts([]);
    },
  );
}

export function getCachedProductById(productId: string) {
  if (productListCache?.length) {
    return productListCache.find((product) => product.id === productId) ?? null;
  }

  return demoProducts.find((product) => product.id === productId) ?? null;
}

export function subscribeToProducts(onProducts: (products: Product[]) => void) {
  const firestore = getFirestoreInstance();

  if (!firestore) {
    onProducts(sortProducts(demoProducts));
    return useDemoRealtimeStore.subscribe((state) => {
      onProducts(sortProducts(state.products));
    });
  }

  if (productListCache) {
    onProducts(productListCache);
  }

  productListeners.add(onProducts);
  startProductListSubscription();

  return () => {
    productListeners.delete(onProducts);

    if (!productListeners.size && productListUnsubscribe) {
      productListUnsubscribe();
      productListUnsubscribe = null;
    }
  };
}

export function subscribeToProduct(productId: string, onProduct: (product: Product | null) => void) {
  const cachedProduct = getCachedProductById(productId);
  const firestore = getFirestoreInstance();

  if (cachedProduct) {
    onProduct(cachedProduct);
  }

  if (!firestore) {
    onProduct(cachedProduct);
    return () => undefined;
  }

  return onSnapshot(
    doc(firestore, PRODUCTS_COLLECTION, productId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onProduct(null);
        return;
      }

      const product = normalizeProduct(snapshot.data() as Product, snapshot.id);

      if (productListCache?.length) {
        const nextProducts = [...productListCache];
        const productIndex = nextProducts.findIndex((entry) => entry.id === product.id);

        if (productIndex === -1) {
          nextProducts.push(product);
        } else {
          nextProducts[productIndex] = product;
        }

        productListCache = sortProducts(nextProducts);
      }

      onProduct(product);
    },
    () => {
      onProduct(cachedProduct);
    },
  );
}
