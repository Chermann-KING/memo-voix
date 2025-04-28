import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { colors } from '@/constants/colors';

export default function AutoDeleteScreen() {
  const { autoDeleteAfterDays, updateSettings } = useSettings();
  const router = useRouter();
  
  const options = [
    { value: 7, label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: null, label: 'Never' },
  ];
  
  const handleOptionSelect = (value: number | null) => {
    updateSettings({ autoDeleteAfterDays: value });
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Auto Delete',
        }}
      />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Choose how long to keep recordings on your device after they have been synced to the cloud.
        </Text>
        
        {options.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={styles.optionItem}
            onPress={() => handleOptionSelect(option.value)}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            
            {autoDeleteAfterDays === option.value && (
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  optionLabel: {
    fontSize: 18,
    color: colors.light.text,
  },
});