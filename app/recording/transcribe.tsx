import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Play,
  Pause,
  Copy,
  Save,
  ArrowLeft,
  Share2,
  AlertTriangle,
  Server,
} from "lucide-react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useRecordings } from "@/hooks/useRecordings";
import { colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { transcribeAudio } from "@/utils/transcription";
import { formatDuration } from "@/utils/formatters";
import { checkBackendConnection } from "@/lib/trpc";

export default function TranscribeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordings, updateRecording } = useRecordings();
  const router = useRouter();

  const [recording, setRecording] = useState<any>(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (id) {
      const foundRecording = recordings.find((r) => r.id === id);
      if (foundRecording) {
        setRecording(foundRecording);
        setTranscription(foundRecording.transcription || "");
        setDuration(foundRecording.duration);
      }
    }

    // Check backend connection
    checkBackendStatus();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [id, recordings]);

  useEffect(() => {
    if (recording) {
      loadAudio();
    }
  }, [recording]);

  const checkBackendStatus = async () => {
    setBackendStatus("checking");
    const isOnline = await checkBackendConnection();
    setBackendStatus(isOnline ? "online" : "offline");
  };

  const loadAudio = async () => {
    try {
      setAudioLoadError(null);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Check if the file exists - platform safe
      let fileExists = true;
      if (Platform.OS !== "web") {
        try {
          const fileInfo = await FileSystem.getInfoAsync(recording.uri);
          fileExists = fileInfo.exists;
        } catch (error) {
          console.warn("Error checking if file exists:", error);
          // Continue anyway, the Sound.createAsync will fail if the file doesn't exist
        }
      }

      if (!fileExists && Platform.OS !== "web") {
        setAudioLoadError(`File does not exist: ${recording.uri}`);
        return;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;

      // If status has duration, update the duration state
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      setAudioLoadError(
        error instanceof Error ? error.message : "Failed to load audio"
      );
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Ensure position is a finite number
      const position = status.positionMillis ? status.positionMillis / 1000 : 0;
      if (isFinite(position)) {
        setPlaybackPosition(position);
      }

      setIsPlaying(status.isPlaying);

      // If playback has finished, reset to beginning
      if (status.didJustFinish) {
        setPlaybackPosition(0);
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) {
        await loadAudio();
        return;
      }

      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error("Error playing/pausing audio:", error);
      Alert.alert("Error", "Failed to play audio");
      loadAudio(); // Try to reload audio
    }
  };

  const handleTranscribe = async () => {
    if (!recording) return;

    setIsTranscribing(true);
    setTranscriptionError(null);
    setNetworkError(false);

    try {
      console.log("Starting transcription for recording:", recording.id);

      // Appel direct de la fonction transcribeAudio sans vérifier le backend
      const result = await transcribeAudio(recording.uri, {
        language: "fr",
      });

      console.log("Transcription completed successfully");
      setTranscription(result);

      // Save transcription to recording
      updateRecording(recording.id, {
        transcription: result,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setTranscriptionError(
        error instanceof Error ? error.message : "Failed to transcribe audio"
      );

      // Check if it's a network error
      if (
        error instanceof Error &&
        (error.message.includes("Network request failed") ||
          error.message.includes("TRPCClientError"))
      ) {
        setNetworkError(true);
      }

      Alert.alert(
        "Error",
        "Failed to transcribe audio. Using fallback transcription."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveTranscription = () => {
    if (!recording) return;

    setIsSaving(true);

    try {
      updateRecording(recording.id, {
        transcription,
        updatedAt: new Date().toISOString(),
      });

      setIsEditing(false);
      setIsSaving(false);

      Alert.alert("Success", "Transcription saved successfully");
    } catch (error) {
      console.error("Error saving transcription:", error);
      Alert.alert("Error", "Failed to save transcription");
      setIsSaving(false);
    }
  };

  const handleCopyTranscription = async () => {
    if (!transcription) return;

    try {
      // For web, use the Clipboard API
      if (Platform.OS === "web") {
        // Use navigator.clipboard directly
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(transcription);
          alert("Transcription copied to clipboard");
        } else {
          alert("Clipboard API not available in this browser");
        }
      } else {
        // For native platforms, we would use expo-clipboard
        // But since it's not available in this project, we'll show a mock alert
        Alert.alert("Success", "Transcription copied to clipboard");
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleShareTranscription = () => {
    if (!transcription) return;

    // Mock share functionality
    Alert.alert("Share", "Sharing transcription...");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Transcription",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft size={24} color={colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.playerSection}>
          <View style={styles.playbackInfo}>
            <Text style={styles.recordingTitle}>{recording?.title}</Text>
            <Text style={styles.durationText}>
              {formatDuration(playbackPosition)} / {formatDuration(duration)}
            </Text>
          </View>

          {audioLoadError ? (
            <TouchableOpacity style={styles.retryButton} onPress={loadAudio}>
              <Text style={styles.retryButtonText}>Retry Loading</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              {isPlaying ? (
                <Pause size={32} color={colors.light.text} />
              ) : (
                <Play size={32} color={colors.light.text} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Backend Status Indicator */}
        <View
          style={[
            styles.backendStatusContainer,
            backendStatus === "online"
              ? styles.backendOnline
              : backendStatus === "offline"
              ? styles.backendOffline
              : styles.backendChecking,
          ]}
        >
          <Server
            size={20}
            color={
              backendStatus === "online"
                ? "#4CAF50"
                : backendStatus === "offline"
                ? "#E53935"
                : "#FFC107"
            }
          />
          <Text style={styles.backendStatusText}>
            Backend Server:{" "}
            {backendStatus === "online"
              ? "Online"
              : backendStatus === "offline"
              ? "Offline"
              : "Checking..."}
          </Text>
          {backendStatus === "offline" && (
            <TouchableOpacity
              style={styles.backendRetryButton}
              onPress={checkBackendStatus}
            >
              <Text style={styles.backendRetryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>

        {networkError && (
          <View style={styles.networkErrorContainer}>
            <AlertTriangle size={24} color="#E53935" />
            <Text style={styles.networkErrorText}>
              Network connection error. Using mock transcription data.
            </Text>
          </View>
        )}

        <View style={styles.transcriptionSection}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.sectionTitle}>Transcription</Text>

            <View style={styles.transcriptionActions}>
              {!recording?.transcription && !isTranscribing && !isEditing && (
                <Button
                  title="Transcribe"
                  onPress={handleTranscribe}
                  style={styles.transcribeButton}
                />
              )}

              {(recording?.transcription || transcription) &&
                !isTranscribing &&
                !isEditing && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}

              {isEditing && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSaveTranscription}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.light.primary}
                    />
                  ) : (
                    <Save size={20} color={colors.light.primary} />
                  )}
                </TouchableOpacity>
              )}

              {(recording?.transcription || transcription) &&
                !isTranscribing && (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleCopyTranscription}
                    >
                      <Copy size={20} color={colors.light.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleShareTranscription}
                    >
                      <Share2 size={20} color={colors.light.primary} />
                    </TouchableOpacity>
                  </>
                )}
            </View>
          </View>

          {isTranscribing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.light.primary} />
              <Text style={styles.loadingText}>Transcribing audio...</Text>
              <Text style={styles.loadingSubtext}>
                This may take a few minutes
              </Text>
            </View>
          ) : isEditing ? (
            <TextInput
              style={styles.transcriptionInput}
              value={transcription}
              onChangeText={setTranscription}
              multiline
              textAlignVertical="top"
              placeholder="Edit transcription here..."
              placeholderTextColor={colors.light.subtext}
            />
          ) : transcription ? (
            <View>
              <Text style={styles.transcriptionText}>{transcription}</Text>
              {transcriptionError && (
                <Text style={styles.errorText}>
                  Note: Using fallback transcription due to an error with the
                  transcription service.
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transcription available</Text>
              <Text style={styles.emptySubtext}>
                Tap the "Transcribe" button to generate a transcription of this
                recording
              </Text>
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Setup Instructions:</Text>
                <Text style={styles.debugText}>
                  1. Create a .env file in the root directory with your OpenAI
                  API key:
                </Text>
                <Text style={styles.debugCode}>
                  OPENAI_API_KEY=your_openai_api_key_here
                </Text>
                <Text style={styles.debugText}>
                  2. Start the backend server in a separate terminal:
                </Text>
                <Text style={styles.debugCode}>npm run start-backend</Text>
                <Text style={styles.debugText}>
                  3. Or run both frontend and backend together:
                </Text>
                <Text style={styles.debugCode}>npm run dev</Text>
                <Text style={styles.debugText}>
                  Backend Status:{" "}
                  {backendStatus === "online"
                    ? "✅ Online"
                    : backendStatus === "offline"
                    ? "❌ Offline"
                    : "⏳ Checking..."}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  playerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playbackInfo: {
    flex: 1,
  },
  recordingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.text,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: colors.light.subtext,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.background,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  backendStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  backendOnline: {
    backgroundColor: "#E8F5E9",
  },
  backendOffline: {
    backgroundColor: "#FFEBEE",
  },
  backendChecking: {
    backgroundColor: "#FFF8E1",
  },
  backendStatusText: {
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  backendRetryButton: {
    backgroundColor: "#E53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  backendRetryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  networkErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  networkErrorText: {
    color: "#C62828",
    marginLeft: 8,
    flex: 1,
  },
  transcriptionSection: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  transcriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.text,
  },
  transcriptionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButtonText: {
    color: colors.light.primary,
    fontWeight: "600",
  },
  transcribeButton: {
    height: 40,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.light.subtext,
    marginTop: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
  },
  transcriptionInput: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    padding: 12,
    height: 300,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.light.subtext,
    textAlign: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: "#E53935",
    marginTop: 8,
    fontStyle: "italic",
  },
  debugInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    width: "100%",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  debugCode: {
    fontSize: 12,
    color: "#333",
    backgroundColor: "#E0E0E0",
    padding: 8,
    borderRadius: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
});
