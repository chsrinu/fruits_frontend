import React, { useEffect, useMemo, useState } from "react";
import { Image, RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "@/components/BackButton";
import { useOrderStore } from "@/app/stores/orderStore";
import { useProductStore } from "@/app/stores/productStore";
import { useComplaintStore } from "@/app/stores/complaintStore";
import { ComplaintResponse } from "@/app/api/complaint";
import { AppButton } from "@/components/ui/AppButton";

const getComplaintItemNames = (complaint: ComplaintResponse, orderItems: { id: number; productName: string }[]) => {
  const names = new Set<string>();
  const details = complaint.complaintDetails || [];
  details.forEach((detail) => {
    const match = orderItems.find((item) => item.id === detail.orderItemId);
    names.add(match?.productName || `Item ${detail.orderItemId}`);
  });
  return Array.from(names).join(", ");
};

export default function OrderHelpScreen() {
  const router = useRouter();
  const { orderId, mode, doubleBack } = useLocalSearchParams();
  const resolvedOrderId = String(orderId || "");
  const resolvedMode = String(mode || "");
  const shouldDoubleBack = String(doubleBack || "") === "1";
  const selectedOrderId = useOrderStore((s) => s.selectedOrderId);
  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  //const clearComplaints = useComplaintStore((s) => s.clearAll);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const getProductImageUrlByName = useProductStore((s) => s.getProductImageUrlByName);
  const complaintsByOrderId = useComplaintStore((s) => s.complaintsByOrderId);
  const syncComplaintsByOrderId = useComplaintStore((s) => s.syncComplaintsByOrderId);
  const isSyncingByOrderId = useComplaintStore((s) => s.isSyncingByOrderId);
  const [selectedProductsMap, setSelectedProductsMap] = useState<Record<number, boolean>>({});
  const activeOrderId = resolvedOrderId || selectedOrderId || selectedOrder?.orderId || "";
  const order = activeOrderId
    ? selectedOrder?.orderId === activeOrderId
      ? selectedOrder
      : getOrderById(activeOrderId)
    : null;
  const complaints = complaintsByOrderId[activeOrderId] || [];
  const isRefreshing = !!isSyncingByOrderId[activeOrderId];
  const shouldShowComplaintList = complaints.length > 0 && resolvedMode !== "raise";

  useEffect(() => {
    if (!activeOrderId || !order || resolvedMode === "raise") return;
    syncComplaintsByOrderId(activeOrderId);
  }, [activeOrderId, order?.orderId, resolvedMode, syncComplaintsByOrderId]);

  const toggleItem = (productId: number) => {
    setSelectedProductsMap((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = true;
      }
      return next;
    });
  };

  const selectedProductIds = useMemo(
    () => Object.keys(selectedProductsMap).map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
    [selectedProductsMap]
  );

  const handleContinue = () => {
    if (!order || selectedProductIds.length === 0) return;
    //clearComplaints();
    router.push({
      pathname: "/help/order/raise",
      params: {
        orderId: order.orderId,
        productIds: selectedProductIds.join(","),
      },
    });
  };

  const handleRefreshComplaints = () => {
    if (!activeOrderId || !order) return;
    syncComplaintsByOrderId(activeOrderId);
  };

  const handleBack = () => {
    if (shouldDoubleBack) {
      if (router.canGoBack()) {
        router.back();
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          }
        }, 0);
        return;
      }
      router.replace("/home");
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
  };

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white p-5">
        <View className="mb-6 flex-row items-center justify-between">
          <BackButton className="px-1 py-1" onPress={handleBack} />
          <Text className="text-2xl font-bold">Select Items for Complaint</Text>
          <View className="w-6" />
        </View>
        <Text className="text-base text-gray-700">Order not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="mb-2 px-5 pt-3 flex-row items-center justify-between">
        <BackButton className="px-1 py-1" onPress={handleBack} />
        <Text className="text-2xl font-bold">{shouldShowComplaintList ? "Your Complaints" : "Select Items for Complaint"}</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-28"
        refreshControl={
          shouldShowComplaintList ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefreshComplaints} />
          ) : undefined
        }
      >
        {shouldShowComplaintList ? (
          <>
            <Text className="mb-4 text-base text-slate-700">You have {complaints.length} complaint raised.</Text>
            {complaints.map((complaint) => (
              <TouchableOpacity
                key={String(complaint.complaintId)}
                onPress={() =>
                  router.push({
                    pathname: "/help/order/complaint-details",
                    params: { orderId: activeOrderId, complaintId: String(complaint.complaintId) },
                  })
                }
                className="mb-4 rounded-xl border border-gray-200 p-4"
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-2xl font-semibold">Complaint #{complaint.complaintId}</Text>
                  <Text className="text-2xl text-slate-800">{new Date(complaint.createdAt).toLocaleDateString("en-IN")}</Text>
                </View>
                <Text className="text-base text-slate-700 mb-1">Items: {getComplaintItemNames(complaint, order.orderItems)}</Text>
                <Text className="text-base text-slate-700">
                  Status: <Text className="font-semibold">{complaint.complaintStatusDisplay || complaint.complaintStatus}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Text className="mb-4 text-xl font-semibold text-slate-900">Your Order Items</Text>
            {order.orderItems.map((item) => {
              const checked = !!selectedProductsMap[item.productId];
              const imageUrl = getProductImageUrlByName(item.productName);
              return (
                <TouchableOpacity
                  key={`${item.productId}-${item.id}`}
                  onPress={() => toggleItem(item.productId)}
                  activeOpacity={1}
                  className={`mb-3 flex-row items-center rounded-xl border p-3 ${
                    checked ? "border-slate-900 bg-slate-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <View className={`mr-3 h-6 w-6 rounded border items-center justify-center ${checked ? "bg-black border-black" : "border-gray-500"}`}>
                    {checked ? <Text className="text-xs text-white">✓</Text> : null}
                  </View>
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100 overflow-hidden">
                    {imageUrl ? <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-3xl font-semibold text-slate-900">{item.productName}</Text>
                    <Text className="text-base text-slate-700">Qty: {item.quantity}</Text>
                  </View>
                  <Text className="text-2xl text-slate-900">₹{item.pricePerUnit}/kg</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-5 py-4">
        <AppButton
          onPress={
            shouldShowComplaintList
              ? () => router.replace({ pathname: "/help/order", params: { orderId: activeOrderId, mode: "raise" } })
              : handleContinue
          }
          disabled={shouldShowComplaintList ? false : selectedProductIds.length === 0}
          label={shouldShowComplaintList ? "Raise Another Complaint" : "Continue"}
          className="rounded-xl"
        />
      </View>
    </SafeAreaView>
  );
}
