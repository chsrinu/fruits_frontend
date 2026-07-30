// components/AddToCartControl.tsx
import React from 'react';
import QuantityControl from "@/components/QuantityControl";
import { AppButton } from "@/components/ui/AppButton";

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
        <AppButton
            onPress={onAdd}
            label="Add to cart"
            variant="primary"
            size="sm"
            className="mt-2"
            textClassName="text-sm"
        />
    );
}
