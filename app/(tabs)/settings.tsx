import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, Moon, Sun, CloudUpload, Wifi, Battery, Shield, Fingerprint, Clock } from 'lucide-react-native';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

export default function SettingsScreen() {
  const { 
    theme, 
    recordingQuality, 
    autoSync, 
    syncOnWifiOnly, 
    syncWhileCharging,
    backgroundRecording,
    autoTranscribe,
    securityEnabled,
    biometricEnabled,
    autoDeleteAfterSync,
    autoDeleteAfterDays,
    updateSettings,
    resetSettings
  } = useSettings();
  
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  const toggleAutoSync = () => {
    updateSettings({ autoSync: !autoSync });
  };

  const toggleSyncOnWifiOnly = () => {
    updateSettings({ syncOnWifiOnly: !syncOnWifiOnly });
  };

  const toggleSyncWhileCharging = () => {
    updateSettings({ syncWhileCharging: !syncWhileCharging });
  };

  const toggleBackgroundRecording = () => {
    updateSettings({ backgroundRecording: !backgroundRecording });
  };

  const toggleAutoTranscribe = () => {
    updateSettings({ autoTranscribe: !autoTranscribe });
  };

  const toggleSecurityEnabled = () => {
    updateSettings({ securityEnabled: !securityEnabled });
  };

  const toggleBiometricEnabled = () => {
    updateSettings({ biometricEnabled: !biometricEnabled });
  };

  const toggleAutoDeleteAfterSync = () => {
    updateSettings({ autoDeleteAfterSync: !autoDeleteAfterSync });
  };

  const handleRecordingQualityPress = () => {
    router.push('/settings/recording-quality');
  };

  const handleStorageManagementPress = () => {
    router.push('/settings/storage');
  };

  const handleAutoDeletePress = () => {
    router.push('/settings/auto-delete');
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Settings',
        }}
      />

      {/* Profile Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.profileItem} onPress={handleProfilePress}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          <ChevronRight size={20} color={colors.light.subtext} />
        </TouchableOpacity>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            {theme === 'light' ? (
              <Sun size={20} color={colors.light.text} />
            ) : (
              <Moon size={20} color={colors.light.text} />
            )}
            <Text style={styles.settingLabel}>Dark Theme</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
      </View>

      {/* Recording Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recording</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleRecordingQualityPress}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Recording Quality</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.settingValueText}>
              {recordingQuality.charAt(0).toUpperCase() + recordingQuality.slice(1)}
            </Text>
            <ChevronRight size={20} color={colors.light.subtext} />
          </View>
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Background Recording</Text>
          </View>
          <Switch
            value={backgroundRecording}
            onValueChange={toggleBackgroundRecording}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Transcribe</Text>
          </View>
          <Switch
            value={autoTranscribe}
            onValueChange={toggleAutoTranscribe}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
      </View>

      {/* Sync Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync & Storage</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <CloudUpload size={20} color={colors.light.text} />
            <Text style={styles.settingLabel}>Auto Sync</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={toggleAutoSync}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
        {autoSync && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Wifi size={20} color={colors.light.text} />
                <Text style={styles.settingLabel}>Sync on Wi-Fi Only</Text>
              </View>
              <Switch
                value={syncOnWifiOnly}
                onValueChange={toggleSyncOnWifiOnly}
                trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Battery size={20} color={colors.light.text} />
                <Text style={styles.settingLabel}>Sync While Charging</Text>
              </View>
              <Switch
                value={syncWhileCharging}
                onValueChange={toggleSyncWhileCharging}
                trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
              />
            </View>
          </>
        )}
        <TouchableOpacity style={styles.settingItem} onPress={handleStorageManagementPress}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Storage Management</Text>
          </View>
          <ChevronRight size={20} color={colors.light.subtext} />
        </TouchableOpacity>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Clock size={20} color={colors.light.text} />
            <Text style={styles.settingLabel}>Auto Delete After Sync</Text>
          </View>
          <Switch
            value={autoDeleteAfterSync}
            onValueChange={toggleAutoDeleteAfterSync}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
        {autoDeleteAfterSync && (
          <TouchableOpacity style={styles.settingItem} onPress={handleAutoDeletePress}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto Delete After</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>
                {autoDeleteAfterDays} days
              </Text>
              <ChevronRight size={20} color={colors.light.subtext} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Shield size={20} color={colors.light.text} />
            <Text style={styles.settingLabel}>Enable Security</Text>
          </View>
          <Switch
            value={securityEnabled}
            onValueChange={toggleSecurityEnabled}
            trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
          />
        </View>
        {securityEnabled && (
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Fingerprint size={20} color={colors.light.text} />
              <Text style={styles.settingLabel}>Use Biometric Authentication</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometricEnabled}
              trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
            />
          </View>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Button
          title="Reset Settings"
          variant="outline"
          onPress={resetSettings}
          style={styles.resetButton}
        />
        <Button
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>MémoVoix v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.primary,
    marginBottom: 8,
    marginTop: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.light.text,
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    color: colors.light.subtext,
    marginRight: 8,
  },
  resetButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: colors.light.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: colors.light.subtext,
  },
});