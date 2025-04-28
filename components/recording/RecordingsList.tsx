import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RecordingCard } from '@/components/ui/RecordingCard';
import { Recording } from '@/types/recording';
import { colors } from '@/constants/colors';

interface RecordingsListProps {
  recordings: Recording[];
  onRecordingPress: (recording: Recording) => void;
  onFavoriteToggle: (id: string) => void;
  emptyMessage?: string;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onRecordingPress,
  onFavoriteToggle,
  emptyMessage = 'No recordings found',
}) => {
  if (recordings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recordings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <RecordingCard
          recording={item}
          onPress={onRecordingPress}
          onFavoriteToggle={onFavoriteToggle}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.subtext,
    textAlign: 'center',
  },
});