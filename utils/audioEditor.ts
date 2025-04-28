import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Safely creates a unique file path for audio files
 */
const createSafeFilePath = (prefix: string, originalUri: string): string => {
  try {
    // Extract file extension
    const fileExtension = originalUri.split('.').pop() || 'm4a';
    
    // Create a timestamp-based unique name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    
    // Ensure we have a valid directory
    const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!directory) {
      throw new Error('No valid directory available for file storage');
    }
    
    // Create the new path
    return `${directory}${prefix}_${timestamp}_${randomString}.${fileExtension}`;
  } catch (error) {
    console.error('Error creating safe file path:', error);
    // Fallback path
    return `${FileSystem.cacheDirectory || ''}${prefix}_${Date.now()}.m4a`;
  }
};

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
 * Trims an audio file to the specified start and end times
 * @param audioUri URI of the audio file to trim
 * @param startTimeMs Start time in milliseconds
 * @param endTimeMs End time in milliseconds
 * @returns URI of the trimmed audio file
 */
export const trimAudio = async (
  audioUri: string,
  startTimeMs: number,
  endTimeMs: number
): Promise<string> => {
  try {
    // Validate input parameters
    if (!isFinite(startTimeMs) || startTimeMs < 0) {
      startTimeMs = 0;
    }
    
    if (!isFinite(endTimeMs) || endTimeMs <= startTimeMs) {
      // Get the duration of the audio file
      const duration = await getAudioDuration(audioUri);
      endTimeMs = duration;
    }
    
    if (Platform.OS === 'web') {
      // Web implementation would require different approach
      console.log('Audio trimming not supported on web');
      return audioUri;
    }

    // Check if the file exists
    const exists = await fileExists(audioUri);
    if (!exists) {
      throw new Error(`File does not exist: ${audioUri}`);
    }

    // In a real app, this would use a native module to trim the audio file
    // For this demo, we'll simulate trimming by creating a new file with metadata
    
    // Create a new filename for the trimmed audio
    const trimmedUri = createSafeFilePath('trimmed', audioUri);
    
    // Copy the original file (in a real app, we would actually trim the audio)
    await FileSystem.copyAsync({
      from: audioUri,
      to: trimmedUri
    });
    
    // Create a metadata file to store trim information
    // In a real app, we would actually modify the audio data
    const metadataUri = `${trimmedUri}.metadata`;
    const metadata = JSON.stringify({
      originalUri: audioUri,
      startTime: startTimeMs,
      endTime: endTimeMs,
      duration: endTimeMs - startTimeMs,
      trimmed: true
    });
    
    await FileSystem.writeAsStringAsync(metadataUri, metadata);
    
    return trimmedUri;
  } catch (error) {
    console.error('Error trimming audio:', error);
    throw error;
  }
};

/**
 * Gets the duration of an audio file
 * @param audioUri URI of the audio file
 * @returns Duration in milliseconds
 */
export const getAudioDuration = async (audioUri: string): Promise<number> => {
  try {
    // Check if the file exists (platform-safe)
    const exists = await fileExists(audioUri);
    if (!exists && Platform.OS !== 'web') {
      throw new Error(`File does not exist: ${audioUri}`);
    }
    
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();
    
    if (status.isLoaded && status.durationMillis && isFinite(status.durationMillis)) {
      return status.durationMillis;
    }
    
    // Return a default duration if we couldn't determine it
    return 30000; // 30 seconds
  } catch (error) {
    console.error('Error getting audio duration:', error);
    return 30000; // 30 seconds as fallback
  }
};

/**
 * Merges multiple audio files into one
 * @param audioUris Array of audio file URIs to merge
 * @returns URI of the merged audio file
 */
export const mergeAudioFiles = async (audioUris: string[]): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      console.log('Audio merging not supported on web');
      return audioUris[0] || '';
    }

    // Validate input
    if (!audioUris || audioUris.length === 0) {
      throw new Error('No audio files provided for merging');
    }
    
    // Check if all files exist
    for (const uri of audioUris) {
      const exists = await fileExists(uri);
      if (!exists) {
        throw new Error(`File does not exist: ${uri}`);
      }
    }

    // In a real app, this would use a native module to merge the audio files
    // For this demo, we'll simulate merging by creating a new file with metadata
    
    const mergedUri = createSafeFilePath('merged', audioUris[0]);
    
    // Copy the first file as a base (in a real app, we would actually merge the audio)
    if (audioUris.length > 0) {
      await FileSystem.copyAsync({
        from: audioUris[0],
        to: mergedUri
      });
    }
    
    // Create a metadata file to store merge information
    const metadataUri = `${mergedUri}.metadata`;
    const metadata = JSON.stringify({
      originalUris: audioUris,
      merged: true
    });
    
    await FileSystem.writeAsStringAsync(metadataUri, metadata);
    
    return mergedUri;
  } catch (error) {
    console.error('Error merging audio files:', error);
    throw error;
  }
};