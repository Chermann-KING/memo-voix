import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { X, FolderPlus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Folder } from '@/types/folder';
import { FolderItem } from './FolderItem';
import { FolderBreadcrumb } from './FolderBreadcrumb';
import { Button } from '@/components/ui/Button';

interface FolderPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectFolder: (folder: Folder) => void;
  folders: Folder[];
  initialFolderId?: string | null;
  title?: string;
  createNewFolder?: (name: string, parentId: string | null) => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
  visible,
  onClose,
  onSelectFolder,
  folders,
  initialFolderId = null,
  title = 'Select Folder',
  createNewFolder,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Get current folder's subfolders
  const currentSubfolders = folders.filter(folder => folder.parentId === currentFolderId);
  
  // Update folder path when current folder changes
  useEffect(() => {
    if (currentFolderId === null) {
      setFolderPath([]);
      return;
    }
    
    const path: Folder[] = [];
    let folderId = currentFolderId;
    
    while (folderId) {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        path.unshift(folder);
        folderId = folder.parentId;
      } else {
        break;
      }
    }
    
    setFolderPath(path);
  }, [currentFolderId, folders]);
  
  const handleFolderPress = (folder: Folder) => {
    setCurrentFolderId(folder.id);
  };
  
  const handleBreadcrumbPress = (folder: Folder | null) => {
    setCurrentFolderId(folder?.id || null);
  };
  
  const handleSelectFolder = (folder: Folder) => {
    onSelectFolder(folder);
    onClose();
  };
  
  const handleCreateFolder = () => {
    if (createNewFolder && newFolderName.trim()) {
      createNewFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          </View>
          
          <FolderBreadcrumb 
            path={folderPath}
            onFolderPress={handleBreadcrumbPress}
          />
          
          {createNewFolder && (
            <View style={styles.newFolderSection}>
              {showNewFolderInput ? (
                <View style={styles.newFolderInput}>
                  <TextInput
                    style={styles.input}
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    placeholder="Folder name"
                    autoFocus
                  />
                  <View style={styles.newFolderButtons}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      size="small"
                      onPress={() => {
                        setShowNewFolderInput(false);
                        setNewFolderName('');
                      }}
                      style={styles.cancelButton}
                    />
                    <Button
                      title="Create"
                      size="small"
                      onPress={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                    />
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.newFolderButton}
                  onPress={() => setShowNewFolderInput(true)}
                >
                  <FolderPlus size={20} color={colors.light.primary} />
                  <Text style={styles.newFolderText}>New Folder</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <FlatList
            data={currentSubfolders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FolderItem
                folder={item}
                onPress={handleSelectFolder}
                recordingsCount={0} // In a real app, you would calculate this
                subFoldersCount={folders.filter(f => f.parentId === item.id).length}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {currentFolderId === null
                    ? 'No folders found. Create a new folder to get started.'
                    : 'This folder is empty. Create a new subfolder or select a different folder.'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.light.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.subtext,
    textAlign: 'center',
  },
  newFolderSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newFolderText: {
    fontSize: 16,
    color: colors.light.primary,
    marginLeft: 8,
  },
  newFolderInput: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.light.text,
    marginBottom: 8,
  },
  newFolderButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 8,
  },
});

// Import TextInput for the component
import { TextInput } from 'react-native';