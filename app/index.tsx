// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useNavigationContainerRef } from 'expo-router';
import { useAuthStore } from './stores/authStore';
import {jwtDecode} from 'jwt-decode';
import './globals.css';

interface JwtPayload {
    exp: number;
    [key: string]: any;
}

export default function Index() {
    const token = useAuthStore((s) => s.token);
    const clearToken = useAuthStore((s) => s.clearToken);
    const hasHydrated = useAuthStore.persist.hasHydrated();

    const [checkingAuth, setCheckingAuth] = useState(true);

    // Wait until hydration + router are ready
    useEffect(() => {
        if (!hasHydrated) return;

        const timeout = setTimeout(() => {
            if (token) {
                try {
                    const decoded = jwtDecode<JwtPayload>(token);
                    const isExpired = decoded.exp * 1000 < Date.now();

                    if (isExpired) {
                        clearToken();
                        router.replace('/auth/login' as const);
                    } else {
                        router.replace('/home' as const);
                    }
                } catch (err) {
                    clearToken();
                    router.replace('/auth/login' as const);
                }
            } else {
                router.replace('/auth/login' as const);
            }

            setCheckingAuth(false);
        }, 100); // Slight delay to ensure Slot is mounted

        return () => clearTimeout(timeout);
    }, [hasHydrated]);

    if (checkingAuth || !hasHydrated) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="mt-4 text-lg">Checking login status...</Text>
            </View>
        );
    }

    return null;
}
