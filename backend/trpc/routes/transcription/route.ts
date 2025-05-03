import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Input schema for the transcribe procedure
const transcribeInputSchema = z.object({
  audioFile: z.any(), // Fichier audio à transcrire
  language: z.string().optional(),
  prompt: z.string().optional(),
});

/**
 * tRPC procedure for transcribing audio using OpenAI's Whisper API
 */
export const transcribeProcedure = protectedProcedure
  .input(transcribeInputSchema)
  .mutation(async ({ input, ctx }) => {
    try {
      // Vérifier la clé API OpenAI
      if (!ctx.env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Clé API OpenAI non configurée",
        });
      }

      // Initialiser le client OpenAI
      const openai = new OpenAI({
        apiKey: ctx.env.OPENAI_API_KEY,
      });

      // Créer un fichier temporaire
      const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);

      try {
        // Écrire le fichier audio dans un fichier temporaire
        const buffer = Buffer.from(await input.audioFile.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        // Créer un stream de lecture
        const audioStream = fs.createReadStream(tempFilePath);

        // Appeler l'API OpenAI
        const transcription = await openai.audio.transcriptions.create({
          file: audioStream,
          model: "whisper-1",
          language: input.language,
          prompt: input.prompt,
        });

        return {
          success: true,
          text: transcription.text,
          language: input.language || "fr",
        };
      } finally {
        // Nettoyer le fichier temporaire
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la transcription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Échec de la transcription audio",
        cause: error,
      });
    }
  });

/**
 * Returns a mock transcription for testing or fallback
 */
// const getMockTranscription = (): string => {
//   const mockTranscriptions = [
//     "Thank you for joining today's meeting. We'll be discussing the quarterly results and our plans for the next quarter. As you can see from the slides, our revenue has increased by 15% compared to the same period last year. This is largely due to the new product line we launched in March.",

//     "I wanted to record some thoughts about the project we're working on. We need to focus on improving the user experience, especially on mobile devices. The current design doesn't scale well on smaller screens, and we're seeing a high bounce rate from mobile users. Let's schedule a design review meeting next week to address these issues.",

//     "Here are my notes from the client meeting. They're interested in our proposal but have concerns about the timeline. They need the product launched before their annual conference in September, which gives us about three months. We'll need to prioritize features and possibly bring in additional resources to meet this deadline.",

//     "This is a reminder to follow up with the marketing team about the social media campaign. We need to finalize the creative assets by Friday and get approval from legal before we can launch. Also, don't forget to update the budget spreadsheet with the latest cost estimates.",

//     "I just had a great idea for improving our onboarding process. What if we created a series of short tutorial videos instead of the current text-based guide? Users could watch these videos at their own pace, and we could track completion rates to see where people might be getting stuck. Let's discuss this at the next product meeting.",
//   ];

//   // Pick a random transcription
//   const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
//   return mockTranscriptions[randomIndex];
// };
