import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { trpcClient } from "@/lib/trpc";

/**
 * Vérifie si un fichier existe (compatible multi-plateformes)
 */
const fileExists = async (fileUri: string): Promise<boolean> => {
  if (Platform.OS === "web") {
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
 * Transcrit un fichier audio en texte en utilisant le backend (tRPC)
 * @param audioUri URI du fichier audio à transcrire
 * @param options Paramètres optionnels pour la transcription
 * @returns Texte transcrit
 */
export const transcribeAudio = async (
  audioUri: string,
  options?: { language?: string; prompt?: string }
): Promise<string> => {
  try {
    console.log("Transcription audio:", audioUri);

    // Vérifier si le fichier existe
    const exists = await fileExists(audioUri);
    if (!exists && Platform.OS !== "web") {
      throw new Error(`Le fichier n'existe pas: ${audioUri}`);
    }

    // Envoyer le fichier audio au backend via tRPC
    const result = await trpcClient.transcription.transcribe.mutate({
      audioFile: audioUri,
      language: options?.language || "fr",
      prompt: options?.prompt,
    });
    return result.text;
  } catch (error) {
    console.error("Erreur de transcription audio:", error);
    throw error;
  }
};

/**
 * Fonction pour générer des transcriptions de test (utilisé pendant le développement ou en cas d'erreur)
 */
export const getMockTranscription = (): string => {
  const mockTranscriptions = [
    "Voici la transcription de test pour les notes vocales. Cette fonction est utilisée pour le développement et le test de l'interface utilisateur sans appeler l'API réelle.",
    "Bonjour, ceci est un enregistrement de test. Nous travaillons sur une application de mémo vocal avec transcription automatique.",
    "N'oubliez pas de faire les courses ce weekend. Il faut acheter du pain, du lait et des fruits pour le petit déjeuner de demain.",
    "Points importants pour la réunion de demain: présenter les nouveaux objectifs, discuter du budget et planifier les prochaines étapes du projet.",
    "Idée pour l'amélioration de l'application: ajouter une fonction de partage direct vers les applications de messagerie et réseaux sociaux.",
  ];

  // Sélection aléatoire d'une transcription
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
  return mockTranscriptions[randomIndex];
};
