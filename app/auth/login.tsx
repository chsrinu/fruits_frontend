// app/auth/login.tsx
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { OtpVerification } from "@/components/OtpVerification";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { AppTextField } from "@/components/ui/AppTextField";
import { sendOtp } from "../api/user";
import { completeOtpVerification } from "./completeOtpVerification";
import { useAuthStore } from "../stores/authStore";
import { ui } from "@/app/theme/designSystem";

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [showInlineOtp, setShowInlineOtp] = useState(false);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const clearToken = useAuthStore((s) => s.clearToken);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        clearToken();
      } else {
        router.replace("/");
      }
    } catch (err) {
      console.warn("Invalid token, clearing");
      clearToken();
    }
  }, [clearToken, router, token]);

  const sendOtpMutation = useMutation({
    mutationFn: (mobileNumber: string) => sendOtp(mobileNumber),
    onError: (error: any) => {
      console.error("Send OTP Error:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send OTP. Please try again.";

      Alert.alert("Error", errorMessage);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (otp: string) =>
      completeOtpVerification({
        mobileNumber: mobile,
        otp,
        setToken,
      }),
    onSuccess: () => {
      router.replace("/home");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to verify OTP";
      Alert.alert("Error", message, [
        {
          text: "OK",
          onPress: () => {
            setOtpResetKey((current) => current + 1);
          },
        },
      ]);
    },
  });

  const requestOtp = async () => {
    if (mobile.length !== 10) {
      Alert.alert("Invalid number", "Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      const response = await sendOtpMutation.mutateAsync(mobile);
      const isNewUser = response?.data?.isNewUser === true;

      if (isNewUser) {
        router.replace({
          pathname: "/auth/otp",
          params: { mobile, isNewUser: "true" },
        });
        return;
      }

      setShowInlineOtp(true);
    } catch (error) {
      // The mutation onError handler already surfaces the failure.
    }
  };

  return (
    <View className={`${ui.screen} justify-center p-6`}>
      <AppText variant="title" className="mb-2 text-center">Login</AppText>
      <AppText variant="bodyMuted" className="mb-5 text-center">
        Enter your mobile number to continue.
      </AppText>

      <AppTextField
        className={`mb-4 ${showInlineOtp ? ui.inputDisabled : ""}`}
        editable={!showInlineOtp}
        keyboardType="numeric"
        maxLength={10}
        placeholder="Mobile Number"
        value={mobile}
        onChangeText={setMobile}
      />

      {!showInlineOtp ? (
        <AppButton
          onPress={requestOtp}
          loading={sendOtpMutation.isPending}
          label={sendOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
        />
      ) : (
        <>
          <OtpVerification
            helperText={`Enter the 4-digit OTP sent to ${mobile}.`}
            isSubmitting={verifyOtpMutation.isPending}
            mobileNumber={mobile}
            onComplete={(otp) => {
              console.log("[LoginScreen] OTP onComplete received", {
                mobile,
                otp,
              });
              verifyOtpMutation.mutate(otp);
            }}
            onResend={requestOtp}
            resetKey={otpResetKey}
          />
          <AppButton
            className="mt-5"
            variant="outline"
            size="sm"
            onPress={() => {
              setShowInlineOtp(false);
              setOtpResetKey((current) => current + 1);
            }}
            label="Use a different mobile number"
          />
        </>
      )}
    </View>
  );
}
