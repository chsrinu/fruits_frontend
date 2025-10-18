// store/authStore.ts
import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    token: string | null;
    mobileNumber: string | null;
    isLoggedIn: boolean;
    setToken: (token: string, mobileNumber: string) => void;
    clearToken: () => void;
}

// ✅ Wrap AsyncStorage to match PersistStorage shape
const zustandStorage: PersistStorage<AuthState> = {
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

/**
 *  Basic Signature of persist() from the zustand
 * persist(
 *   storeInitializer: (set, get, api) => StoreState,
 *   options: PersistOptions
 * )
 * **/
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            mobileNumber: null,
            isLoggedIn: false,
            setToken: (token, mobileNumber) =>
                set({ token, mobileNumber, isLoggedIn: true }),
            clearToken: () =>
                set({ token: null, mobileNumber: null, isLoggedIn: false }),
        }),
        {
            name: 'auth-storage',
            storage: zustandStorage,
        }
    )
);
