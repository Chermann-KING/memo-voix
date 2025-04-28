import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { colors } from '@/constants/colors';

export default function RecordingQualityScreen() {
  const { recordingQuality, updateSettings } = useSettings();
  const router = useRouter();
  
  const qualities = [
    {
      value: 'low',
      label: 'Low',
      description: 'Smaller file size, lower quality (64 kbps)',
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Balanced quality and size (128 kbps)',
    },
    {
      value: 'high',
      label: 'High',
      description: 'Best quality, larger file size (256 kbps)',
    },
  ];
  
  const handleQualitySelect = (quality: 'low' | 'medium' | 'high') => {
    updateSettings({ recordingQuality: quality });
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Recording Quality',
        }}
      />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Select the quality level for your recordings. Higher quality results in larger file sizes.
        </Text>
        
        {qualities.map((quality) => (
          <TouchableOpacity
            key={quality.value}
            style={styles.qualityItem}
            onPress={() => handleQualitySelect(quality.value as 'low' | 'medium' | 'high')}
          >
            <View style={styles.qualityInfo}>
              <Text style={styles.qualityLabel}>{quality.label}</Text>
              <Text style={styles.qualityDescription}>{quality.description}</Text>
            </View>
            
            {recordingQuality === quality.value && (
              <Check size={24} color={colors.light.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: colors.light.subtext,
    marginBottom: 24,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 4,
  },
  qualityDescription: {
    fontSize: 14,
    color: colors.light.subtext,
  },
});