import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import {
  ComplaintResponse,
  createComplaintApi,
  CreateComplaintRequest,
  getComplaintsByOrderIdApi,
} from "@/app/api/complaint";

interface ComplaintState {
  complaintsByOrderId: Record<string, ComplaintResponse[]>;
  isSyncingByOrderId: Record<string, boolean>;
  createComplaint: (payload: CreateComplaintRequest) => Promise<ComplaintResponse>;
  getComplaintsByOrderId: (orderId: string) => ComplaintResponse[];
  syncComplaintsByOrderId: (orderId: string) => Promise<void>;
  clearAll: () => void;
}

const zustandStorage: PersistStorage<ComplaintState> = {
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

export const useComplaintStore = create<ComplaintState>()(
  persist(
    (set, get) => ({
      complaintsByOrderId: {},
      isSyncingByOrderId: {},
      createComplaint: async (payload) => {
        const response = await createComplaintApi(payload);
        const complaint = response.data;
        const state = get();
        const existingForOrder = state.complaintsByOrderId[payload.orderId] || [];
        const withoutDuplicate = existingForOrder.filter((item) => item.complaintId !== complaint.complaintId);

        set({
          complaintsByOrderId: {
            ...state.complaintsByOrderId,
            [payload.orderId]: [complaint, ...withoutDuplicate],
          },
        });

        return complaint;
      },
      getComplaintsByOrderId: (orderId) => get().complaintsByOrderId[orderId] || [],
      syncComplaintsByOrderId: async (orderId) => {
        if (!orderId) return;
        set((state) => ({
          isSyncingByOrderId: {
            ...state.isSyncingByOrderId,
            [orderId]: true,
          },
        }));
        try {
          const response = await getComplaintsByOrderIdApi(orderId);
          set((state) => ({
            complaintsByOrderId: {
              ...state.complaintsByOrderId,
              [orderId]: response.data || [],
            },
          }));
        } finally {
          set((state) => ({
            isSyncingByOrderId: {
              ...state.isSyncingByOrderId,
              [orderId]: false,
            },
          }));
        }
      },
      clearAll: () => set({ complaintsByOrderId: {}, isSyncingByOrderId: {} }),
    }),
    {
      name: "complaint-storage",
      storage: zustandStorage,
    }
  )
);
