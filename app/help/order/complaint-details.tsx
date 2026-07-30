import React, { useMemo } from "react";
import { Image, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BackButton } from "@/components/BackButton";
import { useComplaintStore } from "@/app/stores/complaintStore";
import { useOrderStore } from "@/app/stores/orderStore";

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getComplaintTitle = (reasons: string[]) => {
  if (reasons.length === 0) return "Complaint Details";
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return reasons.join(" & ");
  return `${reasons[0]} +${reasons.length - 1} more`;
};

export default function ComplaintDetailsScreen() {
  const { orderId, complaintId } = useLocalSearchParams();
  const resolvedOrderId = String(orderId || "");
  const resolvedComplaintId = String(complaintId || "");
  const complaintsByOrderId = useComplaintStore((s) => s.complaintsByOrderId);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const order = getOrderById(resolvedOrderId);

  const complaint = useMemo(
    () => (complaintsByOrderId[resolvedOrderId] || []).find((item) => String(item.complaintId) === resolvedComplaintId),
    [complaintsByOrderId, resolvedComplaintId, resolvedOrderId]
  );
  const complaintDetails = complaint?.complaintDetails || [];
  const groupedItemDetails = useMemo(() => {
    const grouped = new Map<number, { itemId: number; itemName: string; reasons: Set<string>; imageUrls: Set<string> }>();

    complaintDetails.forEach((detail) => {
      const itemId = detail.orderItemId;
      const itemName =
        order?.orderItems.find((item) => item.id === itemId)?.productName || `Item ${itemId}`;
      const existing = grouped.get(itemId) || {
        itemId,
        itemName,
        reasons: new Set<string>(),
        imageUrls: new Set<string>(),
      };

      existing.reasons.add(detail.reasonDisplay || detail.reason);
      (detail.imageProofs || []).forEach((url) => {
        if (url) existing.imageUrls.add(url);
      });

      grouped.set(itemId, existing);
    });

    return Array.from(grouped.values());
  }, [complaintDetails, order?.orderItems]);

  const imageUrls = useMemo(
    () => Array.from(new Set(groupedItemDetails.flatMap((item) => Array.from(item.imageUrls)))),
    [groupedItemDetails]
  );
  const complaintReasons = useMemo(
    () =>
      Array.from(
        new Set(
          complaintDetails
            .map((detail) => detail.reasonDisplay || detail.reason)
            .filter(Boolean)
        )
      ),
    [complaintDetails]
  );
  const complaintTitle = useMemo(() => getComplaintTitle(complaintReasons), [complaintReasons]);

  if (!complaint) {
    return (
      <SafeAreaView className="flex-1 bg-white p-5">
        <View className="mb-3 flex-row items-center">
          <BackButton className="mr-2 px-1 py-1" />
          <Text className="text-2xl font-bold">Complaint Details</Text>
        </View>
        <Text className="text-base text-slate-700">Complaint not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-3" contentContainerClassName="pb-8">
        <View className="mb-2 flex-row items-center">
          <BackButton className="mr-2 px-1 py-1" />
          <Text className="flex-1 text-2xl font-bold">{complaintTitle}</Text>
        </View>
        <Text className="mb-3 text-base text-slate-700">Complaint #{complaint.complaintId}</Text>

        <Text className="mb-3 text-2xl font-semibold text-slate-900">
          Status: {complaint.complaintStatusDisplay || complaint.complaintStatus}
        </Text>

        <View className="mb-4 border-t border-gray-200 pt-3">
          <Text className="mb-2 text-2xl font-semibold">Items & Reasons:</Text>
          {groupedItemDetails.map((item) => {
            return (
              <View key={item.itemId} className="mb-2">
                <Text className="text-2xl font-semibold">{item.itemName}</Text>
                <Text className="text-base text-slate-700">{Array.from(item.reasons).join(", ")}</Text>
              </View>
            );
          })}
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-2xl font-semibold">Images:</Text>
          {imageUrls.length > 0 ? (
            <View className="flex-row flex-wrap">
              {imageUrls.map((url, index) => (
                <Image key={`${url}-${index}`} source={{ uri: url }} className="mr-2 mb-2 h-16 w-16 rounded-md bg-gray-100" />
              ))}
            </View>
          ) : (
            <Text className="text-base text-slate-700">No images submitted.</Text>
          )}
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-2xl font-semibold">Summary:</Text>
          <Text className="text-base text-slate-800">{complaint.responderNotes || "No additional summary provided."}</Text>
        </View>

        <Text className="text-base text-slate-700">Raised on: {formatDateTime(complaint.createdAt)}</Text>
        <Text className="text-base text-slate-700">Last updated: {formatDateTime(complaint.updatedAt)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
