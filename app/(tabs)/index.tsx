import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { RecordingsList } from '@/components/recording/RecordingsList';
import { useRecordings } from '@/hooks/useRecordings';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';

export default function HomeScreen() {
  const { recordings, toggleFavorite } = useRecordings();
  const { user } = useAuth();
  const router = useRouter();
  const [recentRecordings, setRecentRecordings] = useState(recordings);
  const [isRouterReady, setIsRouterReady] = useState(false);

  useEffect(() => {
    // Sort recordings by date (newest first) and take the first 10
    const sorted = [...recordings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10);
    
    setRecentRecordings(sorted);
  }, [recordings]);

  // Set router ready after initial render
  useEffect(() => {
    setIsRouterReady(true);
  }, []);

  // Check authentication status
  useEffect(() => {
    if (isRouterReady && !user) {
      // Use setTimeout to ensure this happens after initial render
      const timer = setTimeout(() => {
        router.replace('/auth');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, router, isRouterReady]);

  // If user is not authenticated, render loading state
  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleRecordingPress = (recording: any) => {
    router.push({
      pathname: '/recording/[id]',
      params: { id: recording.id }
    });
  };

  const handleNewRecording = () => {
    router.push('/recording/new');
  };

  const handleSearch = () => {
    router.push('/search');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'MémoVoix',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleSearch} style={styles.headerButton}>
                <Search size={24} color={colors.light.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome back, {user.displayName.split(' ')[0]}
        </Text>
        <Text style={styles.subtitleText}>
          {recentRecordings.length > 0
            ? 'Your recent recordings'
            : 'Start by creating your first recording'}
        </Text>
      </View>

      <RecordingsList
        recordings={recentRecordings}
        onRecordingPress={handleRecordingPress}
        onFavoriteToggle={toggleFavorite}
        emptyMessage="You don't have any recordings yet. Tap the + button to create one."
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewRecording}>
        <Plus size={24} color={colors.light.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginHorizontal: 8,
  },
  welcomeSection: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.light.subtext,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});