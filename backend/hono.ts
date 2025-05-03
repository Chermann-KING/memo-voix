// @ts-nocheck
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Create Hono app
const app = new Hono();

// Enable CORS with more permissive settings
app.use(
  "/*",
  cors({
    origin: "*", // Allow all origins
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (c) => {
  console.log("Appel du point de terminaison du bilan de santé");
  return c.text("Le backend fonctionne !");
});

// Mount tRPC handler at /api/trpc
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  })
);

// Export app for use in server.js
export default app;
