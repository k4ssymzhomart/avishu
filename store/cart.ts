import { create } from 'zustand';

import { persistCustomerCart } from '@/services/cart';
import { buildPreorderDates } from '@/lib/utils/productCatalog';
import type { CheckoutDraft, CheckoutReceipt, CartItem } from '@/types/cart';
import type { Product } from '@/types/product';

type CartState = {
  addDirectSelectionToCart: (product: Product) => CartItem | null;
  bindCustomer: (customerId: string | null) => void;
  beginCartCheckout: (itemIds?: string[]) => void;
  beginDirectCheckout: (product: Product) => void;
  cartItems: CartItem[];
  clearCart: () => void;
  clearReceipt: () => void;
  customerId: string | null;
  draft: CheckoutDraft;
  hasHydratedCart: boolean;
  hydratePersistedCart: (customerId: string | null, items: CartItem[], hasLoaded: boolean) => void;
  lastReceipt: CheckoutReceipt | null;
  removeItem: (itemId: string) => void;
  saveItemToCart: (
    product: Product,
    options: { colorId?: string | null; colorLabel?: string | null; preferredReadyDate?: string | null; size: string; },
  ) => CartItem;
  setReceipt: (receipt: CheckoutReceipt) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateDraft: (patch: Partial<CheckoutDraft>) => void;
};

function getInitialDraft(): CheckoutDraft {
  return {
    colorId: null,
    colorLabel: null,
    deliveryAddress: '',
    deliveryMethod: 'boutique_pickup',
    deliveryNote: '',
    mode: 'direct',
    paymentMethod: null,
    preferredReadyDate: null,
    productId: null,
    selectedCartItemIds: [],
    size: null,
  };
}

function createCartItem(
  product: Product,
  options: { colorId?: string | null; colorLabel?: string | null; preferredReadyDate?: string | null; size: string; },
): CartItem {
  return {
    addedAt: new Date().toISOString(),
    availability: product.availability,
    colorId: options.colorId ?? null,
    colorLabel: options.colorLabel ?? null,
    id: `cart-${Math.floor(Date.now() / 1000).toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl: product.imageUrl,
    preferredReadyDate: options.preferredReadyDate ?? null,
    price: product.price,
    productCollection: product.collection ?? null,
    productId: product.id,
    productName: product.name,
    quantity: 1,
    size: options.size,
  };
}

function persistNextCart(customerId: string | null, items: CartItem[]) {
  if (!customerId) {
    return;
  }

  void persistCustomerCart(customerId, items);
}

export const useCartStore = create<CartState>((set, get) => ({
  addDirectSelectionToCart: (product) => {
    const { colorId, colorLabel, preferredReadyDate, size } = get().draft;

    if (!size) {
      return null;
    }

    const item = createCartItem(product, {
      colorId,
      colorLabel,
      preferredReadyDate,
      size,
    });

    const nextCartItems = [item, ...get().cartItems];

    set({
      cartItems: nextCartItems,
    });
    persistNextCart(get().customerId, nextCartItems);

    return item;
  },
  bindCustomer: (customerId) => {
    set((state) => {
      if (state.customerId === customerId) {
        return state;
      }

      return {
        cartItems: [],
        customerId,
        hasHydratedCart: !customerId,
      };
    });
  },
  beginCartCheckout: (itemIds) => {
    const nextItemIds = itemIds?.length ? itemIds : get().cartItems.map((item) => item.id);

    set({
      draft: {
        ...getInitialDraft(),
        mode: 'cart',
        selectedCartItemIds: nextItemIds,
      },
    });
  },
  beginDirectCheckout: (product) => {
    const defaultReadyDate =
      product.availability === 'preorder' && product.preorderLeadDays
        ? buildPreorderDates(product.preorderLeadDays)[0] ?? null
        : null;

    set({
      draft: {
        ...getInitialDraft(),
        preferredReadyDate: defaultReadyDate,
        productId: product.id,
      },
    });
  },
  cartItems: [],
  customerId: null,
  clearCart: () => {
    set({ cartItems: [] });
    persistNextCart(get().customerId, []);
  },
  clearReceipt: () => {
    set({ lastReceipt: null });
  },
  draft: getInitialDraft(),
  hasHydratedCart: false,
  hydratePersistedCart: (customerId, items, hasLoaded) => {
    set((state) => {
      if (state.customerId !== customerId) {
        return {
          cartItems: customerId ? items : [],
          customerId,
          hasHydratedCart: hasLoaded || !customerId,
        };
      }

      return {
        cartItems: customerId ? items : [],
        hasHydratedCart: hasLoaded || !customerId,
      };
    });
  },
  lastReceipt: null,
  removeItem: (itemId) => {
    const nextCartItems = get().cartItems.filter((item) => item.id !== itemId);

    set({
      cartItems: nextCartItems,
    });
    persistNextCart(get().customerId, nextCartItems);
  },
  saveItemToCart: (product, options) => {
    const item = createCartItem(product, options);
    const nextCartItems = [item, ...get().cartItems];

    set({
      cartItems: nextCartItems,
    });
    persistNextCart(get().customerId, nextCartItems);

    return item;
  },
  setReceipt: (receipt) => {
    const selectedIds = new Set(get().draft.selectedCartItemIds);
    const nextCartItems =
      get().draft.mode === 'cart'
        ? get().cartItems.filter((item) => !selectedIds.has(item.id))
        : get().cartItems;

    set({
      cartItems: nextCartItems,
      draft: getInitialDraft(),
      lastReceipt: receipt,
    });
    persistNextCart(get().customerId, nextCartItems);
  },
  updateItemQuantity: (itemId, quantity) => {
    const nextCartItems = get().cartItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity: Math.max(1, Math.round(quantity)),
          }
        : item,
    );

    set({
      cartItems: nextCartItems,
    });
    persistNextCart(get().customerId, nextCartItems);
  },
  updateDraft: (patch) => {
    set((state) => ({
      draft: {
        ...state.draft,
        ...patch,
      },
    }));
  },
}));
