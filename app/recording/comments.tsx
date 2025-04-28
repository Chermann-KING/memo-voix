import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useRecordings } from '@/hooks/useRecordings';
import { useCollaboration } from '@/hooks/useCollaboration';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { CommentsList } from '@/components/collaboration/CommentsList';
import { AudioWaveform } from '@/components/ui/AudioWaveform';

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings } = useRecordings();
  const { getRecordingComments, addComment, updateComment, deleteComment } = useCollaboration();
  const { user } = useAuth();
  const router = useRouter();
  
  const [recording, setRecording] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Load recording and comments
  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find(r => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
        setPlaybackDuration(foundRecording.duration);
      }
      
      const recordingComments = getRecordingComments(id);
      setComments(recordingComments);
    }
    
    // Configure audio mode for playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
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
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.error('Error loading audio:', error);
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
  
  const handleSeek = async (position: number) => {
    try {
      if (!soundRef.current) return;
      
      // Validate position is a finite number between 0 and 1
      if (!isFinite(position) || position < 0 || position > 1) {
        console.warn('Invalid seek position:', position);
        return;
      }
      
      // Convert position (0-1) to seconds
      const seekPosition = position * playbackDuration;
      
      // Validate seekPosition is a finite number
      if (!isFinite(seekPosition)) {
        console.warn('Invalid seek position in seconds:', seekPosition);
        return;
      }
      
      // Additional check for web platform
      if (Platform.OS === 'web' && seekPosition > 0) {
        // On web, we need to ensure the audio is loaded before seeking
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded || !status.durationMillis) {
          console.warn('Cannot seek: audio not fully loaded on web');
          return;
        }
        
        // Ensure we don't seek beyond the duration on web
        const maxPosition = Math.max(0, Math.min(seekPosition * 1000, status.durationMillis - 100));
        await soundRef.current.setPositionAsync(maxPosition);
      } else {
        await soundRef.current.setPositionAsync(seekPosition * 1000);
      }
      
      setPlaybackPosition(seekPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };
  
  const handleTimestampPress = async (timestamp: number) => {
    try {
      if (!soundRef.current) return;
      
      // Validate timestamp is a finite number
      if (!isFinite(timestamp) || timestamp < 0) {
        console.warn('Invalid timestamp:', timestamp);
        return;
      }
      
      // Additional check for web platform
      if (Platform.OS === 'web' && timestamp > 0) {
        // On web, we need to ensure the audio is loaded before seeking
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded || !status.durationMillis) {
          console.warn('Cannot seek: audio not fully loaded on web');
          return;
        }
        
        // Ensure we don't seek beyond the duration on web
        const maxPosition = Math.max(0, Math.min(timestamp * 1000, status.durationMillis - 100));
        await soundRef.current.setPositionAsync(maxPosition);
      } else {
        await soundRef.current.setPositionAsync(timestamp * 1000);
      }
      
      setPlaybackPosition(timestamp);
    } catch (error) {
      console.error('Error seeking to timestamp:', error);
    }
  };
  
  const handleAddComment = (content: string, timestamp: number) => {
    if (!recording || !user) return;
    
    addComment({
      recordingId: recording.id,
      userId: user.id,
      content,
      timestamp,
    });
    
    // Update local comments
    setComments(getRecordingComments(recording.id));
  };
  
  const handleUpdateComment = (commentId: string, content: string) => {
    updateComment(commentId, content);
    
    // Update local comments
    setComments(getRecordingComments(recording.id));
  };
  
  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    
    // Update local comments
    setComments(getRecordingComments(recording.id));
  };
  
  if (!recording || !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Get all users from comments
  const userIds = new Set([user.id, ...comments.map(c => c.userId)]);
  const users = Array.from(userIds).map(id => {
    if (id === user.id) return user;
    
    // Find user in mock data
    const mockUser = [
      {
        id: '2',
        email: 'jane@example.com',
        displayName: 'Jane Smith',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: '3',
        email: 'john@example.com',
        displayName: 'John Doe',
        photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
    ].find(u => u.id === id);
    
    return mockUser || {
      id,
      email: 'unknown@example.com',
      displayName: 'Unknown User',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  });
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Comments',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingTitle}>{recording.title}</Text>
        </View>
        
        <View style={styles.waveformContainer}>
          <AudioWaveform
            duration={playbackDuration}
            currentPosition={playbackPosition}
            onSeek={handleSeek}
            height={80}
          />
        </View>
        
        <CommentsList
          comments={comments}
          users={users}
          currentUserId={user.id}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onTimestampPress={handleTimestampPress}
          currentTimestamp={playbackPosition}
        />
      </View>
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
    flex: 1,
    padding: 16,
  },
  recordingInfo: {
    marginBottom: 16,
  },
  recordingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.text,
  },
  waveformContainer: {
    marginBottom: 24,
  },
});