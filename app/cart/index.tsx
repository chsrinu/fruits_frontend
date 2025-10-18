import {
    View,
    Text,
    Image,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
} from 'react-native';
import { useCartStore } from '@/app/stores/cartStore';
import QuantityControl from "@/app/components/QuantityControl";
import React from "react";

export default function CartScreen() {
    const items = useCartStore((s) => s.items);
    console.log("sreeni", items)
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const subtotal = items.reduce(
        (total, item) => total + item.pricePerUnit * item.quantity,
        0
    );

    const renderItem = ({ item }) => (
        <View className="flex-row items-center justify-between p-2 border-b">
            {/* Product Image */}
            <Image
                source={{ uri: item.productImageUrlPath }}
                className="w-20 h-20 rounded border"
                resizeMode="contain"
            />

            {/* Product Details and Controls */}
            <View className="flex-1 ml-3">
                <Text className="text-base font-semibold">{item.productName}</Text>

                <View className="flex-row justify-between items-center mt-2">
                    {/* Price */}
                    <Text className="text-sm text-gray-800 font-bold">₹{item.pricePerUnit.toFixed(2)} / {item.displayUnits}</Text>

                    {/* Quantity Control */}
                    <QuantityControl
                        quantity={item.quantity}
                        onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                        onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                    />
                </View>
            </View>
        </View>

    );

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-4">Shopping Cart</Text>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.productId.toString()}
                showsVerticalScrollIndicator={false}
            />

            <View className="border-t pt-4 mt-4">
                <View className="flex-row justify-between mb-4">
                    <Text className="text-lg font-bold">Subtotal</Text>
                    <Text className="text-lg font-bold">₹{subtotal}</Text>
                </View>

                <TouchableOpacity className="bg-orange-500 py-3 rounded">
                    <Text className="text-white text-center text-lg font-semibold">Checkout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
