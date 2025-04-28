import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { RecordButton } from '@/components/ui/RecordButton';
import { Waveform } from '@/components/ui/Waveform';
import { colors } from '@/constants/colors';

interface RecordingControlsProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  recordingTime: number;
  disabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording,
  recordingTime,
  disabled = false,
}) => {
  const [amplitude, setAmplitude] = useState(0.5);
  
  // Simulate changing amplitude for the waveform
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setAmplitude(Math.random() * 0.5 + 0.3); // Random value between 0.3 and 0.8
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleRecordPress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };
  
  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.waveformContainer}>
          <Waveform 
            isRecording={isRecording} 
            amplitude={amplitude}
            barCount={Platform.OS === 'web' ? 20 : 40}
          />
        </View>
      )}
      
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {isRecording ? formatTime(recordingTime) : 'Ready to record'}
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordPress}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  waveformContainer: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    marginBottom: 24,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.light.text,
  },
  buttonContainer: {
    marginBottom: 16,
  },
});