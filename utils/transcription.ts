import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Checks if a file exists (platform-safe)
 */
const fileExists = async (fileUri: string): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // On web, we can't check if a file exists using FileSystem
    // Just return true and handle errors when trying to use the file
    return true;
  }
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking if file exists:', error);
    return false;
  }
};

/**
 * Transcribes an audio file to text
 * @param audioUri URI of the audio file to transcribe
 * @returns Transcribed text
 */
export const transcribeAudio = async (audioUri: string): Promise<string> => {
  try {
    // Check if the file exists (platform-safe)
    const exists = await fileExists(audioUri);
    if (!exists && Platform.OS !== 'web') {
      throw new Error(`File does not exist: ${audioUri}`);
    }
    
    // In a real app, this would call a speech-to-text API
    // For this demo, we'll simulate transcription with a delay
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a mock transcription
    const mockTranscriptions = [
      "Thank you for joining today's meeting. We'll be discussing the quarterly results and our plans for the next quarter. As you can see from the slides, our revenue has increased by 15% compared to the same period last year. This is largely due to the new product line we launched in March.",
      
      "I wanted to record some thoughts about the project we're working on. We need to focus on improving the user experience, especially on mobile devices. The current design doesn't scale well on smaller screens, and we're seeing a high bounce rate from mobile users. Let's schedule a design review meeting next week to address these issues.",
      
      "Here are my notes from the client meeting. They're interested in our proposal but have concerns about the timeline. They need the product launched before their annual conference in September, which gives us about three months. We'll need to prioritize features and possibly bring in additional resources to meet this deadline.",
      
      "This is a reminder to follow up with the marketing team about the social media campaign. We need to finalize the creative assets by Friday and get approval from legal before we can launch. Also, don't forget to update the budget spreadsheet with the latest cost estimates.",
      
      "I just had a great idea for improving our onboarding process. What if we created a series of short tutorial videos instead of the current text-based guide? Users could watch these videos at their own pace, and we could track completion rates to see where people might be getting stuck. Let's discuss this at the next product meeting."
    ];
    
    // Pick a random transcription
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    return mockTranscriptions[randomIndex];
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};