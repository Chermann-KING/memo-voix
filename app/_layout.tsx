import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import { Platform } from 'react-native';

// Get the base URL for the API
const getBaseUrl = () => {
  // For mobile development, use the local IP address
  if (Platform.OS === 'android') {
    // Use 10.0.2.2 for Android emulator (points to host's localhost)
    return 'http://10.0.2.2:3000';
  }
  
  if (Platform.OS === 'ios') {
    // Use localhost for iOS simulator
    return 'http://localhost:3000';
  }
  
  // For web development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // For production
  return '';
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Create a React Query client with better error logging
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        onError: (error) => {
          console.error('React Query error:', error);
        },
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error('React Query mutation error:', error);
        },
      },
    },
  }));
  
  // Create a tRPC client
  const [trpcClient] = useState(() => 
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // Add fetch options to help with debugging
          fetch: async (url, options) => {
            console.log(`Making request to: ${url}`);
            try {
              const response = await fetch(url, options);
              return response;
            } catch (error) {
              console.error('tRPC fetch error:', error);
              throw error;
            }
          },
        }),
      ],
    })
  );
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}