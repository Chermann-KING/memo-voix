import React from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Animated, 
  Easing,
  ViewStyle
} from 'react-native';
import { colors } from '@/constants/colors';

interface RecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  isRecording,
  onPress,
  size = 'large',
  style,
  disabled = false,
}) => {
  // Animation for the pulsing effect when recording
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [isRecording, pulseAnim]);
  
  const buttonSize = {
    small: 60,
    medium: 80,
    large: 100,
  }[size];
  
  const innerSize = {
    small: 50,
    medium: 70,
    large: 90,
  }[size];
  
  const stopSize = {
    small: 24,
    medium: 32,
    large: 40,
  }[size];
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            transform: [{ scale: isRecording ? pulseAnim : 1 }],
          },
        ]}
      />
      
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isRecording ? 'transparent' : colors.light.recording,
          },
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {isRecording ? (
          <View
            style={[
              styles.stopButton,
              {
                width: stopSize,
                height: stopSize,
                borderRadius: 4,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.innerCircle,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  innerCircle: {
    backgroundColor: colors.light.recording,
  },
  stopButton: {
    backgroundColor: colors.light.background,
  },
  disabled: {
    opacity: 0.5,
  },
});