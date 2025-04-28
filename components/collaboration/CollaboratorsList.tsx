import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Trash2, Edit2, UserPlus } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Collaborator, CollaborationRole } from '@/types/collaboration';
import { User } from '@/types/auth';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
  users: User[];
  onAddCollaborator: () => void;
  onRemoveCollaborator: (userId: string) => void;
  onChangeRole: (userId: string, role: CollaborationRole) => void;
  isOwner: boolean;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  collaborators,
  users,
  onAddCollaborator,
  onRemoveCollaborator,
  onChangeRole,
  isOwner,
}) => {
  // Helper to get user details
  const getUserDetails = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };
  
  // Get role label
  const getRoleLabel = (role: CollaborationRole): string => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'editor':
        return 'Can Edit';
      case 'viewer':
        return 'Can View';
      default:
        return '';
    }
  };
  
  // Get role color
  const getRoleColor = (role: CollaborationRole): string => {
    switch (role) {
      case 'owner':
        return colors.light.primary;
      case 'editor':
        return colors.light.success;
      case 'viewer':
        return colors.light.subtext;
      default:
        return colors.light.subtext;
    }
  };
  
  // Toggle role (cycles through viewer -> editor -> viewer)
  const toggleRole = (userId: string, currentRole: CollaborationRole) => {
    if (!isOwner) return;
    
    const newRole: CollaborationRole = currentRole === 'viewer' ? 'editor' : 'viewer';
    onChangeRole(userId, newRole);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Collaborators</Text>
        
        {isOwner && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAddCollaborator}
          >
            <UserPlus size={20} color={colors.light.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={collaborators}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => {
          const user = getUserDetails(item.userId);
          
          return (
            <View style={styles.collaboratorItem}>
              <View style={styles.userInfo}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {user?.displayName?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {user?.displayName || 'Unknown User'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {user?.email || ''}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[
                    styles.roleButton,
                    { backgroundColor: getRoleColor(item.role) + '20' } // 20% opacity
                  ]}
                  onPress={() => toggleRole(item.userId, item.role)}
                  disabled={!isOwner || item.role === 'owner'}
                >
                  <Text 
                    style={[
                      styles.roleText,
                      { color: getRoleColor(item.role) }
                    ]}
                  >
                    {getRoleLabel(item.role)}
                  </Text>
                  
                  {isOwner && item.role !== 'owner' && (
                    <Edit2 size={12} color={getRoleColor(item.role)} style={styles.roleIcon} />
                  )}
                </TouchableOpacity>
                
                {isOwner && item.role !== 'owner' && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => onRemoveCollaborator(item.userId)}
                  >
                    <Trash2 size={16} color={colors.light.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No collaborators yet. Add people to collaborate on this recording.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: colors.light.primary,
    marginLeft: 4,
  },
  collaboratorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleIcon: {
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.subtext,
    textAlign: 'center',
  },
});