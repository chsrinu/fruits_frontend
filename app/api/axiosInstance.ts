// api/axiosInstance.ts
import axios from 'axios';
import {useAuthStore as authStore} from "@/app/stores/authStore";
import { BACKEND_BASE_URL } from "@/config/backend";
import { useNetworkStore } from "@/app/stores/networkStore";

const instance = axios.create({
    baseURL: `${BACKEND_BASE_URL}/api`, // 🔁 Replace with your actual base URL
    timeout: 10000, // optional
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add the interceptor
instance.interceptors.request.use(
    (config) => {
        useNetworkStore.getState().startRequest();
        const token = authStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("[axiosInstance] sending request", {
            method: config.method,
            baseURL: config.baseURL,
            url: config.url,
            hasAuthHeader: Boolean(config.headers.Authorization),
            data: config.data,
        });
        return config;
    },
    (error) => {
        useNetworkStore.getState().endRequest();
        console.error("[axiosInstance] request interceptor error", {
            message: error.message,
        });
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        useNetworkStore.getState().endRequest();
        return response;
    },
    (error) => {
        useNetworkStore.getState().endRequest();
        console.error("[axiosInstance] response error", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
        });
        return Promise.reject(error);
    }
);

export default instance;
