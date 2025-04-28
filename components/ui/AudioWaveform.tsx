import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Platform } from 'react-native';
import { colors } from '@/constants/colors';

interface AudioWaveformProps {
  duration: number;
  currentPosition: number;
  onSeek: (position: number) => void;
  height?: number;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  duration,
  currentPosition,
  onSeek,
  height = 80,
  barCount = 50,
}) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Generate random waveform data on mount or when duration changes
  useEffect(() => {
    if (duration > 0) {
      generateWaveformData();
    }
  }, [duration, barCount]);
  
  const generateWaveformData = () => {
    // Generate random heights for the waveform bars
    const data: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Create a more natural looking waveform with some patterns
      const baseHeight = Math.random();
      const patternFactor = Math.sin(i / (barCount / 8)) * 0.3 + 0.7;
      data.push(baseHeight * patternFactor);
    }
    setWaveformData(data);
  };
  
  const handlePress = (event: any) => {
    // Get the position relative to the waveform width
    const { locationX, target } = event.nativeEvent;
    
    // On web, we need to measure the element to get its width
    if (Platform.OS === 'web') {
      const element = document.getElementById('waveform-container');
      if (element) {
        const rect = element.getBoundingClientRect();
        const position = (event.nativeEvent.clientX - rect.left) / rect.width;
        
        // Ensure position is between 0 and 1
        const clampedPosition = Math.max(0, Math.min(1, position));
        onSeek(clampedPosition);
      }
    } else {
      // For native platforms, we can use locationX
      // We need to measure the width of the container
      target.measure((_x: number, _y: number, width: number) => {
        const position = locationX / width;
        
        // Ensure position is between 0 and 1
        const clampedPosition = Math.max(0, Math.min(1, position));
        onSeek(clampedPosition);
      });
    }
  };
  
  // Calculate the progress as a percentage
  const progress = duration > 0 ? (currentPosition / duration) : 0;
  
  // Ensure progress is a finite number between 0 and 1
  const validProgress = isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  
  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View 
        style={[styles.container, { height }]}
        id="waveform-container"
      >
        {waveformData.map((value, index) => {
          const barHeight = value * height * 0.8;
          const position = index / (barCount - 1);
          const isActive = position <= validProgress;
          
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isActive ? colors.light.primary : colors.light.border,
                },
              ]}
            />
          );
        })}
        
        {/* Progress indicator */}
        <View
          style={[
            styles.progressIndicator,
            {
              left: `${validProgress * 100}%`,
              height: height * 0.9,
            },
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.light.background,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  progressIndicator: {
    position: 'absolute',
    width: 2,
    backgroundColor: colors.light.primary,
    borderRadius: 1,
  },
});