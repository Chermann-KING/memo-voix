import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { trpcClient, checkBackendConnection } from "@/lib/trpc";

/**
 * Checks if a file exists (platform-safe)
 */
const fileExists = async (fileUri: string): Promise<boolean> => {
  if (Platform.OS === "web") {
    // On web, we can't check if a file exists using FileSystem
    // Just return true and handle errors when trying to use the file
    return true;
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists;
  } catch (error) {
    console.error("Erreur de vérification de l'existence d'un fichier:", error);
    return false;
  }
};

/**
 * Transcribes an audio file to text using OpenAI's Whisper API
 * @param audioUri URI of the audio file to transcribe
 * @param options Optional parameters for transcription
 * @returns Transcribed text
 */
export const transcribeAudio = async (
  audioUri: string,
  options?: { language?: string; prompt?: string }
): Promise<string> => {
  try {
    console.log("Transcription audio:", audioUri);

    // Check if the file exists (platform-safe)
    const exists = await fileExists(audioUri);
    if (!exists && Platform.OS !== "web") {
      throw new Error(`Le fichier n'existe pas: ${audioUri}`);
    }

    // Check if the backend is running
    const isBackendRunning = await checkBackendConnection();
    if (!isBackendRunning) {
      throw new Error("Le serveur backend ne fonctionne pas");
    }

    console.log("Appel de la procédure de transcription tRPC");
    const result = await trpcClient.transcription.transcribe.mutate({
      audioFile: audioUri,
      language: options?.language,
      prompt: options?.prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Erreur de transcription audio:", error);
    throw error;
  }
};
