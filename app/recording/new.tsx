import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { RecordingControls } from '@/components/recording/RecordingControls';
import { Button } from '@/components/ui/Button';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { RecordingCategory, StorageLocation } from '@/types/recording';

export default function NewRecordingScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingCategory, setRecordingCategory] = useState<RecordingCategory>('notes');
  const [recordingTags, setRecordingTags] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { addRecording } = useRecordings();
  const router = useRouter();
  
  // Reference to the recording object
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  
  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        // Configure audio mode for recording - using simplified configuration
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          // These are needed for Android
          playThroughEarpieceAndroid: false,
          // Simplified interruption mode settings
          shouldDuckAndroid: true,
        });
      } catch (err) {
        console.error('Failed to get recording permissions', err);
        setHasPermission(false);
      }
    })();
    
    // Cleanup audio mode on unmount
    return () => {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    };
  }, []);
  
  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const handleStartRecording = async () => {
    try {
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }
      
      // Prepare the recording with simplified audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };
  
  const handleStopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Get the recording URI
      const uri = recordingRef.current.getURI();
      if (!uri) {
        throw new Error('Recording URI is null');
      }
      
      recordingUriRef.current = uri;
      console.log('Recording saved at:', uri);
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
      
      setIsRecording(false);
      setIsFinished(true);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!recordingUriRef.current) {
        throw new Error('No recording available');
      }
      
      // Calculate file size - use different approaches based on platform
      let fileSize = 0;
      
      if (Platform.OS !== 'web') {
        try {
          // Only use FileSystem.getInfoAsync on native platforms
          const fileInfo = await FileSystem.getInfoAsync(recordingUriRef.current);
          
          if (fileInfo.exists) {
            // For TypeScript, we need to check if the property exists
            const fileInfoWithSize = fileInfo as any;
            fileSize = fileInfoWithSize.size || Math.floor(recordingTime * 10000);
          } else {
            fileSize = Math.floor(recordingTime * 10000); // Estimate size based on duration
          }
        } catch (error) {
          console.warn('Error getting file info:', error);
          fileSize = Math.floor(recordingTime * 10000); // Fallback to estimation
        }
      } else {
        // For web, estimate file size based on duration and quality
        // Rough estimate: ~128kbps for medium quality audio
        fileSize = Math.floor(recordingTime * 16000); // 16KB per second
      }
      
      // Create a new recording object
      const newRecording = {
        title: recordingTitle || `Recording ${new Date().toLocaleString()}`,
        duration: recordingTime,
        size: fileSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uri: recordingUriRef.current,
        category: recordingCategory,
        tags: recordingTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        isFavorite: false,
        isEncrypted: false,
        storageLocation: 'local' as StorageLocation,
      };
      
      console.log('Saving recording:', newRecording);
      addRecording(newRecording);
      
      // Add a small delay to ensure the state is updated
      setTimeout(() => {
        setIsSaving(false);
        router.replace('/');
      }, 300);
    } catch (err) {
      console.error('Failed to save recording:', err);
      setIsSaving(false);
      
      // Show appropriate error message based on platform
      if (Platform.OS === 'web') {
        alert(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      } else {
        Alert.alert('Error', `Failed to save recording: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
      }
    }
  };
  
  const handleCancel = async () => {
    try {
      if (isRecording && recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      
      // Delete the recording file if it exists (only on native platforms)
      if (recordingUriRef.current && Platform.OS !== 'web') {
        try {
          await FileSystem.deleteAsync(recordingUriRef.current, { idempotent: true });
        } catch (error) {
          console.warn('Error deleting recording file:', error);
        }
      }
      
      router.back();
    } catch (err) {
      console.error('Error during cancel', err);
      router.back();
    }
  };
  
  const categories: RecordingCategory[] = ['ideas', 'meetings', 'interviews', 'notes', 'custom'];
  
  // Show permission request if permission status is not determined yet
  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Requesting microphone permission...</Text>
      </View>
    );
  }
  
  // Show error if permission is denied
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Microphone permission is required to record audio.</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen
        options={{
          title: isFinished ? 'Save Recording' : 'New Recording',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!isFinished ? (
          <View style={styles.recordingContainer}>
            <RecordingControls
              isRecording={isRecording}
              recordingTime={recordingTime}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
            
            <Text style={styles.instructionText}>
              {isRecording
                ? 'Recording in progress. Tap the button to stop.'
                : 'Tap the button to start recording.'}
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Recording Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={recordingTitle}
                onChangeText={setRecordingTitle}
                placeholder="Enter a title for your recording"
                placeholderTextColor={colors.light.subtext}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      recordingCategory === category && styles.selectedCategory,
                    ]}
                    onPress={() => setRecordingCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        recordingCategory === category && styles.selectedCategoryText,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={recordingTags}
                onChangeText={setRecordingTags}
                placeholder="e.g. important, meeting, follow-up"
                placeholderTextColor={colors.light.subtext}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Save Recording"
                onPress={handleSave}
                isLoading={isSaving}
                style={styles.saveButton}
              />
              <Button
                title="Discard"
                variant="outline"
                onPress={handleCancel}
                style={styles.discardButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.light.error,
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    marginLeft: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  instructionText: {
    fontSize: 16,
    color: colors.light.subtext,
    textAlign: 'center',
    marginTop: 24,
  },
  formContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.text,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.light.text,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.light.card,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.light.text,
  },
  selectedCategoryText: {
    color: colors.light.background,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    marginBottom: 12,
  },
  discardButton: {
    borderColor: colors.light.error,
  },
});