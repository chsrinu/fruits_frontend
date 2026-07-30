import React, { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUserStore } from "@/app/stores/userStore";
import { confirmWalletTopup, initiateWalletTopup } from "@/app/api/user";
import { AppButton } from "@/components/ui/AppButton";

type PaymentMethod = "CARD" | "UPI" | "NET_BANKING";

// Adjust this to your actual Wallet route if different.
const WALLET_ROUTE = "/wallet";

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Card", value: "CARD" },
  { label: "UPI", value: "UPI" },
  { label: "Net Banking", value: "NET_BANKING" },
];

export default function WalletPaymentScreen() {
  const router = useRouter();
  const {
    subtotal,
    cartId,
    deliveryAddressId,
    topupStatus,
    topupRequestId,
    paymentId,
    topupAmount,
  } = useLocalSearchParams();

  const user = useUserStore((s) => s.user);
  const refreshUser = useUserStore((s) => s.refreshUser);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [manualAmount, setManualAmount] = useState("");

  const amountDue = useMemo(
    () => Number(Array.isArray(subtotal) ? subtotal[0] : subtotal) || 0,
    [subtotal]
  );
  const resolvedCartId = String(Array.isArray(cartId) ? cartId[0] : cartId || "");
  const resolvedDeliveryAddressId = Number(
    Array.isArray(deliveryAddressId) ? deliveryAddressId[0] : deliveryAddressId || 0
  );

  // Manual top-up mode: screen opened directly from Wallet (no cart context).
  const isManualTopup = !resolvedCartId;

  const walletBalance = Number(user?.walletBalance || 0);
  const shortfall = Math.max(amountDue - walletBalance, 0);
  const hasEnoughBalance = shortfall <= 0;

  const parsedManualAmount = Number(manualAmount) || 0;
  const canSubmitManual = parsedManualAmount > 0;

  useEffect(() => {
    refreshUser().catch(() => {
      // Ignore refresh errors; we'll use persisted wallet balance as fallback.
    });
  }, [refreshUser, topupStatus]);

  useEffect(() => {
    if (topupStatus !== "success" || !topupRequestId) return;

    const resolvedTopupAmount =
      Number(Array.isArray(topupAmount) ? topupAmount[0] : topupAmount) || 0;

    const syncWalletTopup = async () => {
      try {
        await confirmWalletTopup({
          merchantOrderId: String(Array.isArray(topupRequestId) ? topupRequestId[0] : topupRequestId),
          status: "SUCCESS",
          transactionId: String(Array.isArray(paymentId) ? paymentId[0] : paymentId || ""),
          amount: resolvedTopupAmount > 0 ? resolvedTopupAmount : (shortfall > 0 ? shortfall : amountDue),
        });
      } catch {
        // Callback may already be processed by backend gateway callback; ignore.
      } finally {
        await refreshUser().catch(() => undefined);
        // Manual top-up (no cart) returns the user to the Wallet screen.
        if (isManualTopup) {
          router.replace(WALLET_ROUTE);
        }
      }
    };

    syncWalletTopup();
  }, [amountDue, isManualTopup, paymentId, refreshUser, router, shortfall, topupAmount, topupRequestId, topupStatus]);

  const handleWalletDeduct = async () => {
    if (!resolvedCartId || !resolvedDeliveryAddressId) {
      setError("Missing cart or delivery details.");
      return;
    }

    router.push({
      pathname: "/payment/success",
      params: {
        cartId: resolvedCartId,
        deliveryAddressId: String(resolvedDeliveryAddressId),
        flow: "wallet-deduct",
      },
    });
  };

  const handleTopUpPayment = async () => {
    if (!resolvedCartId || !resolvedDeliveryAddressId || shortfall <= 0) {
      setError("Missing payment details.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const response = await initiateWalletTopup({
        amount: shortfall,
        paymentMethod: method,
      });
      const data = response.data;

      router.push({
        pathname: "/payment/webview",
        params: {
          orderId: data.orderId,
          amount: data.amount,
          subtotal: String(amountDue),
          cartId: String(resolvedCartId),
          deliveryAddressId: String(resolvedDeliveryAddressId),
          flow: "wallet-topup",
          topupRequestId: String(data.topupRequestId ?? ""),
          topupAmount: String(shortfall),
        },
      });
    } catch {
      setError("Unable to initiate wallet top-up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTopup = async () => {
    if (!canSubmitManual) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      const response = await initiateWalletTopup({
        amount: parsedManualAmount,
        paymentMethod: method,
      });
      const data = response.data;

      router.push({
        pathname: "/payment/webview",
        params: {
          orderId: data.orderId,
          amount: data.amount,
          flow: "wallet-topup",
          topupRequestId: String(data.topupRequestId ?? ""),
          topupAmount: String(parsedManualAmount),
        },
      });
    } catch {
      setError("Unable to initiate wallet top-up. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white p-4">
      <ScreenHeader title={isManualTopup ? "Add Money" : "Payment"} />

      <View className="mt-4 rounded-xl border border-gray-200 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg text-gray-700">Wallet Balance:</Text>
          <Text className="text-2xl font-semibold">₹{walletBalance}</Text>
        </View>

        {!isManualTopup ? (
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-lg text-gray-700">Amount Due:</Text>
            <Text className="text-2xl font-semibold">₹{amountDue}</Text>
          </View>
        ) : null}
      </View>

      {/* Manual top-up: user enters any amount and proceeds to payment. */}
      {isManualTopup ? (
        <View className="mt-6 rounded-xl border border-gray-200 p-4">
          <Text className="mb-3 text-2xl font-semibold">Add Money to Wallet</Text>

          <Text className="mb-2 text-lg text-gray-700">Enter Amount:</Text>
          <TextInput
            value={manualAmount}
            onChangeText={(t) => setManualAmount(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="₹ 0"
            editable={!isLoading}
            className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-3xl font-semibold text-black"
          />

          <Text className="mb-2 text-lg text-gray-700">Methods:</Text>
          {PAYMENT_METHODS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className="mb-2 flex-row items-center"
              onPress={() => setMethod(option.value)}
              disabled={isLoading}
            >
              <View className={`mr-3 h-6 w-6 rounded-full border ${method === option.value ? "border-green-700" : "border-gray-400"} items-center justify-center`}>
                {method === option.value ? <View className="h-3 w-3 rounded-full bg-green-700" /> : null}
              </View>
              <Text className="text-xl text-black">{option.label}</Text>
            </TouchableOpacity>
          ))}

          <AppButton
            className="mt-3 rounded-lg"
            onPress={handleManualTopup}
            disabled={isLoading || !canSubmitManual}
            loading={isLoading}
            label={parsedManualAmount > 0 ? `Proceed to Pay ₹${parsedManualAmount}` : "Proceed to Payment"}
          />
        </View>
      ) : null}

      {/* Order flow: recharge for shortfall (only when there's a cart). */}
      {!isManualTopup && !hasEnoughBalance ? (
        <View className="mt-6 rounded-xl border border-gray-200 p-4">
          <Text className="mb-3 text-2xl font-semibold">Recharge Wallet for Order</Text>

          <Text className="mb-2 text-lg text-gray-700">Amount to Load:</Text>
          <TextInput
            editable={false}
            value={`₹ ${shortfall}`}
            className="mb-4 rounded-lg border border-gray-300 px-4 py-3 text-3xl font-semibold text-black"
          />

          <Text className="mb-2 text-lg text-gray-700">Methods:</Text>
          {PAYMENT_METHODS.map((option) => (
            <TouchableOpacity
              key={option.value}
              className="mb-2 flex-row items-center"
              onPress={() => setMethod(option.value)}
              disabled={isLoading}
            >
              <View className={`mr-3 h-6 w-6 rounded-full border ${method === option.value ? "border-green-700" : "border-gray-400"} items-center justify-center`}>
                {method === option.value ? <View className="h-3 w-3 rounded-full bg-green-700" /> : null}
              </View>
              <Text className="text-xl text-black">{option.label}</Text>
            </TouchableOpacity>
          ))}

          <AppButton
            className="mt-3 rounded-lg"
            onPress={handleTopUpPayment}
            disabled={isLoading}
            loading={isLoading}
            label={`Pay ₹${shortfall}`}
          />
        </View>
      ) : null}

      {/* Deduct button only relevant in the order flow. */}
      {!isManualTopup ? (
        <AppButton
          className="mt-6 rounded-lg"
          onPress={handleWalletDeduct}
          disabled={!hasEnoughBalance || isLoading}
          label={`Deduct ₹${amountDue} From Wallet`}
        />
      ) : null}

      {error ? <Text className="mt-4 text-center text-base text-red-600">{error}</Text> : null}
      {topupStatus === "success" ? (
        <Text className="mt-3 text-center text-base text-green-700">
          Wallet recharged successfully.
        </Text>
      ) : null}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}