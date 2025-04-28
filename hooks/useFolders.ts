import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder, FolderState } from '@/types/folder';
import { Recording } from '@/types/recording';

interface FoldersStore extends FolderState {
  // CRUD operations
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  
  // Folder structure operations
  moveFolder: (folderId: string, newParentId: string | null) => void;
  
  // Recording management
  addRecordingToFolder: (folderId: string, recordingId: string) => void;
  removeRecordingFromFolder: (folderId: string, recordingId: string) => void;
  moveRecordingToFolder: (recordingId: string, sourceFolderId: string, targetFolderId: string) => void;
  
  // Queries
  getFolderById: (id: string) => Folder | undefined;
  getSubfolders: (parentId: string | null) => Folder[];
  getRootFolders: () => Folder[];
  getFolderPath: (folderId: string) => Folder[];
}

// Sample data for demo purposes
const sampleFolders: Folder[] = [
  {
    id: '1',
    name: 'Work',
    parentId: null,
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-10-01T10:00:00Z',
    color: '#4A6FA5',
  },
  {
    id: '2',
    name: 'Personal',
    parentId: null,
    createdAt: '2023-10-01T11:00:00Z',
    updatedAt: '2023-10-01T11:00:00Z',
    color: '#FF9A8B',
  },
  {
    id: '3',
    name: 'Project Alpha',
    parentId: '1',
    createdAt: '2023-10-02T09:00:00Z',
    updatedAt: '2023-10-02T09:00:00Z',
  },
  {
    id: '4',
    name: 'Client Meetings',
    parentId: '1',
    createdAt: '2023-10-02T10:00:00Z',
    updatedAt: '2023-10-02T10:00:00Z',
  },
  {
    id: '5',
    name: 'Ideas',
    parentId: '2',
    createdAt: '2023-10-03T14:00:00Z',
    updatedAt: '2023-10-03T14:00:00Z',
  }
];

// Map to track which recordings are in which folders
const recordingFolderMap: Record<string, string[]> = {
  '1': ['1'], // Work folder contains recording 1
  '3': ['2'], // Project Alpha folder contains recording 2
  '5': ['3']  // Ideas folder contains recording 3
};

export const useFolders = create<FoldersStore>()(
  persist(
    (set, get) => ({
      folders: sampleFolders,
      isLoading: false,
      error: null,
      
      createFolder: (folderData) => {
        const newFolder: Folder = {
          ...folderData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        
        // Initialize empty recording list for this folder
        recordingFolderMap[newFolder.id] = [];
      },
      
      updateFolder: (id, data) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id
              ? { ...folder, ...data, updatedAt: new Date().toISOString() }
              : folder
          ),
        }));
      },
      
      deleteFolder: (id) => {
        const { folders } = get();
        
        // Get all subfolders recursively
        const getAllSubfolderIds = (folderId: string): string[] => {
          const directSubfolders = folders.filter(f => f.parentId === folderId);
          const directSubfolderIds = directSubfolders.map(f => f.id);
          
          const allSubfolderIds = [...directSubfolderIds];
          
          directSubfolderIds.forEach(subId => {
            allSubfolderIds.push(...getAllSubfolderIds(subId));
          });
          
          return allSubfolderIds;
        };
        
        const subfolderIds = getAllSubfolderIds(id);
        const allFolderIdsToDelete = [id, ...subfolderIds];
        
        // Delete the folders
        set((state) => ({
          folders: state.folders.filter(folder => !allFolderIdsToDelete.includes(folder.id)),
        }));
        
        // Clean up recording-folder mappings
        allFolderIdsToDelete.forEach(folderId => {
          delete recordingFolderMap[folderId];
        });
      },
      
      moveFolder: (folderId, newParentId) => {
        // Prevent moving a folder to its own descendant
        if (newParentId) {
          const { getFolderPath } = get();
          const path = getFolderPath(newParentId);
          if (path.some(folder => folder.id === folderId)) {
            set({ error: "Cannot move a folder to its own descendant" });
            return;
          }
        }
        
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? { ...folder, parentId: newParentId, updatedAt: new Date().toISOString() }
              : folder
          ),
        }));
      },
      
      addRecordingToFolder: (folderId, recordingId) => {
        if (!recordingFolderMap[folderId]) {
          recordingFolderMap[folderId] = [];
        }
        
        if (!recordingFolderMap[folderId].includes(recordingId)) {
          recordingFolderMap[folderId] = [...recordingFolderMap[folderId], recordingId];
        }
      },
      
      removeRecordingFromFolder: (folderId, recordingId) => {
        if (recordingFolderMap[folderId]) {
          recordingFolderMap[folderId] = recordingFolderMap[folderId].filter(id => id !== recordingId);
        }
      },
      
      moveRecordingToFolder: (recordingId, sourceFolderId, targetFolderId) => {
        const { removeRecordingFromFolder, addRecordingToFolder } = get();
        removeRecordingFromFolder(sourceFolderId, recordingId);
        addRecordingToFolder(targetFolderId, recordingId);
      },
      
      getFolderById: (id) => {
        return get().folders.find(folder => folder.id === id);
      },
      
      getSubfolders: (parentId) => {
        return get().folders.filter(folder => folder.parentId === parentId);
      },
      
      getRootFolders: () => {
        return get().folders.filter(folder => folder.parentId === null);
      },
      
      getFolderPath: (folderId) => {
        const path: Folder[] = [];
        const { folders } = get();
        
        let currentFolder = folders.find(f => f.id === folderId);
        while (currentFolder) {
          path.unshift(currentFolder);
          
          if (currentFolder.parentId === null) {
            break;
          }
          
          currentFolder = folders.find(f => f.id === currentFolder?.parentId);
        }
        
        return path;
      },
    }),
    {
      name: 'folders-storage',
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

// Helper function to get recordings in a folder
export const getRecordingsInFolder = (folderId: string, allRecordings: Recording[]): Recording[] => {
  const recordingIds = recordingFolderMap[folderId] || [];
  return allRecordings.filter(recording => recordingIds.includes(recording.id));
};