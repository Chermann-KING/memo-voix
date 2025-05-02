import { TRPCError } from "@trpc/server";

// Define the context type
export type TRPCContext = {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  req: Request;
  env: {
    OPENAI_API_KEY?: string;
  };
};

/**
 * Creates the context for tRPC procedures
 */
export async function createContext({
  req,
}: {
  req: Request;
}): Promise<TRPCContext> {
  // In a real app, you would validate the user's session/token here
  // For this demo, we'll create a mock user
  const user = {
    id: "1",
    name: "Demo User",
    email: "user@example.com",
  };

  // Get environment variables
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  // Log environment variables for debugging (don't log the actual API key in production)
  console.log("Environment variables available:", {
    OPENAI_API_KEY: env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set",
  });

  return {
    user,
    req,
    env,
  };
}
