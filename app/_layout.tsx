// app/_layout.tsx
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';
import 'react-native-reanimated'; // Required by NativeWind

// Optional fallback component
function LoadingFallback() {
  return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-gray-800">Loading...</Text>
      </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
            <View className="flex-1">
                <Slot />
            </View>
        </QueryClientProvider>
      </SafeAreaProvider>
  );
}
