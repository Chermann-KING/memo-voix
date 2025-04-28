import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, FlatList, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X, Search, UserPlus, Check } from 'lucide-react-native';
import { useRecordings } from '@/hooks/useRecordings';
import { useAuth } from '@/hooks/useAuth';
import { useCollaboration } from '@/hooks/useCollaboration';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { CollaboratorsList } from '@/components/collaboration/CollaboratorsList';
import { User } from '@/types/auth';
import { Collaborator, CollaborationRole } from '@/types/collaboration';

// Mock users for demo purposes
const mockUsers: User[] = [
  {
    id: '2',
    email: 'jane@example.com',
    displayName: 'Jane Smith',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'john@example.com',
    displayName: 'John Doe',
    photoURL: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'alex@example.com',
    displayName: 'Alex Johnson',
    photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: '5',
    email: 'sarah@example.com',
    displayName: 'Sarah Williams',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

export default function ShareRecordingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings } = useRecordings();
  const { user } = useAuth();
  const { 
    sharedRecordings, 
    shareRecording, 
    updateCollaborator, 
    removeCollaborator,
    getSharedRecording
  } = useCollaboration();
  const router = useRouter();
  
  const [recording, setRecording] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [sharedRecording, setSharedRecording] = useState<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Load recording and sharing data
  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find(r => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
      }
      
      const foundSharedRecording = getSharedRecording(id);
      if (foundSharedRecording) {
        setSharedRecording(foundSharedRecording);
      }
    }
  }, [id, recordings, sharedRecordings]);
  
  // Filter users based on search query
  const filteredUsers = mockUsers.filter(u => {
    // Don't show current user
    if (user && u.id === user.id) return false;
    
    // Don't show users who are already collaborators
    if (sharedRecording && sharedRecording.collaborators.some((c: Collaborator) => c.userId === u.id)) {
      return false;
    }
    
    // Don't show users who are already selected
    if (selectedUsers.some(selected => selected.id === u.id)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      return (
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });
  
  const handleSelectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
  };
  
  const handleRemoveSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };
  
  const handleShare = async () => {
    if (!recording || !user || selectedUsers.length === 0) return;
    
    setIsSharing(true);
    
    try {
      // Create collaborators from selected users
      const collaborators: Omit<Collaborator, 'addedAt'>[] = selectedUsers.map(u => ({
        userId: u.id,
        role: 'viewer',
      }));
      
      // Share the recording
      shareRecording(recording.id, collaborators);
      
      // Update local state
      const updatedSharedRecording = getSharedRecording(recording.id);
      setSharedRecording(updatedSharedRecording);
      setSelectedUsers([]);
      
      // Show success message
      if (Platform.OS === 'web') {
        alert('Recording shared successfully');
      } else {
        Alert.alert('Success', 'Recording shared successfully');
      }
    } catch (error) {
      console.error('Error sharing recording:', error);
      
      if (Platform.OS === 'web') {
        alert('Failed to share recording');
      } else {
        Alert.alert('Error', 'Failed to share recording');
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleChangeRole = (userId: string, role: CollaborationRole) => {
    if (!recording) return;
    
    updateCollaborator(recording.id, userId, role);
    
    // Update local state
    const updatedSharedRecording = getSharedRecording(recording.id);
    setSharedRecording(updatedSharedRecording);
  };
  
  const handleRemoveCollaborator = (userId: string) => {
    if (!recording) return;
    
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove this collaborator?')) {
        removeCollaborator(recording.id, userId);
        
        // Update local state
        const updatedSharedRecording = getSharedRecording(recording.id);
        setSharedRecording(updatedSharedRecording);
      }
    } else {
      Alert.alert(
        'Remove Collaborator',
        'Are you sure you want to remove this collaborator?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => {
              removeCollaborator(recording.id, userId);
              
              // Update local state
              const updatedSharedRecording = getSharedRecording(recording.id);
              setSharedRecording(updatedSharedRecording);
            }
          }
        ]
      );
    }
  };
  
  const handleAddCollaborator = () => {
    // This function is just to show the UI for adding collaborators
    // The actual adding is done through the search and select flow
  };
  
  if (!recording) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading recording...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Share Recording',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingTitle}>{recording.title}</Text>
        </View>
        
        {/* Current collaborators */}
        {sharedRecording && (
          <CollaboratorsList
            collaborators={sharedRecording.collaborators}
            users={[...mockUsers, ...(user ? [user] : [])]}
            onAddCollaborator={handleAddCollaborator}
            onRemoveCollaborator={handleRemoveCollaborator}
            onChangeRole={handleChangeRole}
            isOwner={user && sharedRecording.sharedBy === user.id}
          />
        )}
        
        {/* Add new collaborators */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>
            {sharedRecording ? 'Add More People' : 'Share With'}
          </Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={colors.light.subtext} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.light.subtext}
              />
            </View>
            
            {searchQuery.length > 0 && filteredUsers.length > 0 && (
              <View style={styles.searchResults}>
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleSelectUser(item)}
                    >
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatarPlaceholder}>
                          <Text style={styles.userAvatarInitial}>
                            {item.displayName.charAt(0)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.displayName}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                      
                      <UserPlus size={20} color={colors.light.primary} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
          
          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <Text style={styles.selectedUsersTitle}>Selected:</Text>
              
              <View style={styles.selectedUsersList}>
                {selectedUsers.map((user) => (
                  <View key={user.id} style={styles.selectedUserChip}>
                    {user.photoURL ? (
                      <Image source={{ uri: user.photoURL }} style={styles.selectedUserAvatar} />
                    ) : (
                      <View style={styles.selectedUserAvatarPlaceholder}>
                        <Text style={styles.selectedUserAvatarInitial}>
                          {user.displayName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    
                    <Text style={styles.selectedUserName}>{user.displayName}</Text>
                    
                    <TouchableOpacity
                      style={styles.removeUserButton}
                      onPress={() => handleRemoveSelectedUser(user.id)}
                    >
                      <X size={16} color={colors.light.text} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {selectedUsers.length > 0 && (
            <Button
              title="Share"
              onPress={handleShare}
              isLoading={isSharing}
              style={styles.shareButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  recordingInfo: {
    marginBottom: 24,
  },
  recordingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.text,
  },
  addSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 16,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.light.text,
  },
  searchResults: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 2,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  selectedUsersContainer: {
    marginTop: 24,
  },
  selectedUsersTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.text,
    marginBottom: 8,
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
  },
  selectedUserAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  selectedUserAvatarInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedUserName: {
    fontSize: 14,
    color: colors.light.text,
    marginRight: 4,
  },
  removeUserButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    marginTop: 24,
  },
});