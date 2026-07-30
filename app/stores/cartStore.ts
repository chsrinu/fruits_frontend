import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    productId: number;
    productName: string;
    productImageUrlPath: string;
    pricePerUnit: number;
    quantity: number;
    units: string;
    isAvailable: boolean;
    displayUnits: string;
}

export interface CartItemDTO {
    id: string;
    quantity: number;
    productId: number;
    productName: string;
    productPrice: number;
    productImageUrl: string;
}

export interface CartDTO {
    cartId: string;
    items: CartItemDTO[];
    totalPrice: number;
}

interface CartState {
    cartId: string | null;
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    setCartId: (cartId: string | null) => void;
    setCartItems: (items: CartItem[]) => void;
    hydrateFromCartDTO: (cart: CartDTO) => void;
}

// Wrap AsyncStorage to match PersistStorage type.
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

const mapDtoItemToCartItem = (item: CartItemDTO): CartItem => ({
    productId: item.productId,
    productName: item.productName,
    productImageUrlPath: item.productImageUrl,
    pricePerUnit: item.productPrice,
    quantity: item.quantity,
    units: 'UNIT',
    isAvailable: true,
    displayUnits: 'unit',
});

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cartId: null,
            items: [],

            addToCart: (item) => {
                const existing = get().items.find((i) => i.productId === item.productId);
                if (existing) {
                    set({
                        items: get().items.map((i) =>
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
                        items: get().items.map((i) =>
                            i.productId === productId ? { ...i, quantity } : i
                        ),
                    });
                }
            },

            removeFromCart: (productId) => {
                set({ items: get().items.filter((i) => i.productId !== productId) });
            },

            clearCart: () => set({ cartId: null, items: [] }),

            setCartId: (cartId) => set({ cartId }),

            setCartItems: (items) => set({ items }),

            hydrateFromCartDTO: (cart) =>
                set({
                    cartId: cart.cartId || null,
                    items: (cart.items || []).map(mapDtoItemToCartItem),
                }),
        }),
        {
            name: 'cart-storage',
            storage: zustandStorage,
        }
    )
);
