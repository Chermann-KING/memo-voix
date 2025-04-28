import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CollaborationState, SharedRecording, Collaborator, Comment, CollaborationRole } from '@/types/collaboration';
import { useAuth } from './useAuth';

interface CollaborationStore extends CollaborationState {
  // Sharing operations
  shareRecording: (recordingId: string, collaborators: Omit<Collaborator, 'addedAt'>[]) => void;
  updateCollaborator: (recordingId: string, userId: string, role: CollaborationRole) => void;
  removeCollaborator: (recordingId: string, userId: string) => void;
  unshareRecording: (recordingId: string) => void;
  
  // Comments
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (commentId: string, content: string) => void;
  deleteComment: (commentId: string) => void;
  
  // Queries
  getSharedRecording: (recordingId: string) => SharedRecording | undefined;
  getRecordingComments: (recordingId: string) => Comment[];
  getSharedWithMe: () => string[]; // Returns recordingIds shared with current user
  getMySharedRecordings: () => string[]; // Returns recordingIds shared by current user
}

// Sample data for demo purposes
const sampleSharedRecordings: SharedRecording[] = [
  {
    recordingId: '1',
    sharedBy: '1', // User ID 1 (demo user)
    sharedAt: '2023-10-20T14:30:00Z',
    collaborators: [
      {
        userId: '2',
        role: 'viewer',
        addedAt: '2023-10-20T14:30:00Z',
      },
      {
        userId: '3',
        role: 'editor',
        addedAt: '2023-10-20T14:35:00Z',
      }
    ]
  }
];

const sampleComments: Comment[] = [
  {
    id: '1',
    recordingId: '1',
    userId: '3',
    content: "This part about the project timeline is important.",
    timestamp: 120, // 2 minutes into the recording
    createdAt: '2023-10-21T09:15:00Z',
    updatedAt: '2023-10-21T09:15:00Z',
  },
  {
    id: '2',
    recordingId: '1',
    userId: '1',
    content: "Let's discuss this section in our next meeting.",
    timestamp: 305, // 5:05 into the recording
    createdAt: '2023-10-21T10:20:00Z',
    updatedAt: '2023-10-21T10:20:00Z',
  }
];

export const useCollaboration = create<CollaborationStore>()(
  persist(
    (set, get) => ({
      sharedRecordings: sampleSharedRecordings,
      comments: sampleComments,
      isLoading: false,
      error: null,
      
      shareRecording: (recordingId, collaborators) => {
        const { user } = useAuth.getState();
        if (!user) {
          set({ error: "User must be logged in to share recordings" });
          return;
        }
        
        // Check if recording is already shared
        const existingShared = get().sharedRecordings.find(sr => sr.recordingId === recordingId);
        
        if (existingShared) {
          // Update existing shared recording
          set((state) => ({
            sharedRecordings: state.sharedRecordings.map(sr => 
              sr.recordingId === recordingId
                ? {
                    ...sr,
                    collaborators: [
                      ...sr.collaborators,
                      ...collaborators.map(c => ({
                        ...c,
                        addedAt: new Date().toISOString()
                      }))
                    ]
                  }
                : sr
            )
          }));
        } else {
          // Create new shared recording
          const newSharedRecording: SharedRecording = {
            recordingId,
            sharedBy: user.id,
            sharedAt: new Date().toISOString(),
            collaborators: collaborators.map(c => ({
              ...c,
              addedAt: new Date().toISOString()
            }))
          };
          
          set((state) => ({
            sharedRecordings: [...state.sharedRecordings, newSharedRecording]
          }));
        }
      },
      
      updateCollaborator: (recordingId, userId, role) => {
        set((state) => ({
          sharedRecordings: state.sharedRecordings.map(sr => 
            sr.recordingId === recordingId
              ? {
                  ...sr,
                  collaborators: sr.collaborators.map(c => 
                    c.userId === userId
                      ? { ...c, role }
                      : c
                  )
                }
              : sr
          )
        }));
      },
      
      removeCollaborator: (recordingId, userId) => {
        set((state) => ({
          sharedRecordings: state.sharedRecordings.map(sr => 
            sr.recordingId === recordingId
              ? {
                  ...sr,
                  collaborators: sr.collaborators.filter(c => c.userId !== userId)
                }
              : sr
          ).filter(sr => sr.collaborators.length > 0) // Remove shared recording if no collaborators left
        }));
      },
      
      unshareRecording: (recordingId) => {
        set((state) => ({
          sharedRecordings: state.sharedRecordings.filter(sr => sr.recordingId !== recordingId)
        }));
      },
      
      addComment: (commentData) => {
        const { user } = useAuth.getState();
        if (!user) {
          set({ error: "User must be logged in to add comments" });
          return;
        }
        
        const newComment: Comment = {
          ...commentData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          comments: [...state.comments, newComment]
        }));
      },
      
      updateComment: (commentId, content) => {
        set((state) => ({
          comments: state.comments.map(comment => 
            comment.id === commentId
              ? { ...comment, content, updatedAt: new Date().toISOString() }
              : comment
          )
        }));
      },
      
      deleteComment: (commentId) => {
        set((state) => ({
          comments: state.comments.filter(comment => comment.id !== commentId)
        }));
      },
      
      getSharedRecording: (recordingId) => {
        return get().sharedRecordings.find(sr => sr.recordingId === recordingId);
      },
      
      getRecordingComments: (recordingId) => {
        return get().comments.filter(comment => comment.recordingId === recordingId);
      },
      
      getSharedWithMe: () => {
        const { user } = useAuth.getState();
        if (!user) return [];
        
        return get().sharedRecordings
          .filter(sr => sr.collaborators.some(c => c.userId === user.id))
          .map(sr => sr.recordingId);
      },
      
      getMySharedRecordings: () => {
        const { user } = useAuth.getState();
        if (!user) return [];
        
        return get().sharedRecordings
          .filter(sr => sr.sharedBy === user.id)
          .map(sr => sr.recordingId);
      },
    }),
    {
      name: 'collaboration-storage',
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