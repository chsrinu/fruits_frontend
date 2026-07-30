import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from "@/components/ui/AppText";
import { colors } from "@/app/theme/designSystem";

interface Props {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    showBorder?: boolean; // optional to toggle border
}

const QuantityControl: React.FC<Props> = ({
    quantity,
    onIncrease,
    onDecrease,
    showBorder = true,
}) => {
    return (
        <View
            className={`mt-2 flex-row items-center justify-between rounded-xl px-3 py-2 ${
                showBorder ? 'border border-brand-primary bg-white' : ''
            }`}
        >
            <Pressable
                onPress={onDecrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="rounded-md px-2 py-1"
                style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.danger : undefined,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                })}
            >
                {({ pressed }) => (
                    <AppText className={`text-lg font-bold ${pressed ? "text-white" : "text-brand-danger"}`}>−</AppText>
                )}
            </Pressable>
            <AppText className="mx-3 text-base font-semibold text-brand-text">{quantity}</AppText>
            <Pressable
                onPress={onIncrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="rounded-md px-2 py-1"
                style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.primary : undefined,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                })}
            >
                {({ pressed }) => (
                    <AppText className={`text-lg font-bold ${pressed ? "text-white" : "text-brand-primary"}`}>+</AppText>
                )}
            </Pressable>
        </View>
    );
};

export default QuantityControl;
