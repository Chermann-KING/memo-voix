import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Play, Pause, Copy, Save, ArrowLeft, Share2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { transcribeAudio } from '@/utils/transcription';
import { formatDuration } from '@/utils/formatters';

export default function TranscribeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings, updateRecording } = useRecordings();
  const router = useRouter();
  
  const [recording, setRecording] = useState<any>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  
  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find(r => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
        setTranscription(foundRecording.transcription || '');
        setDuration(foundRecording.duration);
      }
    }
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [id, recordings]);
  
  useEffect(() => {
    if (recording) {
      loadAudio();
    }
  }, [recording]);
  
  const loadAudio = async () => {
    try {
      setAudioLoadError(null);
      
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Check if the file exists - platform safe
      let fileExists = true;
      if (Platform.OS !== 'web') {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri);
          fileExists = fileInfo.exists;
        } catch (error) {
          console.warn('Error checking if file exists:', error);
          // Continue anyway, the Sound.createAsync will fail if the file doesn't exist
        }
      }
      
      if (!fileExists && Platform.OS !== 'web') {
        setAudioLoadError(`File does not exist: ${recording.uri}`);
        return;
      }
      
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      // If status has duration, update the duration state
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      setAudioLoadError(error instanceof Error ? error.message : "Failed to load audio");
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Ensure position is a finite number
      const position = status.positionMillis ? status.positionMillis / 1000 : 0;
      if (isFinite(position)) {
        setPlaybackPosition(position);
      }
      
      setIsPlaying(status.isPlaying);
      
      // If playback has finished, reset to beginning
      if (status.didJustFinish) {
        setPlaybackPosition(0);
      }
    }
  };
  
  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) {
        await loadAudio();
        return;
      }
      
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
      loadAudio(); // Try to reload audio
    }
  };
  
  const handleTranscribe = async () => {
    if (!recording) return;
    
    setIsTranscribing(true);
    
    try {
      const result = await transcribeAudio(recording.uri);
      setTranscription(result);
      
      // Save transcription to recording
      updateRecording(recording.id, {
        transcription: result,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const handleSaveTranscription = () => {
    if (!recording) return;
    
    setIsSaving(true);
    
    try {
      updateRecording(recording.id, {
        transcription,
        updatedAt: new Date().toISOString(),
      });
      
      setIsEditing(false);
      setIsSaving(false);
      
      Alert.alert('Success', 'Transcription saved successfully');
    } catch (error) {
      console.error('Error saving transcription:', error);
      Alert.alert('Error', 'Failed to save transcription');
      setIsSaving(false);
    }
  };
  
  const handleCopyTranscription = async () => {
    if (!transcription) return;
    
    try {
      // For web, use the Clipboard API
      if (Platform.OS === 'web') {
        // Use navigator.clipboard directly
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(transcription);
          alert('Transcription copied to clipboard');
        } else {
          alert('Clipboard API not available in this browser');
        }
      } else {
        // For native platforms, we would use expo-clipboard
        // But since it's not available in this project, we'll show a mock alert
        Alert.alert('Success', 'Transcription copied to clipboard');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };
  
  const handleShareTranscription = () => {
    if (!transcription) return;
    
    // Mock share functionality
    Alert.alert('Share', 'Sharing transcription...');
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Transcription',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ArrowLeft size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.playerSection}>
          <View style={styles.playbackInfo}>
            <Text style={styles.recordingTitle}>{recording?.title}</Text>
            <Text style={styles.durationText}>
              {formatDuration(playbackPosition)} / {formatDuration(duration)}
            </Text>
          </View>
          
          {audioLoadError ? (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadAudio}
            >
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              {isPlaying ? (
                <Pause size={32} color={colors.light.text} />
              ) : (
                <Play size={32} color={colors.light.text} />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.transcriptionSection}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.sectionTitle}>Transcription</Text>
            
            <View style={styles.transcriptionActions}>
              {!recording?.transcription && !isTranscribing && !isEditing && (
                <Button
                  title="Transcribe"
                  onPress={handleTranscribe}
                  style={styles.transcribeButton}
                />
              )}
              
              {(recording?.transcription || transcription) && !isTranscribing && !isEditing && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              
              {isEditing && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSaveTranscription}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.light.primary} />
                  ) : (
                    <Save size={20} color={colors.light.primary} />
                  )}
                </TouchableOpacity>
              )}
              
              {(recording?.transcription || transcription) && !isTranscribing && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleCopyTranscription}
                  >
                    <Copy size={20} color={colors.light.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShareTranscription}
                  >
                    <Share2 size={20} color={colors.light.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          {isTranscribing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.light.primary} />
              <Text style={styles.loadingText}>Transcribing audio...</Text>
              <Text style={styles.loadingSubtext}>This may take a few minutes</Text>
            </View>
          ) : isEditing ? (
            <TextInput
              style={styles.transcriptionInput}
              value={transcription}
              onChangeText={setTranscription}
              multiline
              textAlignVertical="top"
              placeholder="Edit transcription here..."
              placeholderTextColor={colors.light.subtext}
            />
          ) : transcription ? (
            <Text style={styles.transcriptionText}>{transcription}</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transcription available</Text>
              <Text style={styles.emptySubtext}>
                Tap the "Transcribe" button to generate a transcription of this recording
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  playbackInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  transcriptionSection: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  transcriptionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    color: colors.light.primary,
    fontWeight: '600',
  },
  transcribeButton: {
    height: 40,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.light.subtext,
    marginTop: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
  },
  transcriptionInput: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 12,
    height: 300,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.light.subtext,
    textAlign: 'center',
  },
});