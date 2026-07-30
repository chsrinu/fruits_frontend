// app/config/backend.ts
import Constants from "expo-constants";

export const BACKEND_BASE_URL =
  Constants.expoConfig?.extra?.testingOnSimulator ||
  Constants.manifest?.extra?.backendBaseUrl; // fallback
