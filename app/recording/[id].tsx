import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, TouchableOpacity, ActivityIndicator, Dimensions, Share as RNShare } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Share2, Trash2, Edit, Save, Star, Download, Lock, Play, Pause, Bookmark, MessageSquare, Scissors, FileText, Users } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRecordings } from '@/hooks/useRecordings';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { formatDuration, formatDate, formatTime, formatFileSize } from '@/utils/formatters';
import { Recording, Marker } from '@/types/recording';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import { encryptFile, decryptFile, isFileEncrypted } from '@/utils/encryption';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings, updateRecording, deleteRecording, toggleFavorite, addMarker } = useRecordings();
  const { getSharedRecording, getRecordingComments } = useCollaboration();
  const { user } = useAuth();
  const router = useRouter();
  
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedNotes, setEditedNotes] = useState('');
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Collaboration state
  const [sharedRecording, setSharedRecording] = useState<any>(null);
  const [commentsCount, setCommentsCount] = useState(0);
  
  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find(r => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
        setEditedTitle(foundRecording.title);
        setEditedNotes(foundRecording.notes || '');
        
        // Set initial duration from recording metadata
        setPlaybackDuration(foundRecording.duration);
        
        // Check if recording is shared
        const shared = getSharedRecording(id);
        setSharedRecording(shared);
        
        // Get comments count
        const comments = getRecordingComments(id);
        setCommentsCount(comments.length);
      }
    }
    
    // Configure audio mode for playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    }).catch(error => {
      console.warn('Failed to set audio mode:', error);
    });
    
    // Cleanup function
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(error => {
          console.warn('Failed to unload sound:', error);
        });
      }
    };
  }, [id, recordings]);
  
  const loadAudio = async () => {
    if (!recording || !recording.uri) {
      setAudioLoadError("No recording URI available");
      return false;
    }
    
    try {
      setIsAudioLoading(true);
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
        setIsAudioLoading(false);
        return false;
      }
      
      // Use the original URI for playback regardless of encryption status
      // In a real app with actual encryption, you would decrypt before playback
      const playbackUri = recording.uri;
      
      console.log('Loading audio from URI:', playbackUri);
      
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: playbackUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      // If status has duration, update the playback duration
      if (status.isLoaded && status.durationMillis) {
        setPlaybackDuration(status.durationMillis / 1000);
      } else {
        // Fallback to the recording's duration if available
        setPlaybackDuration(recording.duration);
      }
      
      setIsAudioLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      setAudioLoadError(error instanceof Error ? error.message : "Failed to load audio");
      setIsAudioLoading(false);
      return false;
    }
  };
  
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Ensure position is a finite number
      const position = status.positionMillis ? status.positionMillis / 1000 : 0;
      if (isFinite(position)) {
        setPlaybackPosition(position);
      }
      
      // Only update duration if it's a valid number
      if (status.durationMillis && isFinite(status.durationMillis)) {
        setPlaybackDuration(status.durationMillis / 1000);
      }
      
      setIsPlaying(status.isPlaying);
      
      // If playback has finished, reset to beginning
      if (status.didJustFinish) {
        setPlaybackPosition(0);
      }
    }
  };
  
  useEffect(() => {
    // Load audio when recording changes
    if (recording) {
      loadAudio();
    }
    
    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(error => {
          console.warn('Failed to unload sound:', error);
        });
      }
    };
  }, [recording]);
  
  const handlePlayPause = async () => {
    try {
      // If sound is not loaded yet, load it first
      if (!soundRef.current) {
        const loaded = await loadAudio();
        if (!loaded) return;
      }
      
      // Check if sound is loaded before attempting to play/pause
      const status = await soundRef.current?.getStatusAsync();
      if (!status || !status.isLoaded) {
        const loaded = await loadAudio();
        if (!loaded) return;
      }
      
      if (isPlaying) {
        await soundRef.current?.pauseAsync();
      } else {
        await soundRef.current?.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      setAudioLoadError(error instanceof Error ? error.message : "Failed to play audio");
      
      // Try to reload the audio if there was an error
      loadAudio();
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
      const durationMs = status.durationMillis || playbackDuration * 1000;
      
      // Ensure we have a valid duration
      if (!durationMs || !isFinite(durationMs) || durationMs <= 0) {
        console.warn('Cannot seek: invalid duration');
        return;
      }
      
      // Calculate seek position in milliseconds
      const seekPositionMs = Math.floor(position * durationMs);
      
      // Ensure seekPosition is valid
      if (!isFinite(seekPositionMs) || seekPositionMs < 0) {
        console.warn('Invalid seek position in milliseconds:', seekPositionMs);
        return;
      }
      
      // Clamp to valid range
      const clampedPositionMs = Math.max(0, Math.min(seekPositionMs, durationMs));
      
      // Perform the seek
      await soundRef.current.setPositionAsync(clampedPositionMs);
      
      // Update UI immediately for better responsiveness
      setPlaybackPosition(clampedPositionMs / 1000);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };
  
  const handleAddMarker = () => {
    if (!recording) return;
    
    const newMarker: Omit<Marker, 'id'> = {
      timestamp: playbackPosition,
      label: `Marker at ${formatDuration(playbackPosition)}`,
    };
    
    addMarker(recording.id, newMarker);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (recording) {
      updateRecording(recording.id, {
        title: editedTitle,
        notes: editedNotes,
      });
      setIsEditing(false);
    }
  };
  
  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this recording?')) {
        if (recording) {
          deleteRecording(recording.id);
          router.back();
        }
      }
    } else {
      Alert.alert(
        'Delete Recording',
        'Are you sure you want to delete this recording?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (recording) {
                deleteRecording(recording.id);
                router.back();
              }
            },
          },
        ]
      );
    }
  };
  
  const handleFavoriteToggle = () => {
    if (recording) {
      toggleFavorite(recording.id);
    }
  };

  // Helper function to sanitize filename
  const sanitizeFilename = (name: string): string => {
    // Replace invalid filename characters with underscores
    return name.replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/__+/g, '_'); // Replace multiple underscores with single one
  };

  const handleShare = async () => {
    if (!recording) return;
    setIsSharing(true);

    try {
      if (Platform.OS === 'web') {
        alert('Sharing is not available on web. In a production app, this would use the Web Share API if available.');
        setIsSharing(false);
        return;
      }

      // Check if sharing is available (iOS & Android)
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        setIsSharing(false);
        return;
      }

      // Create a proper filename based on the recording title
      const sanitizedTitle = sanitizeFilename(recording.title);
      const fileExtension = recording.uri.split('.').pop() || 'm4a';
      const fileName = `${sanitizedTitle}.${fileExtension}`;
      
      // In a real app, we might need to copy the file to a shareable location
      // or convert it to a universally compatible format like MP3
      let shareableUri = recording.uri;
      
      // If the URI is a file:// URI on iOS, we need to make it shareable
      if (Platform.OS === 'ios' && recording.uri.startsWith('file://')) {
        try {
          // Copy to a temporary location with a proper filename
          const tempUri = FileSystem.documentDirectory + fileName;
          await FileSystem.copyAsync({
            from: recording.uri,
            to: tempUri
          });
          shareableUri = tempUri;
        } catch (error) {
          console.error('Error preparing file for sharing:', error);
          Alert.alert('Error', 'Failed to prepare audio for sharing');
          setIsSharing(false);
          return;
        }
      }

      // Share the audio file - use platform-specific options
      await Sharing.shareAsync(shareableUri, {
        dialogTitle: `Share "${recording.title}"`,
        mimeType: 'audio/mp4', // for Android
        UTI: 'public.audio' // for iOS
      });

      setIsSharing(false);
    } catch (error) {
      console.error('Error sharing recording:', error);
      Alert.alert('Error', 'Failed to share recording');
      setIsSharing(false);
    }
  };

  const handleExport = () => {
    if (!recording) return;

    // In a real app, this would export the recording to a file
    Alert.alert('Export', 'Exporting recording to file...');
    
    // Mock export functionality
    setTimeout(() => {
      Alert.alert('Success', 'Recording exported successfully');
    }, 1000);
  };

  const handleEncrypt = async () => {
    if (!recording) return;
    
    // Don't allow encryption on web
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Encryption is not available on web.');
      return;
    }
    
    setIsEncrypting(true);
    
    try {
      // Pause playback if playing
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      
      // Unload the sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      let newUri = recording.uri;
      
      if (!recording.isEncrypted) {
        // Encrypt the file (in our demo, this just copies the file)
        newUri = await encryptFile(recording.uri);
        console.log('Encryption successful, new URI:', newUri);
      } else {
        // Decrypt the file (in our demo, this just copies the file)
        newUri = await decryptFile(recording.uri);
        console.log('Decryption successful, new URI:', newUri);
      }
      
      // Update recording in store
      updateRecording(recording.id, {
        uri: newUri,
        isEncrypted: !recording.isEncrypted,
        updatedAt: new Date().toISOString(),
      });
      
      // Show success message
      Alert.alert(
        'Success',
        recording.isEncrypted 
          ? 'Recording has been decrypted' 
          : 'Recording has been encrypted'
      );
      
      // Reload audio
      setTimeout(() => {
        loadAudio();
        setIsEncrypting(false);
      }, 500);
    } catch (error) {
      console.error('Error encrypting/decrypting file:', error);
      Alert.alert('Error', `Failed to ${recording.isEncrypted ? 'decrypt' : 'encrypt'} recording: ${error instanceof Error ? error.message : String(error)}`);
      setIsEncrypting(false);
    }
  };
  
  const handleEditAudio = () => {
    if (!recording) return;
    
    router.push({
      pathname: '/recording/edit',
      params: { id: recording.id }
    });
  };
  
  const handleTranscribe = () => {
    if (!recording) return;
    
    router.push({
      pathname: '/recording/transcribe',
      params: { id: recording.id }
    });
  };
  
  const handleShareCollaboration = () => {
    if (!recording) return;
    
    router.push({
      pathname: '/recording/share',
      params: { id: recording.id }
    });
  };
  
  const handleViewComments = () => {
    if (!recording) return;
    
    router.push({
      pathname: '/recording/comments',
      params: { id: recording.id }
    });
  };
  
  if (!recording) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Recording' : recording.title,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {!isEditing ? (
                <>
                  <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                    <Edit size={20} color={colors.light.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                    <Trash2 size={20} color={colors.light.error} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                  <Save size={20} color={colors.light.primary} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={editedTitle}
              onChangeText={setEditedTitle}
              placeholder="Recording title"
              placeholderTextColor={colors.light.subtext}
            />
            
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder="Add notes about this recording"
              placeholderTextColor={colors.light.subtext}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        ) : (
          <>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {formatDate(recording.createdAt)} at {formatTime(recording.createdAt)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{formatDuration(recording.duration)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Size</Text>
                <Text style={styles.infoValue}>{formatFileSize(recording.size)}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>
                  {recording.category.charAt(0).toUpperCase() + recording.category.slice(1)}
                </Text>
              </View>
              
              {recording.tags.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tags</Text>
                  <Text style={styles.infoValue}>{recording.tags.join(', ')}</Text>
                </View>
              )}
              
              {sharedRecording && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Shared With</Text>
                  <Text style={styles.infoValue}>
                    {sharedRecording.collaborators.length} people
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.playerSection}>
              {isAudioLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.light.primary} />
                  <Text style={styles.loadingText}>Loading audio...</Text>
                </View>
              ) : audioLoadError ? (
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
                      duration={playbackDuration}
                      currentPosition={playbackPosition}
                      onSeek={handleSeek}
                      height={100}
                    />
                  </View>
                  
                  <View style={styles.playerControls}>
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
                    
                    <TouchableOpacity
                      style={styles.markerButton}
                      onPress={handleAddMarker}
                    >
                      <Bookmark size={24} color={colors.light.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={handleFavoriteToggle}
                    >
                      <Star
                        size={24}
                        color={recording.isFavorite ? colors.light.warning : colors.light.text}
                        fill={recording.isFavorite ? colors.light.warning : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color={colors.light.primary} />
                ) : (
                  <Share2 size={24} color={colors.light.primary} />
                )}
                <Text style={styles.actionButtonText}>
                  {isSharing ? 'Sharing...' : 'Share'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                <Download size={24} color={colors.light.primary} />
                <Text style={styles.actionButtonText}>Export</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleEncrypt}
                disabled={isEncrypting || Platform.OS === 'web'}
              >
                {isEncrypting ? (
                  <ActivityIndicator size="small" color={recording.isEncrypted ? colors.light.success : colors.light.primary} />
                ) : (
                  <Lock size={24} color={recording.isEncrypted ? colors.light.success : colors.light.primary} />
                )}
                <Text style={styles.actionButtonText}>
                  {Platform.OS === 'web' ? 'Encryption N/A' : (recording.isEncrypted ? 'Encrypted' : 'Encrypt')}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Advanced actions */}
            <View style={styles.advancedActionsContainer}>
              <TouchableOpacity 
                style={styles.advancedActionButton} 
                onPress={handleEditAudio}
              >
                <Scissors size={24} color={colors.light.primary} />
                <Text style={styles.advancedActionText}>Edit Audio</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedActionButton} 
                onPress={handleTranscribe}
              >
                <FileText size={24} color={colors.light.primary} />
                <Text style={styles.advancedActionText}>
                  {recording.transcription ? 'View Transcription' : 'Transcribe'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedActionButton} 
                onPress={handleShareCollaboration}
              >
                <Users size={24} color={colors.light.primary} />
                <Text style={styles.advancedActionText}>
                  {sharedRecording ? 'Manage Sharing' : 'Share with Others'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.advancedActionButton} 
                onPress={handleViewComments}
              >
                <MessageSquare size={24} color={colors.light.primary} />
                <Text style={styles.advancedActionText}>
                  Comments {commentsCount > 0 ? `(${commentsCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
            
            {recording.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{recording.notes}</Text>
              </View>
            )}
            
            {recording.markers && recording.markers.length > 0 && (
              <View style={styles.markersSection}>
                <Text style={styles.sectionTitle}>Markers</Text>
                {recording.markers.map((marker) => (
                  <TouchableOpacity 
                    key={marker.id} 
                    style={styles.markerItem}
                    onPress={async () => {
                      if (soundRef.current) {
                        try {
                          // Validate marker timestamp is a finite number
                          const timestamp = isFinite(marker.timestamp) ? marker.timestamp : 0;
                          await soundRef.current.setPositionAsync(timestamp * 1000);
                        } catch (error) {
                          console.error('Error seeking to marker:', error);
                        }
                      }
                    }}
                  >
                    <View style={styles.markerDot} />
                    <View style={styles.markerInfo}>
                      <Text style={styles.markerLabel}>{marker.label}</Text>
                      <Text style={styles.markerTimestamp}>
                        {formatDuration(marker.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {recording.transcription && (
              <View style={styles.transcriptionSection}>
                <Text style={styles.sectionTitle}>Transcription</Text>
                <Text style={styles.transcriptionText}>{recording.transcription}</Text>
                <TouchableOpacity 
                  style={styles.viewFullButton}
                  onPress={handleTranscribe}
                >
                  <Text style={styles.viewFullButtonText}>View Full Transcription</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  editForm: {
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
    marginBottom: 16,
  },
  textArea: {
    height: 120,
  },
  infoSection: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.light.subtext,
  },
  infoValue: {
    fontSize: 16,
    color: colors.light.text,
    fontWeight: '500',
  },
  playerSection: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  waveformContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: colors.light.subtext,
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
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.light.text,
    fontWeight: '500',
  },
  advancedActionsContainer: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  advancedActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  advancedActionText: {
    fontSize: 16,
    color: colors.light.text,
    marginLeft: 12,
  },
  notesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
  },
  markersSection: {
    marginBottom: 24,
  },
  markerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.light.primary,
    marginRight: 12,
  },
  markerInfo: {
    flex: 1,
  },
  markerLabel: {
    fontSize: 16,
    color: colors.light.text,
    marginBottom: 4,
  },
  markerTimestamp: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  transcriptionSection: {
    marginBottom: 24,
  },
  transcriptionText: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
    maxHeight: 200,
  },
  viewFullButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  viewFullButtonText: {
    fontSize: 14,
    color: colors.light.primary,
    fontWeight: '500',
  },
});