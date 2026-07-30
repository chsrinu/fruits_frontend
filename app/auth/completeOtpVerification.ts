import { getUserDetails, verifyOtp } from "../api/user";
import { useUserStore } from "../stores/userStore";

type CompleteOtpVerificationParams = {
  mobileNumber: string;
  otp: string;
  setToken: (token: string, mobileNumber: string) => void;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export const completeOtpVerification = async ({
  mobileNumber,
  otp,
  setToken,
  firstName,
  lastName,
  email,
}: CompleteOtpVerificationParams) => {
  const payload = {
    mobileNumber,
    otp,
    userRole: "USER",
    ...(firstName || lastName || email ? { firstName, lastName, email } : {}),
  };

  console.log("[completeOtpVerification] starting verifyOtp", {
    mobileNumber,
    otp,
    hasProfileData: Boolean(firstName || lastName || email),
  });
  const response = await verifyOtp(payload);
  console.log("[completeOtpVerification] verifyOtp resolved", {
    hasToken: Boolean(response.data?.token),
    status: response.status,
  });
  const token = response.data?.token;
  console.log("[completeOtpVerification] calling getUserDetails");
  setToken(token, mobileNumber);
  const currentUser = await getUserDetails();
  console.log("[completeOtpVerification] getUserDetails resolved", {
    hasUserEmail: Boolean(currentUser.data?.userEmail),
    status: currentUser.status,
  });
  
  useUserStore.getState().setUser(currentUser.data);

  return currentUser.data;
};
