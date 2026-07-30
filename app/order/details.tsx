import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from "@tanstack/react-query";
import { getOrderDetails } from "@/app/api/order";
import { useOrderStore } from "../stores/orderStore";
import { BackButton } from "@/components/BackButton";
import { useProductStore } from "@/app/stores/productStore";
import { AppButton } from "@/components/ui/AppButton";

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toDateString();
};

const normalizeStatus = (value?: string) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .trim()
    .toLowerCase();

const getLifecycleStepForStatus = (value?: string) => {
  const status = normalizeStatus(value);
  if (!status) return "";
  if (status.includes("deliver")) return "delivered";
  if (status.includes("ship") || status.includes("fulfill")) return "shipped";
  if (status.includes("confirm") || status.includes("accept")) return "confirmed";
  if (status.includes("place") || status.includes("pending") || status.includes("create")) return "placed";
  return "";
};

const lifecycleSteps = ["Placed", "Confirmed", "Shipped", "Delivered"];
const screenTitleClassName = "ml-2 flex-1 text-left text-3xl font-bold text-black";
const sectionTitleClassName = "mb-2 text-xl font-semibold text-black";
const contentTextClassName = "text-base text-black";

const getFallbackProductIcon = (productName?: string) => {
  const name = String(productName || "").toLowerCase();
  if (name.includes("pear")) return "🍐";
  if (name.includes("apple")) return "🍎";
  if (name.includes("banana")) return "🍌";
  if (name.includes("orange")) return "🍊";
  if (name.includes("grape")) return "🍇";
  if (name.includes("mango")) return "🥭";
  if (name.includes("broccoli")) return "🥦";
  if (name.includes("carrot")) return "🥕";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("potato")) return "🥔";
  if (name.includes("onion")) return "🧅";
  return "🛒";
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { orderId, source } = useLocalSearchParams();
  const selectedOrderId = useOrderStore((s) => s.selectedOrderId);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const upsertOrder = useOrderStore((s) => s.upsertOrder);
  const selectOrder = useOrderStore((s) => s.selectOrder);
  const getProductImageUrlByName = useProductStore((s) => s.getProductImageUrlByName);
  const shouldDisableBack = String(source || "") === "success";

  const resolvedOrderId = String(orderId || selectedOrderId || "");
  const localOrder = resolvedOrderId
    ? selectedOrder?.orderId === resolvedOrderId
      ? selectedOrder
      : getOrderById(resolvedOrderId)
    : selectedOrder;

  const orderDetailsQuery = useQuery({
    queryKey: ["orders", "details", resolvedOrderId],
    enabled: Boolean(resolvedOrderId) && (!localOrder || localOrder.orderItems.length === 0),
    queryFn: async () => {
      console.log("[OrderDetailsScreen] fetching order details", { orderId: resolvedOrderId });
      const response = await getOrderDetails(resolvedOrderId);
      upsertOrder(response.data);
      selectOrder(response.data.orderId, response.data);
      return response.data;
    },
  });

  const order = orderDetailsQuery.data || localOrder;

  if (orderDetailsQuery.isLoading && !order) {
    return (
      <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white p-5">
        <View className="mb-4 flex-row items-center">
          <BackButton hidden={shouldDisableBack} className="px-1 py-1" colorClassName="text-black" />
          <Text className={screenTitleClassName}>Order Details</Text>
        </View>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white p-5">
        <Text className="mb-2 text-3xl font-bold text-black">Order not found</Text>
        <Text className="mb-4 text-base text-black">
          We could not find this order in local state. Please open it from the Orders tab.
        </Text>
        <AppButton
          onPress={() => router.replace("/home")}
          label="Go Home"
          className="rounded-lg"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-2" contentContainerClassName="pb-6">
        <View className="mb-4 flex-row items-center">
          <BackButton hidden={shouldDisableBack} className="px-1 py-1" colorClassName="text-black" />
          <Text className={screenTitleClassName}>Order Details</Text>
          <TouchableOpacity
            className="h-9 w-9 rounded-full border border-gray-400 items-center justify-center"
            onPress={() => router.push({ pathname: "/help/order", params: { orderId: resolvedOrderId } })}
            accessibilityRole="button"
            accessibilityLabel="Order help"
          >
            <Text className="text-lg font-semibold">?</Text>
          </TouchableOpacity>
        </View>

        <View className="border border-green-600 rounded-xl p-4 mb-4">
          <Text className={sectionTitleClassName}>Order Items</Text>
          {order.orderItems.length === 0 ? (
            <Text className="text-base text-gray-500">No items available</Text>
          ) : (
            order.orderItems.map((item) => {
              const subtotal = Number(item.pricePerUnit || 0) * Number(item.quantity || 0);
              const imageUrl = getProductImageUrlByName(item.productName);
              return (
                <View key={`${item.id}-${item.productId}`} className="mb-3 flex-row">
                  <View className="mr-3 h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className="text-2xl">{getFallbackProductIcon(item.productName)}</Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black">{item.productName}</Text>
                    <Text className={contentTextClassName}>
                      Qty: {item.quantity} | ₹{item.pricePerUnit}/unit | Subtotal: ₹{subtotal}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Text className={sectionTitleClassName}>Order Value</Text>
        <Text className={`${contentTextClassName} mb-4`}>₹{String(order.orderValue || "N/A")}</Text>

        <View className="border border-blue-400 rounded-xl p-4 mb-4">
          <Text className={sectionTitleClassName}>Order Status</Text>
          <Text className={contentTextClassName}>
            {lifecycleSteps.map((step, index) => {
              const currentStep = getLifecycleStepForStatus(order.orderStatus);
              const isCurrent = currentStep === normalizeStatus(step);
              return (
                <Text key={step} className={isCurrent ? "font-bold text-green-700" : "font-normal text-black"}>
                  {step}
                  {index < lifecycleSteps.length - 1 ? " -> " : ""}
                </Text>
              );
            })}
            {!getLifecycleStepForStatus(order.orderStatus) && order.orderStatus ? (
              <Text className="font-bold text-green-700">{" -> "}{String(order.orderStatus)}</Text>
            ) : null}
          </Text>
        </View>

        <Text className={sectionTitleClassName}>Order ID</Text>
        <Text className={`${contentTextClassName} mb-4`}>{String(order.orderId || "N/A")}</Text>

        <Text className={sectionTitleClassName}>Delivery Code</Text>
        <Text className={`${contentTextClassName} mb-4`}>{String(order.deliveryCode || "N/A")}</Text>

        <Text className={sectionTitleClassName}>Delivery Address</Text>
        <Text className={`${contentTextClassName} mb-4`}>{String(order.address || "N/A")}</Text>

        <Text className={sectionTitleClassName}>Order Placed</Text>
        <Text className={`${contentTextClassName} mb-4`}>{formatDateTime(String(order.createdAt || ""))}</Text>

        <Text className={sectionTitleClassName}>Expected Delivery</Text>
        <Text className={`${contentTextClassName} mb-6`}>{formatDate(String(order.expectedDeliveryDate || ""))}</Text>

        <AppButton
          onPress={() => router.replace("/home")}
          label="Continue Shopping"
          className="rounded-lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
