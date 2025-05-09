import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import { Platform } from "react-native";

// Get the base URL for the API
const getBaseUrl = () => {
  // For mobile development, use the local IP address
  if (Platform.OS === "android" || Platform.OS === "ios") {
    // Use the local IP address for mobile devices
    return "http://192.168.1.48:3000";
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
        console.log(`Envoi d'une requête tRPC à: ${url}`);
        try {
          const response = await fetch(url, options);

          // Log response status for debugging
          console.log(`Statut de la réponse tRPC: ${response.status}`);

          // Clone the response to log its content without consuming it
          const responseClone = response.clone();
          try {
            const responseData = await responseClone.json();
            console.log("Données de réponse tRPC:", responseData);
          } catch (e) {
            console.log("Impossible d'analyser la réponse tRPC en JSON");
          }

          return response;
        } catch (error) {
          console.error("Erreur de recherche tRPC:", error);
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
