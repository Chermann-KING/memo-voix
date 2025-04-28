import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { MessageSquare, Edit2, Trash2, Send } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Comment } from '@/types/collaboration';
import { User } from '@/types/auth';
import { formatDuration } from '@/utils/formatters';

interface CommentsListProps {
  comments: Comment[];
  users: User[];
  currentUserId: string;
  onAddComment: (content: string, timestamp: number) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onTimestampPress?: (timestamp: number) => void;
  currentTimestamp?: number;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  users,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onTimestampPress,
  currentTimestamp = 0,
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  
  // Helper to get user details
  const getUserDetails = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), currentTimestamp);
      setNewComment('');
    }
  };
  
  const handleStartEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };
  
  const handleCancelEditing = () => {
    setEditingCommentId(null);
    setEditedContent('');
  };
  
  const handleSaveEdit = (commentId: string) => {
    if (editedContent.trim()) {
      onUpdateComment(commentId, editedContent.trim());
      setEditingCommentId(null);
      setEditedContent('');
    }
  };
  
  // Sort comments by timestamp
  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comments</Text>
        <Text style={styles.commentCount}>{comments.length} comment{comments.length !== 1 ? 's' : ''}</Text>
      </View>
      
      <FlatList
        data={sortedComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const user = getUserDetails(item.userId);
          const isCurrentUser = item.userId === currentUserId;
          
          return (
            <View style={styles.commentItem}>
              <View style={styles.commentHeader}>
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
                  
                  <View>
                    <Text style={styles.userName}>
                      {user?.displayName || 'Unknown User'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {isCurrentUser && (
                  <View style={styles.commentActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleStartEditing(item)}
                    >
                      <Edit2 size={16} color={colors.light.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onDeleteComment(item.id)}
                    >
                      <Trash2 size={16} color={colors.light.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.timestampButton}
                onPress={() => onTimestampPress && onTimestampPress(item.timestamp)}
              >
                <Text style={styles.timestamp}>
                  at {formatDuration(item.timestamp)}
                </Text>
              </TouchableOpacity>
              
              {editingCommentId === item.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editedContent}
                    onChangeText={setEditedContent}
                    multiline
                    autoFocus
                  />
                  
                  <View style={styles.editActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={handleCancelEditing}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.editButton, styles.saveButton]}
                      onPress={() => handleSaveEdit(item.id)}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.commentContent}>{item.content}</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageSquare size={24} color={colors.light.subtext} />
            <Text style={styles.emptyText}>
              No comments yet. Add a comment at the current timestamp.
            </Text>
          </View>
        }
      />
      
      <View style={styles.addCommentContainer}>
        <View style={styles.currentTimestamp}>
          <Text style={styles.currentTimestampText}>
            at {formatDuration(currentTimestamp)}
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor={colors.light.subtext}
            multiline
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !newComment.trim() && styles.disabledButton
            ]}
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Send size={20} color={newComment.trim() ? colors.light.primary : colors.light.inactive} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
  },
  commentCount: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  commentItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.light.card,
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.light.text,
  },
  commentDate: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  commentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  timestampButton: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.light.primary}20`, // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.light.primary,
    fontWeight: '500',
  },
  commentContent: {
    fontSize: 14,
    color: colors.light.text,
    lineHeight: 20,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.light.text,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: colors.light.primary,
  },
  cancelText: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  saveText: {
    fontSize: 14,
    color: colors.light.background,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.subtext,
    textAlign: 'center',
    marginTop: 8,
  },
  addCommentContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingTop: 16,
  },
  currentTimestamp: {
    marginBottom: 8,
  },
  currentTimestampText: {
    fontSize: 12,
    color: colors.light.subtext,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.light.text,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});