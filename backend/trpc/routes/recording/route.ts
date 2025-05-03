import { procedure, router } from "../../trpc";
import { z } from "zod";
import OpenAI from "openai";

// Stockage en mémoire (à remplacer par une base de données en production)
const recordings: {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  audioUrl: string;
  transcription?: string;
  createdAt: Date;
  updatedAt: Date;
}[] = [];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const recordingRouter = router({
  createRecording: procedure
    .input(
      z.object({
        userId: z.string(),
        folderId: z.string().optional(),
        title: z.string(),
        audioUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const newRecording = {
        id: Math.random().toString(36).substring(7),
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      recordings.push(newRecording);
      return { success: true, recording: newRecording };
    }),

  getRecordings: procedure
    .input(
      z.object({
        userId: z.string(),
        folderId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const userRecordings = recordings.filter(
        (r) =>
          r.userId === input.userId &&
          (!input.folderId || r.folderId === input.folderId)
      );
      return { recordings: userRecordings };
    }),

  getRecording: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const recording = recordings.find((r) => r.id === input.id);
      if (!recording) {
        throw new Error("Enregistrement non trouvé");
      }
      return { recording };
    }),

  updateRecording: procedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        folderId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const index = recordings.findIndex((r) => r.id === input.id);
      if (index === -1) {
        throw new Error("Enregistrement non trouvé");
      }
      recordings[index] = {
        ...recordings[index],
        ...input,
        updatedAt: new Date(),
      };
      return { success: true, recording: recordings[index] };
    }),

  deleteRecording: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const index = recordings.findIndex((r) => r.id === input.id);
      if (index === -1) {
        throw new Error("Enregistrement non trouvé");
      }
      recordings.splice(index, 1);
      return { success: true };
    }),

  transcribeRecording: procedure
    .input(
      z.object({
        id: z.string(),
        audioFile: z.any(), // Fichier audio à transcrire
      })
    )
    .mutation(async ({ input }) => {
      const recording = recordings.find((r) => r.id === input.id);
      if (!recording) {
        throw new Error("Enregistrement non trouvé");
      }

      try {
        const transcription = await openai.audio.transcriptions.create({
          file: input.audioFile,
          model: "whisper-1",
        });

        const index = recordings.findIndex((r) => r.id === input.id);
        recordings[index] = {
          ...recordings[index],
          transcription: transcription.text,
          updatedAt: new Date(),
        };

        return { success: true, transcription: transcription.text };
      } catch (error) {
        throw new Error("Erreur lors de la transcription");
      }
    }),

  getRecordingContent: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const recording = recordings.find((r) => r.id === input.id);
      if (!recording) {
        throw new Error("Enregistrement non trouvé");
      }
      return {
        audioUrl: recording.audioUrl,
        transcription: recording.transcription,
      };
    }),
});
