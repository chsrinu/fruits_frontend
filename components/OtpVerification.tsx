import React, { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppButton } from "@/components/ui/AppButton";

type OtpVerificationProps = {
  blockedMessage?: string;
  disabled?: boolean;
  helperText?: string;
  isSubmitting?: boolean;
  length?: number;
  mobileNumber: string;
  onComplete: (otp: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  resetKey?: number;
  resendLabel?: string;
  timerSeconds?: number;
};

export function OtpVerification({
  blockedMessage,
  disabled = false,
  helperText = "Enter the OTP sent to your mobile number.",
  isSubmitting = false,
  length = 4,
  mobileNumber,
  onComplete,
  onResend,
  resetKey = 0,
  resendLabel = "Resend OTP",
  timerSeconds = 60,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(timerSeconds);
  const inputRef = useRef<TextInput | null>(null);
  const canSubmit = otp.length === length && !disabled && !isSubmitting;
  const helperLabel = useMemo(() => `Enter the ${length}-digit OTP sent to your mobile number.`, [length]);

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  useEffect(() => {
    setTimer(timerSeconds);
  }, [timerSeconds]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((current) => current - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    setOtp("");
    const timer = setTimeout(() => {
      focusInput();
    }, 150);
    return () => clearTimeout(timer);
  }, [length, mobileNumber, resetKey]);

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, length));
  };

  const handleSubmit = () => {
    console.log("[OtpVerification] submit tapped", {
      otpLength: otp.length,
      expectedLength: length,
      disabled,
      isSubmitting,
      canSubmit,
      mobileNumber,
    });
    if (!canSubmit) return;
    console.log("[OtpVerification] calling onComplete", {
      mobileNumber,
      otp,
    });
    Keyboard.dismiss();
    void onComplete(otp);
  };

  const handleResend = async () => {
    setTimer(timerSeconds);
    setOtp("");
    try {
      await onResend();
    } catch {
      // The parent flow owns user-facing error handling.
    }
    setTimeout(() => {
      focusInput();
    }, 150);
  };

  return (
    <View className="mt-4">
      <Text className="mb-2 text-center text-gray-600">{helperText || helperLabel}</Text>

      <TextInput
        ref={inputRef}
        autoFocus
        className="mb-3 rounded-xl border border-gray-400 px-4 py-3 text-center text-xl font-semibold tracking-[8px]"
        editable={!disabled && !isSubmitting}
        keyboardType="number-pad"
        maxLength={length}
        onChangeText={handleOtpChange}
        placeholder={"0".repeat(length)}
        returnKeyType="done"
        selectTextOnFocus
        showSoftInputOnFocus
        textContentType="oneTimeCode"
        value={otp}
      />

      <AppButton
        className="mb-3 rounded-xl"
        disabled={!canSubmit}
        onPress={handleSubmit}
        label={isSubmitting ? "Verifying OTP..." : "Submit OTP"}
      />

      {disabled && blockedMessage ? (
        <Text className="mb-3 text-center text-sm text-slate-500">{blockedMessage}</Text>
      ) : null}

      {timer > 0 ? (
        <Text className="text-center text-gray-500">Resend OTP in {timer}s</Text>
      ) : (
        <TouchableOpacity disabled={isSubmitting} onPress={handleResend}>
          <Text className="text-center text-blue-600">{resendLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
