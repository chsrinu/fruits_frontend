import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";
import { createOrder } from "../api/order";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import { useUserStore } from "../stores/userStore";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { ui } from "@/app/theme/designSystem";

export default function Success() {
    const router = useRouter();
    const hasSubmittedRef = React.useRef(false);
    const storeCartId = useCartStore((s) => s.cartId);
    const clearCart = useCartStore((s) => s.clearCart);
    const upsertOrder = useOrderStore((s) => s.upsertOrder);
    const selectOrder = useOrderStore((s) => s.selectOrder);
    const markHistoryForRefresh = useOrderStore((s) => s.markHistoryForRefresh);
    const fallbackDeliveryAddressId = useUserStore((s) => s.user?.address?.id);
    const { cartId, deliveryAddressId, orderId } = useLocalSearchParams();
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(true);
    const [orderCreated, setOrderCreated] = React.useState(false);

    useEffect(() => {
        if (hasSubmittedRef.current) return;
        hasSubmittedRef.current = true;

        let timeout: ReturnType<typeof setTimeout> | undefined;

        const pickParam = (value: string | string[] | undefined) =>
            Array.isArray(value) ? value[0] : value;

        const resolvedCartId = String(pickParam(cartId) || storeCartId || pickParam(orderId) || "");
        const resolvedDeliveryAddressId = Number(
            pickParam(deliveryAddressId) || fallbackDeliveryAddressId || 0
        );

        const submitOrder = async () => {
            if (!resolvedCartId || !resolvedDeliveryAddressId) {
                setError("Missing cart or address information to create the order.");
                setIsSubmitting(false);
                return;
            }

            try {
                const response = await createOrder({
                    cartId: resolvedCartId,
                    deliveryAddressId: resolvedDeliveryAddressId,
                });

                const details = response.data.orderDetails;
                upsertOrder(details);
                selectOrder(details.orderId, details);
                markHistoryForRefresh();
                clearCart();
                setOrderCreated(true);
                setIsSubmitting(false);

                timeout = setTimeout(() => {
                    router.replace({
                        pathname: "/order/details",
                        params: {
                            orderId: String(details.orderId ?? ""),
                            source: "success",
                        },
                    });
                }, 2000);
            } catch (err: any) {
                const backendMessage =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message;

                console.error("createOrder failed", {
                    message: err?.message,
                    status: err?.response?.status,
                    data: err?.response?.data,
                });

                setError(
                    backendMessage
                        ? `Unable to create order: ${backendMessage}`
                        : "Unable to create order. Please try again."
                );
                setIsSubmitting(false);
            }
        };

        submitOrder();

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    return (
        <View className={`${ui.screen} items-center justify-center px-6`}>
            {error ? (
                <>
                    <AppText variant="title" className="mb-2 text-center text-brand-danger">Order creation failed</AppText>
                    <AppText variant="bodyMuted" className="mb-4 text-center">{error}</AppText>
                    <AppButton
                        onPress={() => router.replace("/home")}
                        label="Go to Home"
                    />
                </>
            ) : (
                <>
                    <AppText variant="title" className="text-center">Order Successfully Created!</AppText>
                    <AppText variant="bodyMuted" className="mt-2 text-center">
                        {isSubmitting ? "Creating your order..." : orderCreated ? "Redirecting to order details..." : "Redirecting..."}
                    </AppText>
                </>
            )}
        </View>
    );
}
