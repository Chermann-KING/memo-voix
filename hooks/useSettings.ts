import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '@/types/settings';

interface SettingsState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  recordingQuality: 'medium',
  autoSync: true,
  syncOnWifiOnly: true,
  syncWhileCharging: false,
  backgroundRecording: true,
  autoTranscribe: false,
  autoDeleteAfterSync: false,
  autoDeleteAfterDays: 30,
  securityEnabled: false,
  biometricEnabled: false,
  encryptByDefault: false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      updateSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings,
        }));
      },
      
      resetSettings: () => {
        set(defaultSettings);
      },
    }),
    {
      name: 'settings-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);