import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OtpVerification } from "@/components/OtpVerification";
import { resendOtp } from "../api/user";
import { completeOtpVerification } from "./completeOtpVerification";
import { useAuthStore } from "@/app/stores/authStore";

export default function OtpScreen() {
  const { mobile, isNewUser } = useLocalSearchParams();
  const shouldCollectProfile = String(isNewUser) === "true";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();
  const isProfileIncomplete = shouldCollectProfile && (!firstName || !lastName || !email);

  const handleResendOtp = async () => {
    try {
      await resendOtp(mobile as string);
      Alert.alert("OTP Sent", "A new OTP has been sent to your mobile number.");
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP");
      console.error(error);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    console.log("[OtpScreen] handleVerifyOtp called", {
      mobile,
      otp,
      shouldCollectProfile,
      isProfileIncomplete,
    });
    setIsVerifying(true);
    try {
      await completeOtpVerification({
        mobileNumber: mobile as string,
        otp,
        setToken,
        ...(shouldCollectProfile ? { firstName, lastName, email } : {}),
      });

      router.replace("/home");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to verify OTP";
      Alert.alert("Error", message, [
        {
          text: "OK",
          onPress: () => {
            setOtpResetKey((current) => current + 1);
          },
        },
      ]);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View className="flex-1 p-10 bg-white">
          <Text className="text-2xl font-bold text-center mb-4">OTP Verification</Text>
          <Text className="text-center text-gray-600 mb-6">Verifying for: {mobile}</Text>

          {shouldCollectProfile ? (
            <>
              <TextInput
                className="border p-3 rounded-xl mb-3"
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                className="border p-3 rounded-xl mb-3"
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                className="border p-3 rounded-xl mb-3"
                placeholder="Email"
                value={email}
                keyboardType="email-address"
                onChangeText={setEmail}
              />
            </>
          ) : null}

          <OtpVerification
            blockedMessage={shouldCollectProfile ? "Fill your details above to auto-verify the OTP." : undefined}
            disabled={isProfileIncomplete}
            helperText="Enter the 4-digit OTP sent to your mobile number."
            isSubmitting={isVerifying}
            mobileNumber={mobile as string}
            onComplete={handleVerifyOtp}
            onResend={handleResendOtp}
            resetKey={otpResetKey}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
