import { router, publicProcedure } from "../../trpc";
import { z } from "zod";

// Tableau en mémoire pour stocker les dossiers
const folders: {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  parentId?: string;
}[] = [];

export const folderRouter = router({
  // Créer un nouveau dossier
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        userId: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const newFolder = {
        id: Math.random().toString(36).substring(7),
        name: input.name,
        userId: input.userId,
        createdAt: new Date(),
        parentId: input.parentId,
      };
      folders.push(newFolder);
      return { success: true, folder: newFolder };
    }),

  // Récupérer tous les dossiers
  getAll: publicProcedure.query(async () => {
    return { folders };
  }),

  // Récupérer un dossier par son ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const folder = folders.find((f) => f.id === input.id);
      if (!folder) {
        throw new Error("Dossier non trouvé");
      }
      return { folder };
    }),

  // Récupérer les dossiers d'un utilisateur
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userFolders = folders.filter((f) => f.userId === input.userId);
      return { folders: userFolders };
    }),

  // Récupérer les sous-dossiers d'un dossier parent
  getByParentId: publicProcedure
    .input(z.object({ parentId: z.string() }))
    .query(async ({ input }) => {
      const subFolders = folders.filter((f) => f.parentId === input.parentId);
      return { folders: subFolders };
    }),

  // Mettre à jour un dossier
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const index = folders.findIndex((f) => f.id === input.id);
      if (index === -1) {
        throw new Error("Dossier non trouvé");
      }
      folders[index] = {
        ...folders[index],
        name: input.name,
        parentId: input.parentId,
      };
      return { success: true, folder: folders[index] };
    }),

  // Supprimer un dossier
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const index = folders.findIndex((f) => f.id === input.id);
      if (index === -1) {
        throw new Error("Dossier non trouvé");
      }
      folders.splice(index, 1);
      return { success: true };
    }),
});
