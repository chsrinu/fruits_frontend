import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "@/components/ui/AppText";
import { cx } from "@/app/theme/designSystem";

type BackButtonProps = {
  hidden?: boolean;
  onPress?: () => void;
  className?: string;
  colorClassName?: string;
  fallbackPath?: string;
};

export function BackButton({
  hidden = false,
  onPress,
  className = "px-1 py-1",
  colorClassName = "text-brand-primary",
  fallbackPath = "/home",
}: BackButtonProps) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackPath as any);
  };

  if (hidden) {
    return (
      <View className={className}>
        <AppText className={cx("text-2xl text-transparent", colorClassName)}>←</AppText>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      className={className}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <AppText className={cx("text-2xl", colorClassName)}>←</AppText>
    </Pressable>
  );
}
