export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  recordingQuality: 'low' | 'medium' | 'high';
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  syncWhileCharging: boolean;
  backgroundRecording: boolean;
  autoTranscribe: boolean;
  autoDeleteAfterSync: boolean;
  autoDeleteAfterDays: number | null;
  securityEnabled: boolean;
  biometricEnabled: boolean;
  encryptByDefault: boolean;
}