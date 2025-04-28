import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '@/constants/colors';

interface WaveformProps {
  isRecording: boolean;
  amplitude?: number; // 0 to 1
  barCount?: number;
  height?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  isRecording,
  amplitude = 0.5,
  barCount = 30,
  height = 60,
}) => {
  // Create animated values for each bar
  const animatedValues = useRef<Animated.Value[]>(
    Array(barCount).fill(0).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Animate each bar with a random height and duration
      const animations = animatedValues.map((value, index) => {
        // Reset to a small value
        value.setValue(0.1);
        
        // Create a sequence of animations for continuous movement
        return Animated.loop(
          Animated.sequence([
            Animated.timing(value, {
              toValue: Math.random() * amplitude + 0.1, // Random height based on amplitude
              duration: Math.random() * 700 + 300, // Random duration between 300ms and 1000ms
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(value, {
              toValue: Math.random() * amplitude + 0.1,
              duration: Math.random() * 700 + 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      });
      
      // Start all animations
      Animated.parallel(animations).start();
    } else {
      // Reset all bars to a small value when not recording
      animatedValues.forEach(value => {
        Animated.timing(value, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
    
    return () => {
      // Stop all animations on unmount
      animatedValues.forEach(value => value.stopAnimation());
    };
  }, [isRecording, amplitude, animatedValues]);

  return (
    <View style={[styles.container, { height }]}>
      {animatedValues.map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: '100%',
              transform: [
                { 
                  scaleY: value 
                }
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  bar: {
    width: 3,
    backgroundColor: colors.light.waveform,
    borderRadius: 2,
  },
});