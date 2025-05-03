import { router, publicProcedure } from "../../trpc";
import { z } from "zod";

// Tableau en mémoire pour stocker les commentaires
const comments: {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
}[] = [];

export const commentRouter = router({
  // Créer un nouveau commentaire
  create: publicProcedure
    .input(
      z.object({
        content: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const newComment = {
        id: Math.random().toString(36).substring(7),
        content: input.content,
        userId: input.userId,
        createdAt: new Date(),
      };
      comments.push(newComment);
      return { success: true, comment: newComment };
    }),

  // Récupérer tous les commentaires
  getAll: publicProcedure.query(async () => {
    return { comments };
  }),

  // Récupérer un commentaire par son ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const comment = comments.find((c) => c.id === input.id);
      if (!comment) {
        throw new Error("Commentaire non trouvé");
      }
      return { comment };
    }),

  // Mettre à jour un commentaire
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const index = comments.findIndex((c) => c.id === input.id);
      if (index === -1) {
        throw new Error("Commentaire non trouvé");
      }
      comments[index] = {
        ...comments[index],
        content: input.content,
      };
      return { success: true, comment: comments[index] };
    }),

  // Supprimer un commentaire
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const index = comments.findIndex((c) => c.id === input.id);
      if (index === -1) {
        throw new Error("Commentaire non trouvé");
      }
      comments.splice(index, 1);
      return { success: true };
    }),
});
