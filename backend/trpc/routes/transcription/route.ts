import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import FormData from "form-data";

// Input schema for the transcribe procedure
const transcribeInputSchema = z.object({
  audioUri: z.string(),
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
      console.log("Transcription procedure called with input:", {
        audioUri: input.audioUri.substring(0, 50) + "...",
        language: input.language,
        prompt: input.prompt,
      });

      // Check if OpenAI API key is available
      if (!ctx.env.OPENAI_API_KEY) {
        console.error("OpenAI API key not found in environment variables");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OpenAI API key not configured",
        });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: ctx.env.OPENAI_API_KEY,
      });

      // Handle different types of audio URIs
      let audioFile;
      let tempFilePath;

      try {
        if (input.audioUri.startsWith("data:")) {
          // Handle base64 data URI
          const base64Data = input.audioUri.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");

          // Create a temporary file
          tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.m4a`);
          fs.writeFileSync(tempFilePath, buffer);
          audioFile = fs.createReadStream(tempFilePath);
        } else if (input.audioUri.startsWith("file://")) {
          // Handle local file URI
          const filePath = input.audioUri.replace("file://", "");
          audioFile = fs.createReadStream(filePath);
        } else {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported audio URI format",
          });
        }

        // Call OpenAI's API
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: input.language,
          prompt: input.prompt,
        });

        return {
          text: transcription.text,
          language: input.language || "en",
        };
      } finally {
        // Clean up temporary file if it was created
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (error) {
            console.error("Error cleaning up temporary file:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error in transcribe procedure:", error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to transcribe audio",
        cause: error,
      });
    }
  });

/**
 * Returns a mock transcription for testing or fallback
 */
const getMockTranscription = (): string => {
  const mockTranscriptions = [
    "Thank you for joining today's meeting. We'll be discussing the quarterly results and our plans for the next quarter. As you can see from the slides, our revenue has increased by 15% compared to the same period last year. This is largely due to the new product line we launched in March.",

    "I wanted to record some thoughts about the project we're working on. We need to focus on improving the user experience, especially on mobile devices. The current design doesn't scale well on smaller screens, and we're seeing a high bounce rate from mobile users. Let's schedule a design review meeting next week to address these issues.",

    "Here are my notes from the client meeting. They're interested in our proposal but have concerns about the timeline. They need the product launched before their annual conference in September, which gives us about three months. We'll need to prioritize features and possibly bring in additional resources to meet this deadline.",

    "This is a reminder to follow up with the marketing team about the social media campaign. We need to finalize the creative assets by Friday and get approval from legal before we can launch. Also, don't forget to update the budget spreadsheet with the latest cost estimates.",

    "I just had a great idea for improving our onboarding process. What if we created a series of short tutorial videos instead of the current text-based guide? Users could watch these videos at their own pace, and we could track completion rates to see where people might be getting stuck. Let's discuss this at the next product meeting.",
  ];

  // Pick a random transcription
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
  return mockTranscriptions[randomIndex];
};
