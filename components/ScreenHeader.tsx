import React from "react";
import { View } from "react-native";
import { BackButton } from "@/components/BackButton";
import { AppText } from "@/components/ui/AppText";
import { cx } from "@/app/theme/designSystem";

type ScreenHeaderProps = {
  title: string;
  titleClassName?: string;
  containerClassName?: string;
};

export function ScreenHeader({
  title,
  titleClassName = "",
  containerClassName = "mb-5",
}: ScreenHeaderProps) {
  return (
    <View className={`flex-row items-center ${containerClassName}`}>
      <BackButton className="px-1 py-1" colorClassName="text-black" />

      <AppText variant="title" className={cx("ml-2 flex-1 text-left", titleClassName)}>
        {title}
      </AppText>
    </View>
  );
}
