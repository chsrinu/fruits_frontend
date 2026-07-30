import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton } from "@/components/BackButton";
import { useOrderStore } from "@/app/stores/orderStore";
import { useComplaintStore } from "@/app/stores/complaintStore";
import { CreateComplaintDetailRequest, uploadComplaintImageApi } from "@/app/api/complaint";
import * as ImagePicker from "expo-image-picker";
import { AppButton } from "@/components/ui/AppButton";

const reasonOptions = [
  "Bad Quality / Damaged products",
  "Items missing in order",
  "Refund related",
  "Wrong items delivered",
];

const mapUiReasonToBackendReason = (reason: string): CreateComplaintDetailRequest["reason"] => {
  if (reason === "Bad Quality / Damaged products") return "BadQuality";
  if (reason === "Wrong items delivered") return "WrongItemsDelivered";
  if (reason === "Items missing in order") return "MissingItems";
  if (reason === "Refund related") return "PendingRefund";
  return "BadQuality";
};

const reasonNeedsImage = (reason: string) =>
  reason === "Bad Quality / Damaged products" || reason === "Wrong items delivered";

const getFileNameFromUri = (uri: string) => {
  const parts = uri.split("/");
  return parts[parts.length - 1] || `complaint-${Date.now()}.jpg`;
};

const getMimeTypeFromUri = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
};

export default function RaiseComplaintScreen() {
  const router = useRouter();
  const { orderId, productIds } = useLocalSearchParams();
  const resolvedOrderId = String(orderId || "");
  const selectedProductIds = String(productIds || "")
    .split(",")
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const selectedOrder = useOrderStore((s) => s.selectedOrder);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const order = useMemo(
    () =>
      selectedOrder?.orderId === resolvedOrderId
        ? selectedOrder
        : getOrderById(resolvedOrderId),
    [getOrderById, resolvedOrderId, selectedOrder]
  );
  const selectedItems = useMemo(
    () => (order ? order.orderItems.filter((item) => selectedProductIds.includes(item.productId)) : []),
    [order, selectedProductIds]
  );

  const createComplaint = useComplaintStore((s) => s.createComplaint);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(selectedItems[0]?.id ?? null);
  const [reasonsByItem, setReasonsByItem] = useState<Record<number, string[]>>({});
  const [imageUrlsByItem, setImageUrlsByItem] = useState<Record<number, string[]>>({});
  const [isUploadingByItem, setIsUploadingByItem] = useState<Record<number, boolean>>({});
  const [evidenceSourceByItem, setEvidenceSourceByItem] = useState<Record<number, { camera: boolean; gallery: boolean }>>({});
  const [summary, setSummary] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const toggleReason = (itemId: number, reason: string) => {
    setReasonsByItem((prev) => {
      const existing = prev[itemId] || [];
      const next = existing.includes(reason) ? existing.filter((r) => r !== reason) : [...existing, reason];
      return { ...prev, [itemId]: next };
    });
  };

  const needsEvidence = (itemId: number) => {
    const selectedReasons = reasonsByItem[itemId] || [];
    return (
      selectedReasons.includes("Bad Quality / Damaged products") ||
      selectedReasons.includes("Wrong items delivered")
    );
  };

  const appendUploadedImageUrls = (itemId: number, newUrls: string[]) => {
    if (!newUrls.length) return;
    setImageUrlsByItem((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...newUrls],
    }));
  };

  const removeImageAtIndex = (itemId: number, indexToRemove: number) => {
    setImageUrlsByItem((prev) => {
      const existing = prev[itemId] || [];
      return {
        ...prev,
        [itemId]: existing.filter((_, index) => index !== indexToRemove),
      };
    });
  };

  const uploadAssets = async (itemId: number, assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets.length) return;
    setIsUploadingByItem((prev) => ({ ...prev, [itemId]: true }));
    try {
      const uploadResponses = await Promise.all(
        assets.map((asset) =>
          uploadComplaintImageApi({
            uri: asset.uri,
            name: getFileNameFromUri(asset.uri),
            type: getMimeTypeFromUri(asset.uri),
          })
        )
      );
      appendUploadedImageUrls(
        itemId,
        uploadResponses.map((response) => response.data.url)
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to upload image.";
      Alert.alert("Image Upload Failed", message);
    } finally {
      setIsUploadingByItem((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const openCamera = async (itemId: number) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadAssets(itemId, result.assets as ImagePicker.ImagePickerAsset[]);
      setEvidenceSourceByItem((prev) => ({
        ...prev,
        [itemId]: { camera: true, gallery: prev[itemId]?.gallery || false },
      }));
    }
  };

  const openGallery = async (itemId: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      await uploadAssets(itemId, result.assets as ImagePicker.ImagePickerAsset[]);
      setEvidenceSourceByItem((prev) => ({
        ...prev,
        [itemId]: { camera: prev[itemId]?.camera || false, gallery: true },
      }));
    }
  };

  const isAnyUploadInProgress = Object.values(isUploadingByItem).some(Boolean);
  const hasAnyReasonSelected = selectedItems.some((item) => (reasonsByItem[item.id] || []).length > 0);
  const hasMissingMandatoryEvidence = selectedItems.some((item) => {
    const reasons = reasonsByItem[item.id] || [];
    if (!reasons.length) return false;
    const requiresImageEvidence =
      reasons.includes("Bad Quality / Damaged products") ||
      reasons.includes("Wrong items delivered");
    if (!requiresImageEvidence) return false;
    return (imageUrlsByItem[item.id] || []).length === 0;
  });
  const canSubmit = hasAnyReasonSelected && !hasMissingMandatoryEvidence;

  const handleSubmit = async () => {
    if (!order || !canSubmit) return;

    try {
      await createComplaint({
        userId: null,
        responderId: null,
        orderId: order.orderId,
        complaintStatus: "OPEN",
        complaintDetails: selectedItems.flatMap((item) => {
          const reasons = reasonsByItem[item.id] || [];
          const imageUrls = imageUrlsByItem[item.id] || [];

          return reasons.map((reason) => ({
            orderItemId: item.id,
            complaintDescription: summary.trim(),
            imageProofs: reasonNeedsImage(reason) ? imageUrls : [],
            reason: mapUiReasonToBackendReason(reason),
            quantity: 1,
          }));
        }),
        responderNotes: summary.trim(),
      });

      router.replace({
        pathname: "/help/order",
        params: { orderId: order.orderId, doubleBack: "1" },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to submit complaint right now.";
      Alert.alert("Complaint Submission Failed", message);
    }
  };

  if (!order || selectedItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white p-5">
        <View className="px-1 pt-3 pb-2 flex-row items-center justify-between">
          <BackButton className="px-1 py-1" />
          <Text className="text-2xl font-bold">Raise Complaint</Text>
          <View className="w-6" />
        </View>
        <Text className="text-base text-slate-700">No complaint items selected.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
        <BackButton className="px-1 py-1" />
        <Text className="text-2xl font-bold">Raise Complaint</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
        {selectedItems.map((item) => {
          const expanded = expandedItemId === item.id;
          const showEvidenceActions = needsEvidence(item.id);
          const imageUrls = imageUrlsByItem[item.id] || [];
          const isUploading = !!isUploadingByItem[item.id];
          return (
            <View key={item.id} className="mb-2 rounded-lg border border-gray-200 p-3">
              <TouchableOpacity className="flex-row items-center justify-between" onPress={() => setExpandedItemId(expanded ? null : item.id)}>
                <Text className="text-2xl font-semibold">{item.productName}</Text>
                <Text className="text-2xl text-slate-900">₹{item.pricePerUnit}/kg</Text>
              </TouchableOpacity>

              {expanded ? (
                <View className="mt-3">
                  <Text className="mb-2 text-2xl font-semibold">Select Reason(s):</Text>
                  {reasonOptions.map((reason) => {
                    const checked = (reasonsByItem[item.id] || []).includes(reason);
                    return (
                      <Pressable
                        key={reason}
                        className="mb-2 flex-row items-center rounded-md"
                        onPress={() => toggleReason(item.id, reason)}
                        style={({ pressed }) => (pressed ? { backgroundColor: "#F1F5F9" } : null)}
                      >
                        <View className={`mr-2 h-6 w-6 rounded border items-center justify-center ${checked ? "bg-black border-black" : "border-gray-500"}`}>
                          {checked ? <Text className="text-xs text-white">✓</Text> : null}
                        </View>
                        <Text className="text-base">{reason}</Text>
                      </Pressable>
                    );
                  })}

                  {showEvidenceActions ? (
                    <View className="mt-2 rounded-lg border border-gray-200 p-3">
                      <Text className="mb-2 text-base font-semibold text-slate-900">Attach Image Proof</Text>
                      <View className="mb-3 flex-row items-center justify-between gap-3">
                        <AppButton
                          className="flex-1 rounded-md"
                          onPress={() => openCamera(item.id)}
                          label="Upload Photo"
                          variant="outline"
                          size="sm"
                        />
                        <AppButton
                          className="flex-1 rounded-md"
                          onPress={() => openGallery(item.id)}
                          label="Choose from Gallery"
                          variant="outline"
                          size="sm"
                        />
                      </View>

                      {isUploading ? (
                        <Text className="text-sm text-slate-600">Uploading image...</Text>
                      ) : imageUrls.length ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {imageUrls.map((url, index) => {
                            return (
                              <View key={`${url}-${index}`} className="mr-2">
                                <TouchableOpacity onPress={() => setPreviewImageUrl(url)}>
                                  <Image source={{ uri: url }} className="h-16 w-16 rounded-md bg-gray-100" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => removeImageAtIndex(item.id, index)}
                                  className="absolute right-0 top-0 z-10 h-5 w-5 items-center justify-center rounded-full bg-black"
                                >
                                  <Text className="text-xs font-bold text-white">✕</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </ScrollView>
                      ) : (
                        <Text className="text-sm text-slate-600">No images selected yet.</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        <Text className="mt-4 mb-2 text-2xl font-semibold">Overall Complaint Summary (optional)</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Brief overview of your issue..."
          multiline
          className="rounded-lg border border-gray-300 px-3 py-3 text-base"
        />

        <AppButton
          onPress={handleSubmit}
          disabled={!canSubmit || isAnyUploadInProgress}
          label="Submit Complaint"
          className="mt-5 rounded-xl"
        />
      </ScrollView>

      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View className="flex-1 bg-black/90">
          <View className="items-end p-5 pt-12">
            <TouchableOpacity
              onPress={() => setPreviewImageUrl(null)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              <Text className="text-xl text-white">✕</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 items-center justify-center px-4 pb-8">
            {previewImageUrl ? (
              <Image source={{ uri: previewImageUrl }} className="h-full w-full" resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
