import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { Cloud, Smartphone, RefreshCw, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';

export default function StorageManagementScreen() {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [autoCloudBackup, setAutoCloudBackup] = useState(true);
  
  // Mock storage data
  const storageData = {
    local: {
      used: 120, // MB
      total: 1024, // MB
    },
    cloud: {
      used: 350, // MB
      total: 5120, // MB
    },
  };
  
  const handleSync = () => {
    setSyncInProgress(true);
    
    // Simulate sync process
    setTimeout(() => {
      setSyncInProgress(false);
    }, 2000);
  };
  
  const handleToggleAutoBackup = () => {
    setAutoCloudBackup(!autoCloudBackup);
  };
  
  const calculatePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };
  
  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Storage Management',
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>Device Storage</Text>
          
          <View style={styles.storageInfo}>
            <View style={styles.storageIcon}>
              <Smartphone size={24} color={colors.light.text} />
            </View>
            
            <View style={styles.storageDetails}>
              <View style={styles.storageHeader}>
                <Text style={styles.storageTitle}>Internal Storage</Text>
                <Text style={styles.storageValue}>
                  {formatStorage(storageData.local.used)} / {formatStorage(storageData.local.total)}
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${calculatePercentage(storageData.local.used, storageData.local.total)}%` }
                  ]} 
                />
              </View>
              
              <Text style={styles.storagePercentage}>
                {calculatePercentage(storageData.local.used, storageData.local.total)}% used
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>Cloud Storage</Text>
          
          <View style={styles.storageInfo}>
            <View style={styles.storageIcon}>
              <Cloud size={24} color={colors.light.text} />
            </View>
            
            <View style={styles.storageDetails}>
              <View style={styles.storageHeader}>
                <Text style={styles.storageTitle}>Google Drive</Text>
                <Text style={styles.storageValue}>
                  {formatStorage(storageData.cloud.used)} / {formatStorage(storageData.cloud.total)}
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${calculatePercentage(storageData.cloud.used, storageData.cloud.total)}%`,
                      backgroundColor: colors.light.primary,
                    }
                  ]} 
                />
              </View>
              
              <Text style={styles.storagePercentage}>
                {calculatePercentage(storageData.cloud.used, storageData.cloud.total)}% used
              </Text>
            </View>
          </View>
          
          <View style={styles.cloudSettings}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Backup to Cloud</Text>
              <Switch
                value={autoCloudBackup}
                onValueChange={handleToggleAutoBackup}
                trackColor={{ false: colors.light.inactive, true: colors.light.primary }}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <Button
            title="Sync Now"
            onPress={handleSync}
            isLoading={syncInProgress}
            style={styles.syncButton}
          />
          
          <Button
            title="Clear Local Cache"
            variant="outline"
            style={styles.clearButton}
          />
        </View>
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
  storageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 16,
  },
  storageInfo: {
    flexDirection: 'row',
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
  },
  storageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storageDetails: {
    flex: 1,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
  },
  storageValue: {
    fontSize: 16,
    color: colors.light.subtext,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.light.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.light.secondary,
    borderRadius: 4,
  },
  storagePercentage: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  cloudSettings: {
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.light.text,
  },
  actionsSection: {
    marginTop: 16,
  },
  syncButton: {
    marginBottom: 12,
  },
  clearButton: {
    borderColor: colors.light.error,
  },
});