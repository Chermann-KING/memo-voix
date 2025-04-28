import { User } from './auth';

export type CollaborationRole = 'viewer' | 'editor' | 'owner';

export interface Collaborator {
  userId: string;
  role: CollaborationRole;
  addedAt: string;
  user?: User; // Populated when needed
}

export interface SharedRecording {
  recordingId: string;
  sharedBy: string; // userId of the person who shared
  sharedAt: string;
  collaborators: Collaborator[];
}

export interface Comment {
  id: string;
  recordingId: string;
  userId: string;
  content: string;
  timestamp: number; // Position in the recording (in seconds)
  createdAt: string;
  updatedAt: string;
  user?: User; // Populated when needed
}

export interface CollaborationState {
  sharedRecordings: SharedRecording[];
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
}