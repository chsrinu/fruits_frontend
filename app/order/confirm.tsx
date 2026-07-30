import React from "react";
import { View, ScrollView, Image } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useCartStore } from "@/app/stores/cartStore";
import { useUserStore } from "@/app/stores/userStore";
import { createUserCart } from "../api/user";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { subtotal } = useLocalSearchParams();

  const cartItems = useCartStore((state) => state.items);
  const cartId = useCartStore((state) => state.cartId);
  const setCartId = useCartStore((state) => state.setCartId);
  let address = useUserStore((state) => state.user?.address);
  console.log("address id in confirm.tsx page ", address?.id)

  const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toDateString()
    .replace(/^[^ ]+ /, "");

  const handleProceedToPay = async () => {
    if (!address?.id) {
      router.push("/account/address/edit");
      return;
    }

    const resolvedSubtotal = Number(Array.isArray(subtotal) ? subtotal[0] : subtotal) || 0;
    const cartPayload = {
      cartId: cartId ?? "",
      items: cartItems.map((item) => ({
        id: "",
        quantity: item.quantity,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.pricePerUnit,
        productImageUrl: item.productImageUrlPath,
      })),
      totalPrice: resolvedSubtotal,
    };

    const cartResponse = await createUserCart(cartPayload);
    const resolvedCartId = cartResponse.data?.cartId || cartId || null;
    if (resolvedCartId) {
      setCartId(resolvedCartId);
    }

    router.push({
      pathname: "/payment/wallet",
      params: {
        subtotal: String(resolvedSubtotal),
        cartId: String(resolvedCartId ?? ""),
        deliveryAddressId: String(address.id),
      },
    });
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-6">
        <ScreenHeader title="Confirm Order" />

      {/* Delivery Date */}
      <AppText variant="section" className="mb-1">Order Delivery</AppText>
      <AppText className="mb-5">{estimatedDelivery}</AppText>

      {/* Order Items */}
      <AppText variant="section" className="mb-3">Order Items</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row mb-6"
      >
        {cartItems.map((item) => (
          <View key={item.productId} className="mr-4 items-center justify-center">
            <View className="h-16 w-16 rounded-full bg-gray-100 items-center justify-center shadow">
              {item.productImageUrlPath ? (
                <Image
                  source={{ uri: item.productImageUrlPath }}
                  className="h-10 w-10 rounded-full"
                  resizeMode="contain"
                />
              ) : (
                <AppText className="text-3xl">🍎</AppText>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Address */}
      <AppText variant="section" className="mb-3">Delivery Address</AppText>

      {!address ? (
        <View className="border border-gray-300 rounded-xl p-4">
          <AppText variant="bodyMuted" className="mb-3">No address added</AppText>
          <AppButton
            variant="outline"
            size="sm"
            onPress={() => router.push("/account/address/add")}
            label="Add Address"
          />
        </View>
      ) : (
        <View className="border border-gray-300 rounded-xl p-4">
          <AppText className="font-semibold">{address.address}</AppText>
          <AppText>
            {address.localityName}, {address.city}
          </AppText>
          <AppText>{address.pincode}</AppText>

          <AppButton
            className="mt-3"
            variant="outline"
            size="sm"
            onPress={() => router.push("/account/address/edit")}
            label="Change Address"
          />
        </View>
      )}

      {/* Total */}
      <View className="flex-row justify-between mt-8 mb-3">
        <AppText className="text-lg font-semibold">Total</AppText>
        <AppText className="text-lg font-semibold">₹{subtotal}</AppText>
      </View>

      {/* Pay Button */}
        <AppButton
          className="w-full"
          disabled={!address?.id}
          onPress={handleProceedToPay}
          label={address?.id ? `Proceed to Pay ₹${subtotal}` : "Add Address to Continue"}
        />
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
