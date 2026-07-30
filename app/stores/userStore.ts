// store/userStore.ts
import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserDetails } from "../api/user";

// Type definitions
export interface UserAddressDTO {
  id: number | null;
  address: string | null;
  pincode: string | null;
  localityName: string | null;
  city: string | null;
  state: string | null;
  landmark: string | null;
  societyName: string | null;
  blockName: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceableAreaId: number | null;
  societyId: number | null;
  blockId: number | null;
}

export interface UserDTO {
  id: number;
  mobileNumber: string;
  firstName: string | null;
  lastName: string | null;
  userRole: string;
  userEmail: string | null;
  address: UserAddressDTO | null;
  walletBalance: number | null;
}

interface UserState {
  user: UserDTO | null;

  // Actions
  setUser: (user: UserDTO | null) => void;
  refreshUser: () => Promise<void>;  // fetch /user/me
  clearUser: () => void;
}


// ✅ Wrap AsyncStorage to match PersistStorage shape
const zustandStorage: PersistStorage<UserState> = {
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

// Zustand Store
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      refreshUser: async () => {
        const res = await getUserDetails(); // GET /user/me
        set({ user: res.data });
      },

      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage",
      storage: zustandStorage
    }
  )
);
