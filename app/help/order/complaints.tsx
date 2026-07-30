import React, { useEffect } from "react";
import { SafeAreaView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function OrderComplaintsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const resolvedOrderId = String(orderId || "");

  useEffect(() => {
    router.replace({ pathname: "/help/order", params: { orderId: resolvedOrderId } });
  }, [resolvedOrderId, router]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-5">
      <View>
        <Text className="text-base text-slate-700">Redirecting...</Text>
      </View>
    </SafeAreaView>
  );
}
