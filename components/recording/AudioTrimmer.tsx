import React, { useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Text, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { formatDuration } from '@/utils/formatters';

interface AudioTrimmerProps {
  duration: number;
  onTrimsChange: (startTime: number, endTime: number) => void;
  initialStartTime?: number;
  initialEndTime?: number;
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({
  duration,
  onTrimsChange,
  initialStartTime = 0,
  initialEndTime,
}) => {
  // Ensure initial values are valid
  const validInitialStart = isFinite(initialStartTime) ? Math.max(0, initialStartTime) : 0;
  const validInitialEnd = isFinite(initialEndTime) 
    ? Math.min(duration, initialEndTime) 
    : duration;
  
  const [startPosition, setStartPosition] = useState(validInitialStart / duration);
  const [endPosition, setEndPosition] = useState(validInitialEnd / duration);
  
  // Update positions when duration or initial values change
  useEffect(() => {
    if (isFinite(duration) && duration > 0) {
      const validStart = isFinite(initialStartTime) ? Math.max(0, initialStartTime) : 0;
      const validEnd = isFinite(initialEndTime) ? Math.min(duration, initialEndTime) : duration;
      
      setStartPosition(validStart / duration);
      setEndPosition(validEnd / duration);
    }
  }, [duration, initialStartTime, initialEndTime]);
  
  // Notify parent component when trim positions change
  useEffect(() => {
    if (isFinite(duration) && duration > 0 && isFinite(startPosition) && isFinite(endPosition)) {
      const startTime = startPosition * duration;
      const endTime = endPosition * duration;
      onTrimsChange(startTime, endTime);
    }
  }, [startPosition, endPosition, duration, onTrimsChange]);
  
  // Create pan responders for the handles
  const startHandlePanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Web implementation is different
        if (Platform.OS === 'web') {
          // Handle web drag events in the onDrag handlers below
          return;
        }
        
        // Calculate new position based on drag
        const containerWidth = 300; // Approximate width, will be adjusted by layout
        const newPosition = Math.max(0, Math.min(endPosition - 0.05, gestureState.moveX / containerWidth));
        
        if (isFinite(newPosition)) {
          setStartPosition(newPosition);
        }
      },
      onPanResponderRelease: () => {
        // Notify parent of final position
        if (isFinite(startPosition) && isFinite(endPosition) && isFinite(duration)) {
          onTrimsChange(startPosition * duration, endPosition * duration);
        }
      },
    })
  ).current;
  
  const endHandlePanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Web implementation is different
        if (Platform.OS === 'web') {
          // Handle web drag events in the onDrag handlers below
          return;
        }
        
        // Calculate new position based on drag
        const containerWidth = 300; // Approximate width, will be adjusted by layout
        const newPosition = Math.min(1, Math.max(startPosition + 0.05, gestureState.moveX / containerWidth));
        
        if (isFinite(newPosition)) {
          setEndPosition(newPosition);
        }
      },
      onPanResponderRelease: () => {
        // Notify parent of final position
        if (isFinite(startPosition) && isFinite(endPosition) && isFinite(duration)) {
          onTrimsChange(startPosition * duration, endPosition * duration);
        }
      },
    })
  ).current;
  
  // Web-specific drag handlers
  const handleStartDrag = (e: any) => {
    if (Platform.OS !== 'web') return;
    
    e.preventDefault();
    
    const startX = e.clientX;
    const startPos = startPosition;
    
    const handleMouseMove = (moveEvent: any) => {
      const containerElement = document.getElementById('trimmer-container');
      if (!containerElement) return;
      
      const rect = containerElement.getBoundingClientRect();
      const containerWidth = rect.width;
      const deltaX = moveEvent.clientX - startX;
      const deltaPosition = deltaX / containerWidth;
      
      const newPosition = Math.max(0, Math.min(endPosition - 0.05, startPos + deltaPosition));
      
      if (isFinite(newPosition)) {
        setStartPosition(newPosition);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Notify parent of final position
      if (isFinite(startPosition) && isFinite(endPosition) && isFinite(duration)) {
        onTrimsChange(startPosition * duration, endPosition * duration);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleEndDrag = (e: any) => {
    if (Platform.OS !== 'web') return;
    
    e.preventDefault();
    
    const startX = e.clientX;
    const endPos = endPosition;
    
    const handleMouseMove = (moveEvent: any) => {
      const containerElement = document.getElementById('trimmer-container');
      if (!containerElement) return;
      
      const rect = containerElement.getBoundingClientRect();
      const containerWidth = rect.width;
      const deltaX = moveEvent.clientX - startX;
      const deltaPosition = deltaX / containerWidth;
      
      const newPosition = Math.min(1, Math.max(startPosition + 0.05, endPos + deltaPosition));
      
      if (isFinite(newPosition)) {
        setEndPosition(newPosition);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Notify parent of final position
      if (isFinite(startPosition) && isFinite(endPosition) && isFinite(duration)) {
        onTrimsChange(startPosition * duration, endPosition * duration);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <View style={styles.container} id="trimmer-container">
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>{formatDuration(0)}</Text>
        <Text style={styles.timeLabel}>{formatDuration(duration)}</Text>
      </View>
      
      <View style={styles.trimmerContainer}>
        {/* Left inactive area */}
        <View
          style={[
            styles.inactiveArea,
            { flex: Math.max(0, startPosition) },
          ]}
        />
        
        {/* Left handle */}
        <View
          style={styles.handle}
          {...startHandlePanResponder.panHandlers}
          onTouchStart={(e) => Platform.OS === 'web' && e.preventDefault()}
          onMouseDown={handleStartDrag}
        >
          <View style={styles.handleBar} />
        </View>
        
        {/* Active area */}
        <View
          style={[
            styles.activeArea,
            { flex: Math.max(0.1, endPosition - startPosition) },
          ]}
        />
        
        {/* Right handle */}
        <View
          style={styles.handle}
          {...endHandlePanResponder.panHandlers}
          onTouchStart={(e) => Platform.OS === 'web' && e.preventDefault()}
          onMouseDown={handleEndDrag}
        >
          <View style={styles.handleBar} />
        </View>
        
        {/* Right inactive area */}
        <View
          style={[
            styles.inactiveArea,
            { flex: Math.max(0, 1 - endPosition) },
          ]}
        />
      </View>
      
      <View style={styles.timeLabels}>
        <Text style={styles.selectedTimeLabel}>
          {formatDuration(startPosition * duration)}
        </Text>
        <Text style={styles.selectedTimeLabel}>
          {formatDuration(endPosition * duration)}
        </Text>
      </View>
      
      <Text style={styles.durationLabel}>
        Selected: {formatDuration((endPosition - startPosition) * duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  selectedTimeLabel: {
    fontSize: 14,
    color: colors.light.primary,
    fontWeight: '500',
  },
  trimmerContainer: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    marginVertical: 8,
  },
  inactiveArea: {
    height: 4,
    backgroundColor: colors.light.inactive,
  },
  activeArea: {
    height: 4,
    backgroundColor: colors.light.primary,
  },
  handle: {
    width: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  handleBar: {
    width: 4,
    height: 24,
    backgroundColor: colors.light.primary,
    borderRadius: 2,
  },
  durationLabel: {
    fontSize: 14,
    color: colors.light.text,
    textAlign: 'center',
    marginTop: 8,
  },
});