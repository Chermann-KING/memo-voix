import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, Clock, Tag, Lock, Cloud, Smartphone } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Recording } from '@/types/recording';
import { formatDuration, formatDate, formatFileSize } from '@/utils/formatters';

interface RecordingCardProps {
  recording: Recording;
  onPress: (recording: Recording) => void;
  onFavoriteToggle: (id: string) => void;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  onPress,
  onFavoriteToggle,
}) => {
  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    onFavoriteToggle(recording.id);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recording)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {recording.title}
        </Text>
        <TouchableOpacity onPress={handleFavoritePress}>
          <Star
            size={20}
            color={recording.isFavorite ? colors.light.warning : colors.light.inactive}
            fill={recording.isFavorite ? colors.light.warning : 'none'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Clock size={16} color={colors.light.subtext} />
          <Text style={styles.detailText}>{formatDuration(recording.duration)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailText}>{formatDate(recording.createdAt)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailText}>{formatFileSize(recording.size)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {recording.category.charAt(0).toUpperCase() + recording.category.slice(1)}
          </Text>
        </View>

        {recording.tags.length > 0 && (
          <View style={styles.tags}>
            <Tag size={14} color={colors.light.subtext} />
            <Text style={styles.tagsText} numberOfLines={1}>
              {recording.tags.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.icons}>
          {recording.isEncrypted && (
            <Lock size={16} color={colors.light.primary} />
          )}
          
          {recording.storageLocation === 'cloud' ? (
            <Cloud size={16} color={colors.light.primary} />
          ) : (
            <Smartphone size={16} color={colors.light.primary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: colors.light.subtext,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: colors.light.primary + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: colors.light.primary,
    fontWeight: '500',
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  tagsText: {
    fontSize: 12,
    color: colors.light.subtext,
    marginLeft: 4,
  },
  icons: {
    flexDirection: 'row',
    gap: 8,
  },
});