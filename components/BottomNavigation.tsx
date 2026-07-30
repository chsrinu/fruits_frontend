import React from "react";
import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@/components/ui/AppText";
import { ui } from "@/app/theme/designSystem";

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const activeTab =
    pathname.startsWith("/home")
      ? "home"
      : pathname.startsWith("/wallet")
      ? "wallet"
      : pathname.startsWith("/profile")
      ? "profile"
      : pathname.startsWith("/order")
            ? "orders"
            : "";

  const tabClass = (tab: string) =>
    activeTab === tab ? ui.navActiveText : ui.navText;
  const tabContainerClass = (tab: string) =>
    `items-center rounded-lg px-3 py-1 ${activeTab === tab ? ui.navActive : ""}`;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 w-full flex-row justify-around border-t border-brand-border bg-white px-2 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <Pressable hitSlop={8} onPress={() => router.replace("/home")} className={tabContainerClass("home")} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <AppText className="text-xl">🏠</AppText>
        <AppText variant="caption" className={tabClass("home")}>Home</AppText>
      </Pressable>

      <Pressable hitSlop={8} onPress={() => router.push("/profile" as any)} className={tabContainerClass("profile")} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <AppText className="text-xl">👤</AppText>
        <AppText variant="caption" className={tabClass("profile")}>Profile</AppText>
      </Pressable>

      <Pressable hitSlop={8} onPress={() => router.push("/wallet" as any)} className={tabContainerClass("wallet")} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <AppText className="text-xl">💰</AppText>
        <AppText variant="caption" className={tabClass("wallet")}>Wallet</AppText>
      </Pressable>

      <Pressable hitSlop={8} onPress={() => router.push("/order" as any)} className={tabContainerClass("orders")} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <AppText className="text-xl">📦</AppText>
        <AppText variant="caption" className={tabClass("orders")}>Orders</AppText>
      </Pressable>
    </View>
  );
}
