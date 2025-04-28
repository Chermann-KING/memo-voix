import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { RecordingsList } from '@/components/recording/RecordingsList';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { Recording } from '@/types/recording';

export default function FavoritesScreen() {
  const { recordings, toggleFavorite } = useRecordings();
  const router = useRouter();
  const [favoriteRecordings, setFavoriteRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    // Filter recordings to only show favorites
    const favorites = recordings.filter(recording => recording.isFavorite);
    setFavoriteRecordings(favorites);
  }, [recordings]);

  const handleRecordingPress = (recording: Recording) => {
    router.push({
      pathname: '/recording/[id]',
      params: { id: recording.id }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Favorites',
        }}
      />

      <RecordingsList
        recordings={favoriteRecordings}
        onRecordingPress={handleRecordingPress}
        onFavoriteToggle={toggleFavorite}
        emptyMessage="You don't have any favorite recordings yet. Mark recordings as favorites to see them here."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
});