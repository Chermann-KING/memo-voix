import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FolderPlus, MoreVertical } from 'lucide-react-native';
import { useFolders, getRecordingsInFolder } from '@/hooks/useFolders';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { FolderItem } from '@/components/folder/FolderItem';
import { FolderBreadcrumb } from '@/components/folder/FolderBreadcrumb';
import { RecordingsList } from '@/components/recording/RecordingsList';
import { Folder } from '@/types/folder';
import { Recording } from '@/types/recording';

export default function FoldersScreen() {
  const { 
    folders, 
    getRootFolders, 
    getSubfolders, 
    getFolderById,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useFolders();
  
  const { recordings, toggleFavorite } = useRecordings();
  const router = useRouter();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [subfolders, setSubfolders] = useState<Folder[]>([]);
  const [folderRecordings, setFolderRecordings] = useState<Recording[]>([]);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  
  // Load folder data when current folder changes
  useEffect(() => {
    if (currentFolderId === null) {
      setCurrentFolder(null);
      setSubfolders(getRootFolders());
      setFolderPath([]);
    } else {
      const folder = getFolderById(currentFolderId);
      setCurrentFolder(folder || null);
      setSubfolders(getSubfolders(currentFolderId));
      
      // Build folder path
      const path: Folder[] = [];
      let folderId = currentFolderId;
      
      while (folderId) {
        const folder = getFolderById(folderId);
        if (folder) {
          path.unshift(folder);
          folderId = folder.parentId;
        } else {
          break;
        }
      }
      
      setFolderPath(path);
    }
    
    // Get recordings in this folder
    setFolderRecordings(
      currentFolderId === null 
        ? [] 
        : getRecordingsInFolder(currentFolderId, recordings)
    );
  }, [currentFolderId, folders, recordings]);
  
  const handleFolderPress = (folder: Folder) => {
    setCurrentFolderId(folder.id);
  };
  
  const handleBreadcrumbPress = (folder: Folder | null) => {
    setCurrentFolderId(folder?.id || null);
  };
  
  const handleRecordingPress = (recording: Recording) => {
    router.push({
      pathname: '/recording/[id]',
      params: { id: recording.id }
    });
  };
  
  const handleCreateFolder = () => {
    // In a real app, show a modal to enter folder name
    const folderName = prompt('Enter folder name:');
    
    if (folderName) {
      createFolder({
        name: folderName,
        parentId: currentFolderId,
      });
    }
  };
  
  const handleFolderOptions = (folder: Folder) => {
    if (Platform.OS === 'web') {
      const action = prompt(
        'Choose an action:\n1. Rename\n2. Delete',
        '1'
      );
      
      if (action === '1') {
        const newName = prompt('Enter new folder name:', folder.name);
        if (newName) {
          updateFolder(folder.id, { name: newName });
        }
      } else if (action === '2') {
        if (confirm('Are you sure you want to delete this folder?')) {
          deleteFolder(folder.id);
        }
      }
    } else {
      Alert.alert(
        'Folder Options',
        'Choose an action for this folder',
        [
          {
            text: 'Rename',
            onPress: () => {
              Alert.prompt(
                'Rename Folder',
                'Enter new folder name:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Rename',
                    onPress: (newName) => {
                      if (newName) {
                        updateFolder(folder.id, { name: newName });
                      }
                    }
                  }
                ],
                'plain-text',
                folder.name
              );
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Folder',
                'Are you sure you want to delete this folder?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteFolder(folder.id)
                  }
                ]
              );
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Folders',
          headerRight: () => (
            <TouchableOpacity onPress={handleCreateFolder} style={styles.headerButton}>
              <FolderPlus size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <FolderBreadcrumb 
        path={folderPath}
        onFolderPress={handleBreadcrumbPress}
      />
      
      {subfolders.length > 0 && (
        <View style={styles.subfoldersSection}>
          {subfolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              onPress={handleFolderPress}
              onOptionsPress={handleFolderOptions}
              recordingsCount={getRecordingsInFolder(folder.id, recordings).length}
              subFoldersCount={getSubfolders(folder.id).length}
            />
          ))}
        </View>
      )}
      
      <View style={styles.recordingsSection}>
        <RecordingsList
          recordings={folderRecordings}
          onRecordingPress={handleRecordingPress}
          onFavoriteToggle={toggleFavorite}
          emptyMessage={
            currentFolderId === null
              ? "Select a folder to view its recordings"
              : `No recordings in ${currentFolder?.name || 'this folder'}`
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerButton: {
    marginRight: 16,
  },
  subfoldersSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  recordingsSection: {
    flex: 1,
  },
});