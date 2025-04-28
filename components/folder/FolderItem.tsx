import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder, FolderOpen, MoreVertical } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Folder as FolderType } from '@/types/folder';

interface FolderItemProps {
  folder: FolderType;
  onPress: (folder: FolderType) => void;
  onLongPress?: (folder: FolderType) => void;
  onOptionsPress?: (folder: FolderType) => void;
  isSelected?: boolean;
  recordingsCount?: number;
  subFoldersCount?: number;
}

export const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  onPress,
  onLongPress,
  onOptionsPress,
  isSelected = false,
  recordingsCount = 0,
  subFoldersCount = 0,
}) => {
  const handlePress = () => {
    onPress(folder);
  };
  
  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(folder);
    }
  };
  
  const handleOptionsPress = (e: any) => {
    e.stopPropagation();
    if (onOptionsPress) {
      onOptionsPress(folder);
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View 
        style={[
          styles.iconContainer,
          { backgroundColor: folder.color || colors.light.primary }
        ]}
      >
        {isSelected ? (
          <FolderOpen size={24} color="#FFFFFF" />
        ) : (
          <Folder size={24} color="#FFFFFF" />
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.folderName} numberOfLines={1}>
          {folder.name}
        </Text>
        
        <Text style={styles.folderInfo}>
          {recordingsCount} recording{recordingsCount !== 1 ? 's' : ''}
          {subFoldersCount > 0 && `, ${subFoldersCount} subfolder${subFoldersCount !== 1 ? 's' : ''}`}
        </Text>
      </View>
      
      {onOptionsPress && (
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={handleOptionsPress}
        >
          <MoreVertical size={20} color={colors.light.subtext} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.light.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedContainer: {
    backgroundColor: `${colors.light.primary}10`, // 10% opacity
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 4,
  },
  folderInfo: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  optionsButton: {
    padding: 8,
  },
});