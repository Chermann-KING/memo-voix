import { Recording } from './recording';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null for root folders
  createdAt: string;
  updatedAt: string;
  color?: string;
  icon?: string;
}

export interface FolderWithRecordings extends Folder {
  recordings: Recording[];
  subfolders: Folder[];
}

export interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
}