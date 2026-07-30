import {
    View,
    Image,
    FlatList,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CartItem, useCartStore } from '@/app/stores/cartStore';
import QuantityControl from "@/components/QuantityControl";
import { ScreenHeader } from "@/components/ScreenHeader";
import React from "react";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";

export default function CartScreen() {
    const items = useCartStore((s) => s.items);
    const router = useRouter();
    const updateQuantity = useCartStore((s) => s.updateQuantity);
    const hasItems = items.length > 0;
    const subtotal = items.reduce(
        (total, item) => total + item.pricePerUnit * item.quantity,
        0
    );

    const handleCheckout = async () => {
        try {
            router.push({
                pathname: "/order/confirm",
                params: {
                    subtotal: subtotal,
                }
            });
        } catch (error) {
            console.log("Checkout error:", error);
        }
    };

    // const handleCheckout = async () => {
    //     try {
    //         const totalAmount = subtotal;

    //         // Call your API using axios wrapper
    //         const response = await initiatePayment({
    //             amount: totalAmount,
    //             orderId: "TOPUP_" + Date.now()
    //         });

    //         // Axios returns JSON directly under response.data
    //         const data = response.data;
    //         console.log("Razorpay order Initiated:", data);

    //         // Navigate to Payment WebView screen
    //         router.push({
    //             pathname: "/payment/webview",
    //             params: {
    //                 orderId: data.orderId,
    //                 amount: data.amount
    //             }
    //         });


    //     } catch (error) {
    //         console.log("Checkout error:", error);
    //     }
    // };


    const renderItem = ({ item }: { item: CartItem }) => (
        <View className="flex-row items-center justify-between p-2 border-b">
            {/* Product Image */}
            <Image
                source={{ uri: item.productImageUrlPath }}
                className="w-20 h-20 rounded border"
                resizeMode="contain"
            />

            {/* Product Details and Controls */}
            <View className="flex-1 ml-3">
                <AppText className="text-base font-semibold text-black">{item.productName}</AppText>

                <View className="flex-row justify-between items-center mt-2">
                    {/* Price */}
                    <AppText className="text-sm font-normal text-black">₹{item.pricePerUnit.toFixed(2)} / {item.displayUnits}</AppText>

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

    if (!hasItems) {
        return (
            <SafeAreaProvider>
                <SafeAreaView className="flex-1 bg-white p-4">
                    <ScreenHeader title="Shopping Cart" />
                    <View className="flex-1 items-center justify-center px-4">
                        <AppText variant="title" className="mb-2 text-center">Your cart is empty</AppText>
                        <AppText variant="bodyMuted" className="mb-6 text-center">
                            Add some fresh items to continue shopping.
                        </AppText>
                        <AppButton
                            onPress={() => router.replace("/home")}
                            label="Go Back Home"
                            className="w-full"
                        />
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <ScreenHeader title="Shopping Cart" />
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.productId.toString()}
                showsVerticalScrollIndicator={false}
            />

            <View className="border-t border-brand-border pt-4 mt-4">
                <View className="flex-row justify-between mb-4">
                    <AppText variant="section">Subtotal</AppText>
                    <AppText className="text-base font-semibold text-black">₹{subtotal}</AppText>
                </View>

                <AppButton
                    onPress={handleCheckout}
                    label="Checkout"
                    className="w-full"
                />
            </View>
        </SafeAreaView>
    );
}
