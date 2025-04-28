import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { RecordingsList } from '@/components/recording/RecordingsList';
import { CategorySelector } from '@/components/recording/CategorySelector';
import { useRecordings } from '@/hooks/useRecordings';
import { colors } from '@/constants/colors';
import { Recording, RecordingCategory } from '@/types/recording';

export default function CategoriesScreen() {
  const { recordings, toggleFavorite, getCategories } = useRecordings();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<RecordingCategory | null>(null);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [categories, setCategories] = useState<RecordingCategory[]>([]);

  useEffect(() => {
    // Get all available categories
    setCategories(getCategories());
  }, [recordings]);

  useEffect(() => {
    // Filter recordings by selected category
    if (selectedCategory) {
      const filtered = recordings.filter(recording => recording.category === selectedCategory);
      setFilteredRecordings(filtered);
    } else {
      setFilteredRecordings(recordings);
    }
  }, [selectedCategory, recordings]);

  const handleRecordingPress = (recording: Recording) => {
    router.push({
      pathname: '/recording/[id]',
      params: { id: recording.id }
    });
  };

  const handleCategorySelect = (category: RecordingCategory | null) => {
    setSelectedCategory(category);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Categories',
        }}
      />

      <CategorySelector
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <RecordingsList
        recordings={filteredRecordings}
        onRecordingPress={handleRecordingPress}
        onFavoriteToggle={toggleFavorite}
        emptyMessage={
          selectedCategory
            ? `No recordings in the ${selectedCategory} category`
            : "You don't have any recordings yet"
        }
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