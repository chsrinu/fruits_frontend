// api/user.ts
import { UserAddressDTO } from '../stores/userStore';
import instance from './axiosInstance';

export type UserCartItemDTO = {
  id: string;
  quantity: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImageUrl: string;
};

export type UserCartDTO = {
  cartId: string;
  items: UserCartItemDTO[];
  totalPrice: number;
};

export type InitiateWalletTopupRequest = {
  walletId?: number;
  amount: number;
  paymentMethod: string;
};

export type InitiateWalletTopupResponse = {
  orderId: string;
  amount: number;
  topupRequestId: number;
};

export type WalletTopupCallbackRequest = {
  merchantOrderId: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  transactionId: string;
  amount: number;
};

export type WalletTransactionType = "CREDIT" | "DEBIT";

export type WalletTransactionDTO = {
  id: number;
  walletId: number;
  walletTransactionType: WalletTransactionType;
  amount: number;
  purpose: string | null;
  referenceId: string | null;
  remarks: string | null;
  createdAt: string;
};

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

// Address APIs
export const getUserDetails = () =>
    instance.get("/user/me");

export const getUserCart = () =>
    instance.get<UserCartDTO>("/user/cart");

export const createUserCart = (payload: UserCartDTO) =>
    instance.post<UserCartDTO>("/user/cart/create", payload);

export const initiateWalletTopup = (payload: InitiateWalletTopupRequest) =>
    instance.post<InitiateWalletTopupResponse>("/user/payment/initiate", payload);

export const confirmWalletTopup = (payload: WalletTopupCallbackRequest) =>
    instance.post<string>("/user/payment/callback", payload);

export const getWalletTransactions = () =>
    instance.get<WalletTransactionDTO[]>("/user/payment/transactions");

export const updateAddress = (address: UserAddressDTO) => {
  return instance.put("/user/update-details", {
    address: {
      ...address,   // merges your provided fields
    },
  });
};

type UpdateUserDetailsPayload = {
  firstName?: string | null;
  lastName?: string | null;
  userEmail?: string | null;
};

export const updateUserDetails = (payload: UpdateUserDetailsPayload) => {
  return instance.put("/user/update-details", payload);
};
