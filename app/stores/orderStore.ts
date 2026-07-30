import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import { OrderDetails } from "@/app/types/order";

interface OrderState {
  orders: OrderDetails[];
  ordersById: Record<string, OrderDetails>;
  selectedOrderId: string | null;
  selectedOrder: OrderDetails | null;
  shouldRefreshHistory: boolean;
  setOrders: (orders: OrderDetails[]) => void;
  upsertOrder: (order: OrderDetails) => void;
  getOrderById: (orderId: string) => OrderDetails | null;
  selectOrder: (orderId: string | null, order?: OrderDetails | null) => void;
  markHistoryForRefresh: () => void;
  clearHistoryRefreshFlag: () => void;
  clearOrders: () => void;
}

const zustandStorage: PersistStorage<OrderState> = {
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

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      ordersById: {},
      selectedOrderId: null,
      selectedOrder: null,
      shouldRefreshHistory: false,
      setOrders: (orders) =>
        set((state) => {
          const ordersById = orders.reduce<Record<string, OrderDetails>>((acc, order) => {
            acc[order.orderId] = order;
            return acc;
          }, {});
          const selectedOrder = state.selectedOrderId ? ordersById[state.selectedOrderId] || null : null;
          return {
            orders,
            ordersById,
            selectedOrder,
            shouldRefreshHistory: false,
          };
        }),
      upsertOrder: (order) => {
        const existing = get().orders;
        const index = existing.findIndex((o) => o.orderId === order.orderId);
        if (index >= 0) {
          const updated = [...existing];
          updated[index] = order;
          set((state) => ({
            orders: updated,
            ordersById: {
              ...state.ordersById,
              [order.orderId]: order,
            },
            selectedOrder: state.selectedOrderId === order.orderId ? order : state.selectedOrder,
          }));
          return;
        }
        set((state) => ({
          orders: [order, ...existing],
          ordersById: {
            ...state.ordersById,
            [order.orderId]: order,
          },
          selectedOrder: state.selectedOrderId === order.orderId ? order : state.selectedOrder,
        }));
      },
      getOrderById: (orderId) => get().ordersById[orderId] || null,
      selectOrder: (orderId, order) =>
        set((state) => {
          if (!orderId) {
            return { selectedOrderId: null, selectedOrder: null };
          }

          if (order) {
            return {
              selectedOrderId: orderId,
              selectedOrder: order,
              ordersById: {
                ...state.ordersById,
                [orderId]: order,
              },
            };
          }

          return {
            selectedOrderId: orderId,
            selectedOrder: state.ordersById[orderId] || null,
          };
        }),
      markHistoryForRefresh: () => set({ shouldRefreshHistory: true }),
      clearHistoryRefreshFlag: () => set({ shouldRefreshHistory: false }),
      clearOrders: () =>
        set({
          orders: [],
          ordersById: {},
          selectedOrderId: null,
          selectedOrder: null,
          shouldRefreshHistory: false,
        }),
    }),
    {
      name: "order-storage",
      storage: zustandStorage,
    }
  )
);
