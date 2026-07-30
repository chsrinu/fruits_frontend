import instance from "@/app/api/axiosInstance";
import { BACKEND_BASE_URL } from "@/config/backend";
import {useAuthStore as authStore} from "@/app/stores/authStore";


export const initiatePayment = (payload: Record<string, any>) =>
    instance.post('/user/payments/initiate', payload);


export const buildPaymentUrl = (orderId: string, amount: number) => {
    console.log("sreeni orderId", orderId);
    let mobileNumber = authStore.getState().mobileNumber;
    let email = authStore.getState().email;
    return `${BACKEND_BASE_URL}/payment.html?order_id=${orderId}&amount=${amount}&mobile=${mobileNumber}&email=${email}`;
};