import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronRight, Home } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Folder } from '@/types/folder';

interface FolderBreadcrumbProps {
  path: Folder[];
  onFolderPress: (folder: Folder | null) => void;
}

export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  path,
  onFolderPress,
}) => {
  const handleHomePress = () => {
    onFolderPress(null);
  };
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity 
        style={styles.breadcrumbItem}
        onPress={handleHomePress}
      >
        <Home size={16} color={colors.light.primary} />
        <Text style={styles.breadcrumbText}>Home</Text>
      </TouchableOpacity>
      
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight size={16} color={colors.light.subtext} />
          <TouchableOpacity 
            style={styles.breadcrumbItem}
            onPress={() => onFolderPress(folder)}
          >
            <Text 
              style={[
                styles.breadcrumbText,
                index === path.length - 1 && styles.currentBreadcrumb
              ]}
            >
              {folder.name}
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: colors.light.subtext,
    marginLeft: 4,
  },
  currentBreadcrumb: {
    color: colors.light.text,
    fontWeight: '500',
  },
});