import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { RecordingCard } from '@/components/ui/RecordingCard';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { Recording } from '@/types/recording';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Recording[]>([]);
  const { recordings, toggleFavorite } = useRecordings();
  const router = useRouter();

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = recordings.filter(recording => {
      // Search in title
      if (recording.title.toLowerCase().includes(query)) {
        return true;
      }

      // Search in tags
      if (recording.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true;
      }

      // Search in notes
      if (recording.notes && recording.notes.toLowerCase().includes(query)) {
        return true;
      }

      // Search in transcription
      if (recording.transcription && recording.transcription.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });

    setSearchResults(results);
  }, [searchQuery, recordings]);

  const handleRecordingPress = (recording: Recording) => {
    router.push({
      pathname: '/recording/[id]',
      params: { id: recording.id }
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Search',
        }}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color={colors.light.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recordings..."
            placeholderTextColor={colors.light.subtext}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color={colors.light.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim() === '' ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Enter a search term to find recordings</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recordings found for "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecordingCard
              recording={item}
              onPress={handleRecordingPress}
              onFavoriteToggle={toggleFavorite}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.card,
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