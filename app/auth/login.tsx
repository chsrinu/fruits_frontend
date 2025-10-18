// app/auth/login.tsx
import { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { sendOtp } from '../api/user';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

export default function LoginScreen() {
    const [mobile, setMobile] = useState('');
    const router = useRouter();
    const setToken = useAuthStore((s) => s.setToken);
    const clearToken = useAuthStore((s) => s.clearToken);
    const token = useAuthStore((s) => s.token);

    // 🔒 Validate token expiry on mount
    if (token) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            if (isExpired) {
                clearToken();
            } else {
                router.replace('/'); // If token is valid, go to home
            }
        } catch (err) {
            console.warn('Invalid token, clearing');
            clearToken();
        }
    }

    const { mutate, isPending } = useMutation({
        mutationFn: () => sendOtp(mobile),
        onSuccess: () => {
            router.replace({
                pathname: "/auth/otp",
                params: { mobile },
            });
        },
        onError: (error: any) => {
            console.error('Send OTP Error:', error);

            const errorMessage =
                error?.response?.data?.message || // custom API error
                error?.message || // fallback JS error
                'Failed to send OTP. Please try again.';

            Alert.alert('Error', errorMessage);
        },
    });

    const handleSubmit = () => {
        if (mobile.length !== 10) {
            Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
            return;
        }

        mutate();
    };

    return (
        <View className="flex-1 justify-center p-4 bg-white">
            <Text className="text-2xl mb-4 text-center">Enter your mobile number</Text>
            <TextInput
                className="border border-gray-400 p-3 rounded mb-4"
                keyboardType="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={mobile}
                onChangeText={setMobile}
            />
            <Button title={isPending ? 'Sending OTP...' : 'Send OTP'} onPress={handleSubmit} disabled={isPending} />
        </View>
    );
}
