// api/user.ts
import instance from './axiosInstance';

export const sendOtp = (mobileNumber: string) =>{
    console.log("Sending Otp");
    return instance.post('/auth/login', { mobileNumber });
}


export const verifyOtp = (payload: Record<string, any>) =>
    instance.post('/auth/verify', payload);

export const getSocietiesByPincode = (pincode: string) =>
    instance.get(`/public/serviceable-areas/society/grid/${pincode}`);

export const getBlocksBySociety = (societyId: number) =>
    instance.get(`/public/serviceable-areas/${societyId}/blocks/grid`);

export const resendOtp = (mobileNumber: string) =>
    instance.post('/auth/resend-otp', { mobileNumber });
