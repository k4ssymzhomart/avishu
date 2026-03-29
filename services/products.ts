import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { demoProducts } from '@/lib/constants/demo';
import { getFirestoreInstance } from '@/lib/firebase';
import { useDemoRealtimeStore } from '@/store/demoRealtime';
import type { Product, ProductDraft } from '@/types/product';

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
    assignedBranches: Array.isArray(record.assignedBranches) ? record.assignedBranches.filter(Boolean) : [],
    category: record.category,
    collection: record.collection,
    colors: record.colors ?? [],
    createdBy: record.createdBy?.trim().length ? record.createdBy.trim() : 'admin',
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

export function isProductVisibleToBranch(product: Product, branchId: string | null | undefined) {
  if (!branchId) {
    return true;
  }

  return (
    product.createdBy === branchId ||
    product.assignedBranches.includes(branchId) ||
    product.assignedBranches.length === 0
  );
}

export function getVisibleProductsForBranch(products: Product[], branchId: string | null | undefined) {
  return sortProducts(products.filter((product) => isProductVisibleToBranch(product, branchId)));
}

export function getManageableProductsForFranchise(products: Product[], franchiseId: string | null | undefined) {
  if (!franchiseId) {
    return sortProducts(products);
  }

  return sortProducts(
    products.filter(
      (product) =>
        product.createdBy === franchiseId ||
        product.assignedBranches.includes(franchiseId) ||
        product.assignedBranches.length === 0,
    ),
  );
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

export async function upsertProduct(input: ProductDraft) {
  const firestore = getFirestoreInstance();
  const normalizedProduct: Product = normalizeProduct(
    {
      ...input,
      assignedBranches: [...new Set(input.assignedBranches.filter(Boolean))],
      createdBy: input.createdBy || 'admin',
      id: input.id,
    },
    input.id?.trim().length ? input.id.trim() : `product-${Date.now().toString(36)}`,
  );

  if (!firestore) {
    useDemoRealtimeStore.getState().upsertProduct(normalizedProduct);
    return normalizedProduct.id;
  }

  await setDoc(
    doc(firestore, PRODUCTS_COLLECTION, normalizedProduct.id),
    {
      ...normalizedProduct,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return normalizedProduct.id;
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
