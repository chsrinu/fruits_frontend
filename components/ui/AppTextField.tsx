import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { cx, ui } from "@/app/theme/designSystem";

type AppTextFieldProps = TextInputProps & {
  className?: string;
};

export function AppTextField({ className, editable = true, ...props }: AppTextFieldProps) {
  return (
    <TextInput
      {...props}
      editable={editable}
      placeholderTextColor="#64748b"
      className={cx(ui.input, !editable && ui.inputDisabled, className)}
    />
  );
}
