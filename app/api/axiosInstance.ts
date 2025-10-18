// api/axiosInstance.ts
import axios from 'axios';
import {useAuthStore as authStore} from "@/app/stores/authStore";

const instance = axios.create({
    baseURL: 'http://192.168.29.103:8080/api', // 🔁 Replace with your actual base URL
    timeout: 10000, // optional
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add the interceptor
instance.interceptors.request.use(
    (config) => {
        const token = authStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default instance;
