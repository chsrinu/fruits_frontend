// components/AddToCartControl.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import QuantityControl from "@/app/components/QuantityControl";

interface Props {
    quantity: number;
    onAdd: () => void;
    onIncrease: () => void;
    onDecrease: () => void;
}

export default function AddToCartControl({ quantity, onAdd, onIncrease, onDecrease }: Props) {
    if (quantity > 0) {
        return (
            <QuantityControl
                quantity={quantity}
                onIncrease={onIncrease}
                onDecrease={onDecrease}
            />
        );
    }

    return (
        <TouchableOpacity
            onPress={onAdd}
            className="border p-1 rounded mt-2 bg-green-100"
        >
            <Text className="text-center text-sm text-green-700">Add to cart</Text>
        </TouchableOpacity>
    );
}
