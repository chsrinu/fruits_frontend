// store/cartStore.ts
import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
    productId: number;
    productName: string;
    productImageUrlPath: string;
    pricePerUnit: number;
    quantity: number;
    units: string;
    isAvailable: boolean;
    displayUnits: string;
}

interface CartState {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    setCartItems: (items: CartItem[]) => void;
}

// ✅ Wrap AsyncStorage to match PersistStorage type
const zustandStorage: PersistStorage<CartState> = {
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

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (item) => {
                const existing = get().items.find(i => i.productId === item.productId);
                console.log(item)
                if (existing) {
                    set({
                        items: get().items.map(i =>
                            i.productId === item.productId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        ),
                    });
                } else {
                    set({ items: [...get().items, item] });
                }
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeFromCart(productId);
                } else {
                    set({
                        items: get().items.map(i =>
                            i.productId === productId ? { ...i, quantity } : i
                        ),
                    });
                }
            },

            removeFromCart: (productId) => {
                set({ items: get().items.filter(i => i.productId !== productId) });
            },

            clearCart: () => set({ items: [] }),

            setCartItems: (items) => set({ items }),
        }),
        {
            name: 'cart-storage',
            storage: zustandStorage,
        }
    )
);
