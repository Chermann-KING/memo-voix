import { publicProcedure, router } from "../../trpc";
import { z } from "zod";

// Stockage en mémoire des paramètres utilisateur
const userSettings: {
  userId: string;
  language: string;
  autoTranscribe: boolean;
  defaultFolderId?: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
}[] = [];

export const settingsRouter = router({
  getSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const settings = userSettings.find((s) => s.userId === input.userId);
      if (!settings) {
        // Retourner les paramètres par défaut si aucun n'est trouvé
        return {
          language: "fr",
          autoTranscribe: true,
          theme: "system",
          notifications: true,
        };
      }
      return settings;
    }),

  updateSettings: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        language: z.string().optional(),
        autoTranscribe: z.boolean().optional(),
        defaultFolderId: z.string().optional(),
        theme: z.enum(["light", "dark", "system"]).optional(),
        notifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...updates } = input;
      const index = userSettings.findIndex((s) => s.userId === userId);

      if (index === -1) {
        // Créer de nouveaux paramètres si l'utilisateur n'en a pas
        const newSettings = {
          userId,
          language: updates.language || "fr",
          autoTranscribe: updates.autoTranscribe ?? true,
          theme: updates.theme || "system",
          notifications: updates.notifications ?? true,
          defaultFolderId: updates.defaultFolderId,
        };
        userSettings.push(newSettings);
        return { success: true, settings: newSettings };
      }

      // Mettre à jour les paramètres existants
      userSettings[index] = {
        ...userSettings[index],
        ...updates,
      };
      return { success: true, settings: userSettings[index] };
    }),

  resetSettings: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const index = userSettings.findIndex((s) => s.userId === input.userId);
      if (index !== -1) {
        userSettings.splice(index, 1);
      }
      return { success: true };
    }),
});
