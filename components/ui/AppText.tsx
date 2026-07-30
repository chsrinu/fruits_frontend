import React from "react";
import { Text, TextProps } from "react-native";
import { cx, ui } from "@/app/theme/designSystem";

type AppTextVariant =
  | "title"
  | "hero"
  | "section"
  | "body"
  | "bodyMuted"
  | "caption"
  | "buttonPrimary"
  | "buttonSecondary"
  | "buttonOutline";

const variantClassName: Record<AppTextVariant, string> = {
  title: ui.screenTitle,
  hero: ui.heroTitle,
  section: ui.sectionTitle,
  body: ui.body,
  bodyMuted: ui.bodyMuted,
  caption: ui.caption,
  buttonPrimary: ui.buttonTextPrimary,
  buttonSecondary: ui.buttonTextSecondary,
  buttonOutline: ui.buttonTextOutline,
};

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  className?: string;
};

export function AppText({
  variant = "body",
  className,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text {...props} className={cx(variantClassName[variant], className)}>
      {children}
    </Text>
  );
}
