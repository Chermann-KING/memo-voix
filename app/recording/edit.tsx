import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Save, X, Scissors, Play, Pause } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { AudioTrimmer } from '@/components/recording/AudioTrimmer';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import { trimAudio } from '@/utils/audioEditor';
import { formatDuration } from '@/utils/formatters';

export default function EditRecordingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings, updateRecording } = useRecordings();
  const router = useRouter();
  
  const [recording, setRecording] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTrimTime, setStartTrimTime] = useState(0);
  const [endTrimTime, setEndTrimTime] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Load recording data
  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find(r => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
        setTitle(foundRecording.title);
        setDuration(foundRecording.duration);
        setEndTrimTime(foundRecording.duration);
      }
    }
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(error => {
          console.warn('Failed to unload sound:', error);
        });
      }
    };
  }, [id, recordings]);
  
  // Load audio for playback
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
        const durationSec = status.durationMillis / 1000;
        setDuration(durationSec);
        setEndTrimTime(durationSec);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      setAudioLoadError(error instanceof Error ? error.message : "Failed to load audio");
      Alert.alert('Error', 'Failed to load audio for editing');
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
        // If we're in trim mode, only play the selected section
        if (isTrimming) {
          // Ensure trim times are valid
          const validStartTime = isFinite(startTrimTime) ? startTrimTime : 0;
          
          await soundRef.current.setPositionAsync(validStartTime * 1000);
          await soundRef.current.playAsync();
          
          // Set up a timeout to pause at end trim time
          const validEndTime = isFinite(endTrimTime) ? endTrimTime : duration;
          const timeToPlay = (validEndTime - validStartTime) * 1000;
          
          if (timeToPlay > 0) {
            setTimeout(async () => {
              if (soundRef.current && isPlaying) {
                await soundRef.current.pauseAsync();
              }
            }, timeToPlay);
          }
        } else {
          await soundRef.current.playAsync();
        }
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };
  
  const handleSeek = async (position: number) => {
    try {
      if (!soundRef.current) return;
      
      // Validate position is a finite number between 0 and 1
      if (!isFinite(position) || position < 0 || position > 1) {
        console.warn('Invalid seek position:', position);
        return;
      }
      
      // Get current status to check duration
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) {
        console.warn('Cannot seek: sound not loaded');
        return;
      }
      
      // Use the most reliable duration source
      const durationMs = status.durationMillis || duration * 1000;
      
      // Ensure we have a valid duration
      if (!durationMs || !isFinite(durationMs) || durationMs <= 0) {
        console.warn('Cannot seek: invalid duration');
        return;
      }
      
      // Calculate seek position in milliseconds
      const seekPosition = Math.floor(position * durationMs);
      
      // Ensure seekPosition is valid
      if (!isFinite(seekPosition) || seekPosition < 0) {
        console.warn('Invalid seek position in milliseconds:', seekPosition);
        return;
      }
      
      // Clamp to valid range
      const clampedPositionMs = Math.max(0, Math.min(seekPosition, durationMs));
      
      // Perform the seek
      await soundRef.current.setPositionAsync(clampedPositionMs);
      
      // Update UI immediately for better responsiveness
      setPlaybackPosition(clampedPositionMs / 1000);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };
  
  const handleTrimsChange = (start: number, end: number) => {
    // Validate start and end are finite numbers
    if (!isFinite(start) || !isFinite(end)) {
      console.warn('Invalid trim values:', start, end);
      return;
    }
    
    // Ensure start and end are within valid range
    const validStart = Math.max(0, Math.min(duration, start));
    const validEnd = Math.max(validStart + 1, Math.min(duration, end));
    
    setStartTrimTime(validStart);
    setEndTrimTime(validEnd);
  };
  
  const handleTrimAudio = async () => {
    // Don't allow trimming on web
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Audio trimming is not available on web.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Pause playback if playing
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      
      // Validate trim times are finite numbers
      if (!isFinite(startTrimTime) || !isFinite(endTrimTime)) {
        throw new Error('Invalid trim times');
      }
      
      // Trim the audio file
      const trimmedUri = await trimAudio(
        recording.uri,
        startTrimTime * 1000,
        endTrimTime * 1000
      );
      
      // Update recording in store
      updateRecording(recording.id, {
        uri: trimmedUri,
        duration: endTrimTime - startTrimTime,
        updatedAt: new Date().toISOString(),
      });
      
      setIsSaving(false);
      
      // Show success message
      if (Platform.OS === 'web') {
        alert('Recording trimmed successfully');
      } else {
        Alert.alert('Success', 'Recording trimmed successfully');
      }
      
      // Navigate back to recording details
      router.back();
    } catch (error) {
      console.error('Error trimming audio:', error);
      setIsSaving(false);
      
      if (Platform.OS === 'web') {
        alert('Failed to trim recording');
      } else {
        Alert.alert('Error', 'Failed to trim recording');
      }
    }
  };
  
  const handleSave = () => {
    if (recording) {
      updateRecording(recording.id, {
        title,
        updatedAt: new Date().toISOString(),
      });
      
      router.back();
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  if (!recording) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading recording...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Recording',
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
              <Save size={24} color={colors.light.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Recording title"
          />
        </View>
        
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          
          {audioLoadError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {audioLoadError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadAudio}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.waveformContainer}>
                <AudioWaveform
                  duration={duration}
                  currentPosition={playbackPosition}
                  onSeek={handleSeek}
                  height={100}
                />
              </View>
              
              <View style={styles.playbackControls}>
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
                
                <Text style={styles.timeText}>
                  {formatDuration(playbackPosition)} / {formatDuration(duration)}
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.editSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trim Audio</Text>
            <TouchableOpacity
              style={styles.trimToggle}
              onPress={() => setIsTrimming(!isTrimming)}
            >
              <Scissors size={20} color={isTrimming ? colors.light.primary : colors.light.subtext} />
              <Text
                style={[
                  styles.trimToggleText,
                  isTrimming && styles.trimToggleActiveText
                ]}
              >
                {isTrimming ? 'Cancel Trimming' : 'Start Trimming'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isTrimming && (
            <View style={styles.trimmerContainer}>
              <AudioTrimmer
                duration={duration}
                onTrimsChange={handleTrimsChange}
                initialStartTime={startTrimTime}
                initialEndTime={endTrimTime}
              />
              
              <Button
                title={Platform.OS === 'web' ? 'Trimming Not Available on Web' : 'Apply Trim'}
                onPress={handleTrimAudio}
                isLoading={isSaving}
                style={styles.trimButton}
                disabled={Platform.OS === 'web' || isSaving}
              />
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    marginHorizontal: 16,
  },
  content: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
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
  playerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 16,
  },
  waveformContainer: {
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeText: {
    fontSize: 16,
    color: colors.light.text,
  },
  editSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trimToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trimToggleText: {
    fontSize: 14,
    color: colors.light.subtext,
    marginLeft: 4,
  },
  trimToggleActiveText: {
    color: colors.light.primary,
  },
  trimmerContainer: {
    marginTop: 16,
  },
  trimButton: {
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.light.error,
    textAlign: 'center',
    marginBottom: 12,
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
});