import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ProductCatalogItem {
  productId: number;
  productName: string;
  productImageUrlPath: string;
  pricePerUnit: number;
  units: string;
  displayUnits: string;
  isAvailable: boolean;
}

interface ProductState {
  products: ProductCatalogItem[];
  lastFetchedAt: number | null;
  productImageIndexByName: Record<string, string>;
  setProducts: (products: ProductCatalogItem[]) => void;
  clearProducts: () => void;
  shouldRefreshProducts: (maxAgeMs?: number) => boolean;
  getProductImageUrlByName: (productName?: string | null) => string;
}

const zustandStorage: PersistStorage<ProductState> = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      lastFetchedAt: null,
      productImageIndexByName: {},
      setProducts: (products) =>
        set({
          products,
          lastFetchedAt: Date.now(),
          productImageIndexByName: products.reduce<Record<string, string>>((acc, product) => {
            const key = String(product.productName || "").trim().toLowerCase();
            if (key) {
              acc[key] = product.productImageUrlPath || "";
            }
            return acc;
          }, {}),
        }),
      clearProducts: () =>
        set({
          products: [],
          lastFetchedAt: null,
          productImageIndexByName: {},
        }),
      shouldRefreshProducts: (maxAgeMs = 60 * 60 * 1000) => {
        const state = get();
        if (!state.products.length || !state.lastFetchedAt) return true;
        return Date.now() - state.lastFetchedAt > maxAgeMs;
      },
      getProductImageUrlByName: (productName) => {
        const normalized = String(productName || "").trim().toLowerCase();
        if (!normalized) return "";
        return get().productImageIndexByName[normalized] || "";
      },
    }),
    {
      name: "product-storage",
      storage: zustandStorage,
    }
  )
);
