import React, { useEffect, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { getOrderHistory, toOrderDetails } from "@/app/api/order";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useOrderStore } from "@/app/stores/orderStore";
import { useUserStore } from "@/app/stores/userStore";
import { OrderDetails } from "@/app/types/order";

const sectionTitleClassName = "mb-3 mt-2 text-xl font-semibold text-black";
const orderMetaClassName = "text-base text-black";

function isCompletedOrder(status?: string) {
  return String(status || "").toUpperCase() === "DELIVERED";
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({
  order,
  isCompleted,
  sequenceNumber,
  onPress,
}: {
  order: OrderDetails;
  isCompleted: boolean;
  sequenceNumber: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4 rounded-xl border border-blue-200 p-4"
      accessibilityRole="button"
      accessibilityLabel={`Open order ${order.orderId}`}
    >
      <View className="flex-row items-start justify-between">
        <View className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${isCompleted ? "bg-green-600" : "bg-red-500"}`}>
          <Text className="text-xs font-semibold text-white">{sequenceNumber}</Text>
        </View>

        <View className="flex-1 pr-2">
          <Text className={`${orderMetaClassName} font-bold`}>ORDER #{order.orderId}</Text>
          <Text className={`${orderMetaClassName} mt-1`}>Placed: {formatDate(order.createdAt)}</Text>
          <Text className={orderMetaClassName}>
            {isCompleted ? "Delivered" : "Expected"}: {formatDate(isCompleted ? order.deliveredAt : order.expectedDeliveryDate)}
          </Text>
        </View>
        <Text className={`text-base font-bold ${isCompleted ? "text-green-700" : "text-red-500"}`}>
          {isCompleted ? "Completed" : "Pending"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const userId = useUserStore((state) => state.user?.id);
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const selectOrder = useOrderStore((state) => state.selectOrder);
  const shouldRefreshHistory = useOrderStore((state) => state.shouldRefreshHistory);
  const clearHistoryRefreshFlag = useOrderStore((state) => state.clearHistoryRefreshFlag);

  console.log("[OrdersScreen] render", {
    userId,
    ordersCount: orders.length,
    orderIds: orders.map((order) => order.orderId),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "history", userId],
    enabled: Boolean(userId),
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      console.log("[OrdersScreen] fetching order history", { userId });
      const response = await getOrderHistory(userId as number);
      console.log("[OrdersScreen] order history fetched", {
        userId,
        count: response.data.length,
      });
      return response.data.map(toOrderDetails);
    },
  });

  useEffect(() => {
    if (!ordersQuery.data) return;
    setOrders(ordersQuery.data);
  }, [ordersQuery.data, setOrders]);

  useEffect(() => {
    if (!shouldRefreshHistory || !userId) return;

    console.log("[OrdersScreen] forcing order history refresh", { userId });
    void ordersQuery.refetch().finally(() => {
      clearHistoryRefreshFlag();
    });
  }, [clearHistoryRefreshFlag, ordersQuery, shouldRefreshHistory, userId]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const tA = new Date(a.createdAt || "").getTime() || 0;
        const tB = new Date(b.createdAt || "").getTime() || 0;
        return tB - tA;
      }),
    [orders]
  );

  const pendingOrders = useMemo(
    () => sortedOrders.filter((order) => !isCompletedOrder(order.orderStatus)),
    [sortedOrders]
  );
  const completedOrders = useMemo(
    () => sortedOrders.filter((order) => isCompletedOrder(order.orderStatus)),
    [sortedOrders]
  );

  const openOrder = (order: OrderDetails) => {
    console.log("[OrdersScreen] openOrder", {
      orderId: order.orderId,
      status: order.orderStatus,
    });
    selectOrder(order.orderId, order);
    router.push({
      pathname: "/order/details",
      params: { orderId: order.orderId },
    });
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-3">
        <ScreenHeader title="Orders" containerClassName="mb-2" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-24">
        {ordersQuery.isLoading ? (
          <View className="mt-6" />
        ) : ordersQuery.isError ? (
          <View className="mt-4 rounded-xl border border-red-200 p-5">
            <Text className="text-center text-base text-red-700">Failed to fetch orders.</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="mt-4 rounded-xl border border-blue-200 p-5">
            <Text className="text-center text-base text-slate-700">No orders found yet.</Text>
          </View>
        ) : (
          <>
            <Text className={sectionTitleClassName}>Pending Orders</Text>
            {pendingOrders.length === 0 ? (
              <View className="mb-4 rounded-xl border border-blue-200 p-4">
                <Text className="text-base text-slate-700">No pending orders.</Text>
              </View>
            ) : (
              pendingOrders.map((order, index) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  isCompleted={false}
                  sequenceNumber={index + 1}
                  onPress={() => openOrder(order)}
                />
              ))
            )}

            <Text className={sectionTitleClassName}>Completed Orders</Text>
            {completedOrders.length === 0 ? (
              <View className="mb-4 rounded-xl border border-blue-200 p-4">
                <Text className="text-base text-slate-700">No completed orders.</Text>
              </View>
            ) : (
              completedOrders.map((order, index) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  isCompleted={true}
                  sequenceNumber={index + 1}
                  onPress={() => openOrder(order)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
