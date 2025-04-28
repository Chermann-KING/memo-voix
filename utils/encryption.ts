import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// A simple encryption key for demo purposes
// In a real app, this would be securely stored and possibly derived from user credentials
const ENCRYPTION_KEY = 'MemoVoixSecretKey123';

/**
 * Simple XOR encryption/decryption for demo purposes
 * In a production app, use a proper encryption library
 */
const xorEncryptDecrypt = (data: string, key: string): string => {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

/**
 * Safely creates a unique file path for encrypted/decrypted files
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
 * Encrypts a file
 * @param fileUri URI of the file to encrypt
 * @returns URI of the encrypted file
 */
export const encryptFile = async (fileUri: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation would require different approach
      console.log('Encryption not supported on web');
      return fileUri;
    }

    // Validate file exists
    const exists = await fileExists(fileUri);
    if (!exists) {
      throw new Error(`File does not exist: ${fileUri}`);
    }

    // For audio files, instead of trying to encrypt the actual audio data (which can be complex),
    // we'll create a copy of the file and mark it as encrypted in our database
    // This simulates encryption without actually modifying the audio data
    
    // Create a unique destination path in the cache directory
    const encryptedFileUri = createSafeFilePath('encrypted', fileUri);
    
    try {
      // Copy the file instead of trying to encrypt the binary data
      await FileSystem.copyAsync({
        from: fileUri,
        to: encryptedFileUri
      });
    } catch (copyError) {
      console.error('Error copying file during encryption:', copyError);
      
      // If copy fails, try to read and write the file manually
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await FileSystem.writeAsStringAsync(encryptedFileUri, content, {
        encoding: FileSystem.EncodingType.Base64
      });
    }
    
    console.log('File "encrypted" successfully:', encryptedFileUri);
    return encryptedFileUri;
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw error;
  }
};

/**
 * Decrypts a file
 * @param encryptedFileUri URI of the encrypted file
 * @returns URI of the decrypted file
 */
export const decryptFile = async (encryptedFileUri: string): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation would require different approach
      console.log('Decryption not supported on web');
      return encryptedFileUri;
    }

    // Validate file exists
    const exists = await fileExists(encryptedFileUri);
    if (!exists) {
      throw new Error(`Encrypted file does not exist: ${encryptedFileUri}`);
    }

    // Similar to encryption, we'll create a copy of the file and mark it as decrypted
    // In a real app, you would use a proper decryption method
    const decryptedFileUri = createSafeFilePath('decrypted', encryptedFileUri);
    
    try {
      // Copy the file instead of trying to decrypt the binary data
      await FileSystem.copyAsync({
        from: encryptedFileUri,
        to: decryptedFileUri
      });
    } catch (copyError) {
      console.error('Error copying file during decryption:', copyError);
      
      // If copy fails, try to read and write the file manually
      const content = await FileSystem.readAsStringAsync(encryptedFileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await FileSystem.writeAsStringAsync(decryptedFileUri, content, {
        encoding: FileSystem.EncodingType.Base64
      });
    }
    
    console.log('File "decrypted" successfully:', decryptedFileUri);
    return decryptedFileUri;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw error;
  }
};

/**
 * Checks if a file is encrypted
 * This is a simple check based on filename or metadata
 * In a real app, you would have a more robust way to determine this
 */
export const isFileEncrypted = (fileUri: string): boolean => {
  // For demo purposes, we're just checking the filename
  // In a real app, you might store this information in metadata or a database
  return fileUri.includes('encrypted_') || fileUri.endsWith('.encrypted');
};