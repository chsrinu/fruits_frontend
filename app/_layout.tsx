// app/_layout.tsx
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import GlobalBufferingOverlay from "@/components/GlobalBufferingOverlay";
import 'react-native-reanimated'; // Required by NativeWind

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent />
          <Slot />
          <GlobalBufferingOverlay />
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
