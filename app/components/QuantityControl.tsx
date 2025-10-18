import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
            className={`flex-row justify-between items-center mt-2 px-2 py-1 rounded ${
                showBorder ? 'border' : ''
            }`}
        >
            <TouchableOpacity
                onPress={onDecrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text className="text-lg font-bold text-red-600">−</Text>
            </TouchableOpacity>
            <Text className="text-base mx-3">{quantity}</Text>
            <TouchableOpacity
                onPress={onIncrease}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Text className="text-lg font-bold text-green-600">+</Text>
            </TouchableOpacity>
        </View>
    );
};

export default QuantityControl;
