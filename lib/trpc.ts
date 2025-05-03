import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import { Platform } from "react-native";

// Get the base URL for the API
const getBaseUrl = () => {
  // For mobile development, use the local IP address
  // On android, use the environment variable if defined, otherwise use the host machine ip
  if (Platform.OS === "android") {
    // Use the actual IP address of the computer for physical Android devices
    return process.env.BACKEND_URL || "http://10.0.2.2:3000";
  }
  if (Platform.OS === "ios") {
    // Use localhost for iOS simulator
    // Use the environment variable if defined, otherwise use localhost
    return process.env.BACKEND_URL || "http://localhost:3000";
  }

  // For web development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // For production
  return "";
};

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create a standalone tRPC client (for use outside of React components)
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      // Add fetch options to help with debugging
      fetch: async (url, options) => {
        console.log(`Making tRPC request to: ${url}`);
        try {
          const response = await fetch(url, options);

          // Log response status for debugging
          console.log(`tRPC response status: ${response.status}`);

          // Clone the response to log its content without consuming it
          const responseClone = response.clone();
          try {
            const responseData = await responseClone.json();
            console.log("tRPC response data:", responseData);
          } catch (e) {
            console.log("Could not parse tRPC response as JSON");
          }

          return response;
        } catch (error) {
          console.error("tRPC fetch error:", error);
          throw error;
        }
      },
    }),
  ],
});

// Export a function to check if the backend is running
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getBaseUrl()}`);
    return response.ok;
  } catch (error) {
    console.error("Backend connection check failed:", error);
    return false;
  }
};
