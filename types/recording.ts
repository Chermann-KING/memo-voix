export type RecordingQuality = 'low' | 'medium' | 'high';
export type RecordingCategory = 'ideas' | 'meetings' | 'interviews' | 'notes' | 'custom';
export type StorageLocation = 'local' | 'cloud';

export interface Recording {
  id: string;
  title: string;
  duration: number; // in seconds
  size: number; // in bytes
  createdAt: string;
  updatedAt: string;
  uri: string;
  category: RecordingCategory;
  tags: string[];
  isFavorite: boolean;
  isEncrypted: boolean;
  transcription?: string;
  notes?: string;
  markers?: Marker[];
  storageLocation: StorageLocation;
  sharedWith?: string[]; // user IDs
}

export interface Marker {
  id: string;
  timestamp: number; // in seconds
  label: string;
  note?: string;
}

export interface RecordingFilter {
  search?: string;
  categories?: RecordingCategory[];
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  minDuration?: number;
  maxDuration?: number;
  isFavorite?: boolean;
  storageLocation?: StorageLocation;
}