import { router, publicProcedure } from "../../trpc";
import { z } from "zod";

// Tableau en mémoire pour stocker les utilisateurs
const users: { username: string; password: string }[] = [];
let currentUser: string | null = null;

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(
      async ({ input }: { input: { username: string; password: string } }) => {
        const { username, password } = input;
        // Vérifie si l'utilisateur existe déjà
        if (users.find((u) => u.username === username)) {
          return { success: false, message: "Nom d'utilisateur déjà utilisé" };
        }
        users.push({ username, password });
        currentUser = username;
        return { success: true, message: "Utilisateur inscrit avec succès" };
      }
    ),
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(
      async ({ input }: { input: { username: string; password: string } }) => {
        const { username, password } = input;
        const user = users.find(
          (u) => u.username === username && u.password === password
        );
        if (!user) {
          return { success: false, message: "Identifiants invalides" };
        }
        currentUser = username;
        return { success: true, message: "Connexion réussie" };
      }
    ),
  logout: publicProcedure.mutation(async () => {
    currentUser = null;
    return { success: true, message: "Déconnexion réussie" };
  }),
  getUser: publicProcedure.query(async () => {
    if (!currentUser) {
      return { username: null };
    }
    return { username: currentUser };
  }),
});
