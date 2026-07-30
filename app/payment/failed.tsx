import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { ui } from "@/app/theme/designSystem";

export default function Failure() {
    const router = useRouter();
    const { subtotal, cartId, deliveryAddressId, topupRequestId } = useLocalSearchParams();
    const hasWalletRetryContext = Boolean(cartId && deliveryAddressId);

    return (
        <View className={`${ui.screen} items-center justify-center px-6`}>
            <AppText variant="title" className="mb-2 text-center text-brand-danger">Payment Failed</AppText>
            <AppText variant="bodyMuted" className="mb-6 text-center">
                Your payment did not go through. You can retry from wallet payment.
            </AppText>

            {hasWalletRetryContext ? (
                <AppButton
                    className="mb-3 w-full"
                    onPress={() =>
                        router.replace({
                            pathname: "/payment/wallet",
                            params: {
                                subtotal: String(subtotal ?? ""),
                                cartId: String(cartId ?? ""),
                                deliveryAddressId: String(deliveryAddressId ?? ""),
                                topupRequestId: String(topupRequestId ?? ""),
                            },
                        })
                    }
                    label="Retry Payment"
                />
            ) : null}

            <AppButton
                className="w-full"
                variant="outline"
                onPress={() => router.replace("/home")}
                label="Go Home"
            />
        </View>
    );
}
