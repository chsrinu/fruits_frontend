import React from "react";
import { ActivityIndicator, Pressable, PressableProps } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { colors, cx, ui } from "@/app/theme/designSystem";

type AppButtonVariant = "primary" | "secondary" | "outline" | "danger";
type AppButtonSize = "sm" | "md" | "lg";

const sizeClassName: Record<AppButtonSize, string> = {
  sm: "min-h-[40px] px-3",
  md: "min-h-[48px] px-4",
  lg: "min-h-[56px] px-5",
};

const variantClassName: Record<
  AppButtonVariant,
  { idle: string; text: "buttonPrimary" | "buttonSecondary" | "buttonOutline"; loader: string }
> = {
  primary: {
    idle: ui.buttonPrimary,
    text: "buttonPrimary",
    loader: colors.primaryForeground,
  },
  secondary: {
    idle: ui.buttonSecondary,
    text: "buttonSecondary",
    loader: colors.secondaryForeground,
  },
  outline: {
    idle: ui.buttonOutline,
    text: "buttonOutline",
    loader: colors.primary,
  },
  danger: {
    idle: "bg-brand-danger",
    text: "buttonPrimary",
    loader: colors.primaryForeground,
  },
};

type AppButtonProps = PressableProps & {
  label: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
  textClassName?: string;
  loading?: boolean;
};

export function AppButton({
  label,
  variant = "primary",
  size = "md",
  className,
  textClassName,
  disabled,
  loading = false,
  ...props
}: AppButtonProps) {
  const variantConfig = variantClassName[variant];
  const getPressedTextClassName = () => {
    if (variant === "primary") return "text-brand-primary";
    if (variant === "secondary") return "text-brand-secondary";
    if (variant === "danger") return "text-brand-danger";
    return "text-brand-primary-foreground";
  };
  const getPressedBackgroundColor = () => {
    if (variant === "primary") return colors.primaryForeground;
    if (variant === "secondary") return colors.secondaryForeground;
    if (variant === "danger") return colors.primaryForeground;
    return colors.primary;
  };
  const getPressedBorderColor = () => {
    if (variant === "secondary") return colors.secondary;
    if (variant === "danger") return colors.danger;
    return colors.primary;
  };

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      className={cx(ui.buttonBase, "border border-transparent", sizeClassName[size], variantConfig.idle, disabled || loading ? "opacity-60" : "", className)}
      style={({ pressed }) => ({
        backgroundColor: pressed && !disabled && !loading ? getPressedBackgroundColor() : undefined,
        borderColor: pressed && !disabled && !loading ? getPressedBorderColor() : "transparent",
        transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }],
      })}
    >
      {({ pressed }) =>
        loading ? (
          <ActivityIndicator color={variantConfig.loader} />
        ) : (
          <AppText
            variant={variantConfig.text}
            className={cx(pressed && !disabled ? getPressedTextClassName() : "", textClassName)}
          >
            {label}
          </AppText>
        )
      }
    </Pressable>
  );
}
