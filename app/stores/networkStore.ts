import { create } from "zustand";

type NetworkState = {
  activeRequests: number;
  startRequest: () => void;
  endRequest: () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  activeRequests: 0,
  startRequest: () =>
    set((state) => ({ activeRequests: state.activeRequests + 1 })),
  endRequest: () =>
    set((state) => ({ activeRequests: Math.max(0, state.activeRequests - 1) })),
}));

