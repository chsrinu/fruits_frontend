import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useNetworkStore } from "@/app/stores/networkStore";
import { AppText } from "@/components/ui/AppText";
import { ui } from "@/app/theme/designSystem";

export default function GlobalBufferingOverlay() {
  const activeRequests = useNetworkStore((state) => state.activeRequests);

  if (activeRequests <= 0) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/25">
      <View className={ui.overlayCard}>
        <ActivityIndicator size="large" color="#166534" />
        <AppText variant="caption" className={ui.loadingText}>
          Buffering...
        </AppText>
      </View>
    </View>
  );
}
