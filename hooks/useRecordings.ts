import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, RecordingFilter, RecordingCategory, Marker } from '@/types/recording';

interface RecordingsState {
  recordings: Recording[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  addRecording: (recording: Omit<Recording, 'id'>) => void;
  updateRecording: (id: string, data: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  
  // Markers
  addMarker: (recordingId: string, marker: Omit<Marker, 'id'>) => void;
  updateMarker: (recordingId: string, markerId: string, data: Partial<Marker>) => void;
  deleteMarker: (recordingId: string, markerId: string) => void;
  
  // Favorites
  toggleFavorite: (id: string) => void;
  
  // Filtering
  getFilteredRecordings: (filter: RecordingFilter) => Recording[];
  
  // Categories
  getCategories: () => RecordingCategory[];
  
  // Tags
  getAllTags: () => string[];
}

// Sample data for demo purposes
const sampleRecordings: Recording[] = [
  {
    id: '1',
    title: 'Project Kickoff Meeting',
    duration: 1825, // 30:25
    size: 15728640, // 15 MB
    createdAt: '2023-10-15T09:30:00Z',
    updatedAt: '2023-10-15T09:30:00Z',
    uri: 'file://recordings/meeting-1.m4a',
    category: 'meetings',
    tags: ['project', 'kickoff', 'team'],
    isFavorite: true,
    isEncrypted: false,
    transcription: 'This is a sample transcription of the meeting...',
    notes: 'Important points to follow up on...',
    markers: [
      { id: 'm1', timestamp: 120, label: 'Introduction' },
      { id: 'm2', timestamp: 360, label: 'Project Goals' },
      { id: 'm3', timestamp: 900, label: 'Timeline Discussion' },
    ],
    storageLocation: 'local',
  },
  {
    id: '2',
    title: 'Interview with John Smith',
    duration: 3600, // 1:00:00
    size: 31457280, // 30 MB
    createdAt: '2023-10-10T14:00:00Z',
    updatedAt: '2023-10-10T14:00:00Z',
    uri: 'file://recordings/interview-1.m4a',
    category: 'interviews',
    tags: ['candidate', 'engineering', 'senior'],
    isFavorite: false,
    isEncrypted: true,
    markers: [
      { id: 'm1', timestamp: 300, label: 'Background' },
      { id: 'm2', timestamp: 1200, label: 'Technical Questions' },
      { id: 'm3', timestamp: 2400, label: 'Candidate Questions' },
    ],
    storageLocation: 'cloud',
  },
  {
    id: '3',
    title: 'Product Idea Brainstorm',
    duration: 905, // 15:05
    size: 10485760, // 10 MB
    createdAt: '2023-10-05T16:45:00Z',
    updatedAt: '2023-10-05T16:45:00Z',
    uri: 'file://recordings/idea-1.m4a',
    category: 'ideas',
    tags: ['product', 'innovation', 'brainstorm'],
    isFavorite: true,
    isEncrypted: false,
    notes: 'Need to research market size for concept #3',
    storageLocation: 'local',
  },
];

export const useRecordings = create<RecordingsState>()(
  persist(
    (set, get) => ({
      recordings: sampleRecordings,
      isLoading: false,
      error: null,
      
      addRecording: (recording) => {
        const newRecording: Recording = {
          ...recording,
          id: Date.now().toString(),
        };
        
        set((state) => ({
          recordings: [...state.recordings, newRecording],
        }));
      },
      
      updateRecording: (id, data) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? { ...recording, ...data, updatedAt: new Date().toISOString() }
              : recording
          ),
        }));
      },
      
      deleteRecording: (id) => {
        set((state) => ({
          recordings: state.recordings.filter((recording) => recording.id !== id),
        }));
      },
      
      addMarker: (recordingId, marker) => {
        set((state) => ({
          recordings: state.recordings.map((recording) => {
            if (recording.id !== recordingId) return recording;
            
            const newMarker: Marker = {
              ...marker,
              id: Date.now().toString(),
            };
            
            return {
              ...recording,
              markers: [...(recording.markers || []), newMarker],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      
      updateMarker: (recordingId, markerId, data) => {
        set((state) => ({
          recordings: state.recordings.map((recording) => {
            if (recording.id !== recordingId) return recording;
            if (!recording.markers) return recording;
            
            return {
              ...recording,
              markers: recording.markers.map((marker) =>
                marker.id === markerId ? { ...marker, ...data } : marker
              ),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      
      deleteMarker: (recordingId, markerId) => {
        set((state) => ({
          recordings: state.recordings.map((recording) => {
            if (recording.id !== recordingId) return recording;
            if (!recording.markers) return recording;
            
            return {
              ...recording,
              markers: recording.markers.filter((marker) => marker.id !== markerId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          recordings: state.recordings.map((recording) =>
            recording.id === id
              ? { ...recording, isFavorite: !recording.isFavorite }
              : recording
          ),
        }));
      },
      
      getFilteredRecordings: (filter) => {
        const { recordings } = get();
        
        return recordings.filter((recording) => {
          // Search filter
          if (filter.search && !recording.title.toLowerCase().includes(filter.search.toLowerCase())) {
            return false;
          }
          
          // Categories filter
          if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(recording.category)) {
            return false;
          }
          
          // Tags filter
          if (filter.tags && filter.tags.length > 0 && !filter.tags.some(tag => recording.tags.includes(tag))) {
            return false;
          }
          
          // Date range filter
          if (filter.dateFrom) {
            const dateFrom = new Date(filter.dateFrom);
            const recordingDate = new Date(recording.createdAt);
            if (recordingDate < dateFrom) return false;
          }
          
          if (filter.dateTo) {
            const dateTo = new Date(filter.dateTo);
            const recordingDate = new Date(recording.createdAt);
            if (recordingDate > dateTo) return false;
          }
          
          // Duration filter
          if (filter.minDuration !== undefined && recording.duration < filter.minDuration) {
            return false;
          }
          
          if (filter.maxDuration !== undefined && recording.duration > filter.maxDuration) {
            return false;
          }
          
          // Favorite filter
          if (filter.isFavorite !== undefined && recording.isFavorite !== filter.isFavorite) {
            return false;
          }
          
          // Storage location filter
          if (filter.storageLocation && recording.storageLocation !== filter.storageLocation) {
            return false;
          }
          
          return true;
        });
      },
      
      getCategories: () => {
        const { recordings } = get();
        const categories = new Set<RecordingCategory>();
        
        recordings.forEach((recording) => {
          categories.add(recording.category);
        });
        
        return Array.from(categories);
      },
      
      getAllTags: () => {
        const { recordings } = get();
        const tags = new Set<string>();
        
        recordings.forEach((recording) => {
          recording.tags.forEach((tag) => {
            tags.add(tag);
          });
        });
        
        return Array.from(tags);
      },
    }),
    {
      name: 'recordings-storage',
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