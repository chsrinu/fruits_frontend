import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { buildPaymentUrl } from "../api/paymentgateway";
import { AppButton } from "@/components/ui/AppButton";

const extractQueryParams = (url: string) => {
    const query = url.split("?")[1] || "";
    const pairs = query.split("&").filter(Boolean);
    const result: Record<string, string> = {};

    for (const pair of pairs) {
        const [key, ...rest] = pair.split("=");
        if (!key) continue;
        result[decodeURIComponent(key)] = decodeURIComponent(rest.join("=") || "");
    }

    return result;
};

export default function PaymentWebView() {
    const router = useRouter();
    const { orderId, amount, subtotal, cartId, deliveryAddressId, flow, topupRequestId } = useLocalSearchParams();
    console.log("webview ", cartId, deliveryAddressId);
    const webViewRef = useRef<WebView>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handlePaymentRedirect = useCallback(
        (url: string) => {
            const normalizedUrl = url.toLowerCase();

            const isSuccess =
                normalizedUrl.includes("payment-success") ||
                normalizedUrl.includes("/payment/success");
            const isFailure =
                normalizedUrl.includes("payment-failure") ||
                normalizedUrl.includes("payment-cancelled") ||
                normalizedUrl.includes("/payment/failed");

            if (isSuccess) {
                const params = extractQueryParams(url);
                const isWalletTopUp = String(flow || "") === "wallet-topup";
                if (isWalletTopUp) {
                    router.replace({
                        pathname: "/payment/wallet",
                        params: {
                            subtotal: String(subtotal ?? ""),
                            cartId: String(cartId ?? ""),
                            deliveryAddressId: String(deliveryAddressId ?? ""),
                            topupStatus: "success",
                            topupRequestId: String(topupRequestId ?? ""),
                            paymentId: String(params.paymentId || ""),
                        },
                    });
                    return true;
                }

                router.replace({
                    pathname: "/payment/success",
                    params: {
                        orderId: params.orderId || (orderId as string) || "",
                        paymentId: params.paymentId || "",
                        signature: params.signature || "",
                        amount: String(amount ?? ""),
                        cartId: String(cartId ?? ""),
                        deliveryAddressId: String(deliveryAddressId ?? ""),
                    },
                });
                return true;
            }

            if (isFailure) {
                router.replace({
                    pathname: "/payment/failed",
                    params: {
                        orderId: String(orderId ?? ""),
                        amount: String(amount ?? ""),
                        subtotal: String(subtotal ?? amount ?? ""),
                        cartId: String(cartId ?? ""),
                        deliveryAddressId: String(deliveryAddressId ?? ""),
                        flow: String(flow ?? ""),
                        topupRequestId: String(topupRequestId ?? ""),
                    },
                });
                return true;
            }

            return false;
        },
        [amount, cartId, deliveryAddressId, flow, orderId, router, subtotal, topupRequestId]
    );

    const paymentUrl = buildPaymentUrl(orderId as string, Number(amount));

    return (
        <View className="flex-1 bg-white">
            {!errorMessage ? (
                <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    javaScriptEnabled={true}
                    javaScriptCanOpenWindowsAutomatically={true}
                    domStorageEnabled={true}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    setSupportMultipleWindows={false}
                    originWhitelist={["*"]}
                    onLoadStart={() => {
                        setIsLoading(true);
                        setErrorMessage(null);
                    }}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(event) => {
                        setIsLoading(false);
                        setErrorMessage(event.nativeEvent.description || "Unable to load payment page.");
                    }}
                    onHttpError={(event) => {
                        setIsLoading(false);
                        setErrorMessage(`Payment page failed to load (HTTP ${event.nativeEvent.statusCode}).`);
                    }}
                    onShouldStartLoadWithRequest={(request) => {
                        if (handlePaymentRedirect(request.url)) {
                            return false;
                        }
                        if (request.url.toLowerCase().startsWith("fruitsfrontend://")) {
                            return false;
                        }
                        return true;
                    }}
                />
            ) : (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-base text-gray-700 text-center mb-4">
                        {errorMessage}
                    </Text>
                    <AppButton
                        className="rounded-lg"
                        onPress={() => {
                            setErrorMessage(null);
                            setIsLoading(true);
                            webViewRef.current?.reload();
                        }}
                        label="Try Again"
                    />
                </View>
            )}

            {isLoading && !errorMessage ? (
                <View className="absolute inset-0 items-center justify-center bg-white/80">
                    <ActivityIndicator size="large" color="#111827" />
                    <Text className="mt-3 text-gray-600">Loading secure payment...</Text>
                </View>
            ) : null}
        </View>
    );
}
