import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import SongList from '../components/common/SongList';
import { Song } from '../services/AudioPlaybackService';
// PlayerBar is no longer imported here as it's part of the main layout
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllQueues } from '../contexts/AllQueuesContext'; // Import useAllQueues
import { useAudioPlayer } from '../contexts/AudioPlayerContext'; // Import useAudioPlayer


const SongsScreen: React.FC = () => {
  const [mediaLibrarySongs, setMediaLibrarySongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const { activeQueueId, addSongsToQueue, queues } = useAllQueues();
  const audioPlayer = useAudioPlayer(); // To access loadAndPlayQueue for the active queue

  const fetchMediaLibrarySongs = async () => {
    if (!permissionResponse) {
      return;
    }

    if (!permissionResponse.granted) {
      if (permissionResponse.canAskAgain) {
        await requestPermission();
      } else {
        // User has permanently denied permission or it's restricted by policy
        console.log('Permission to access media library is denied.');
        // You might want to show a message to the user here
        return;
      }
    }

    // Re-check after requesting (if applicable)
    if (!permissionResponse.granted && !(await MediaLibrary.getPermissionsAsync()).granted) {
        console.log('Permission still not granted after request.');
        // Show a message or guide the user to settings if !canAskAgain
        return;
    }


    setIsLoading(true);
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        // You can add more filters here, e.g., first, after, createdBefore, createdAfter
      });

      const fetchedSongs: Song[] = media.assets.map(asset => ({
        id: asset.id,
        uri: asset.uri,
        title: asset.filename.replace(/\.[^/.]+$/, ""), // Remove file extension for title
        artist: (asset as any).artist || 'Unknown Artist', // Expo MediaLibrary might not directly provide artist metadata consistently
        albumArtUri: asset.albumId ? `library://album/${asset.albumId}` : undefined, // Simplification for local URI, might need actual fetching for display
        durationMillis: asset.duration * 1000, // Convert seconds to milliseconds
      }));
      setMediaLibrarySongs(fetchedSongs);
    } catch (error) {
      console.error("Failed to fetch media library songs:", error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch or when permissions change
  useEffect(() => {
    if (permissionResponse?.granted) {
        fetchMediaLibrarySongs();
    }
  }, [permissionResponse?.granted]);

  const handleSongPressInMediaLibrary = (song: Song) => {
    if (activeQueueId) {
      addSongsToQueue(activeQueueId, [song]);
      // Optionally, you might want to play it immediately
      // Find the song in the updated queue to get its new index
      const activeQueue = queues.find(q => q.id === activeQueueId);
      if (activeQueue) {
        const songIndexInQueue = activeQueue.songs.findIndex(s => s.id === song.id);
        // If song was just added, it should be at the end or use the returned index from addSongsToQueue if implemented
        // For simplicity, let's assume it was added and we want to play it.
        // This requires the audioPlayer's queue to be updated after addSongsToQueue.
        // A more robust way would be to observe queue changes in AudioPlayerContext.

        // To play the newly added song, we need to ensure the AudioPlayerContext's internal queue is up-to-date.
        // The current setup reloads the queue in AudioPlayerContext when activeQueueId or allQueues changes.
        // So, after addSongsToQueue, the context should eventually update.
        // To play it: find the active queue again (it's updated now), find the song index, and play.

        // This part can be tricky due to state update timings. A simpler approach:
        // After adding, the AudioPlayerContext will see the updated queue.
        // If you want to auto-play, you might need to call audioPlayer.loadAndPlayQueue with the *updated* active queue
        // and the index of the newly added song.
        // For now, let's just add it. The user can then tap it in their queue if it's displayed elsewhere,
        // or the PlayerBar will pick up the change if the queue was empty and this is the first song.
        Alert.alert('Song Added', `${song.title} has been added to the current queue.`);
      }
    } else {
      Alert.alert('No Active Queue', 'Please select or create a queue first.');
    }
  };


  if (permissionResponse === null) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
                <Text>Loading permissions...</Text>
            </View>
        </SafeAreaView>
    );
  }

  if (!permissionResponse.granted && !permissionResponse.canAskAgain) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <Text>Permission to access media library is required.</Text>
                <Text>Please enable it in your phone settings.</Text>
                {/* Optionally, add a button to open app settings if feasible */}
            </View>
      </SafeAreaView>
    );
  }

  if (!permissionResponse.granted && permissionResponse.canAskAgain) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <Text>This app needs access to your songs to play music.</Text>
                <Button title="Grant Permission" onPress={requestPermission} />
            </View>
        </SafeAreaView>
    );
  }


  if (isLoading) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="tomato" />
                <Text>Loading songs...</Text>
            </View>
        </SafeAreaView>
    );
  }

  // Determine the songs for the active queue to display them if needed, or a message.
  const currentActiveQueue = queues.find(q => q.id === activeQueueId);

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            {/* Section to display songs from MediaLibrary */}
            <Text style={styles.sectionTitle}>Available Songs (Tap to add to '{currentActiveQueue?.name || "active queue"}')</Text>
            <View style={styles.mediaLibraryListContainer}>
              <SongList
                songs={mediaLibrarySongs}
                onSongPress={(song) => handleSongPressInMediaLibrary(song)}
                emptyMessage="No songs found in your media library."
              />
            </View>

            {/* Section to display songs in the current active queue */}
            {currentActiveQueue && (
              <>
                <Text style={styles.sectionTitle}>Songs in '{currentActiveQueue.name}'</Text>
                <View style={styles.activeQueueListContainer}>
                  <SongList
                    songs={currentActiveQueue.songs}
                    // Default onSongPress for active queue songs will play them from this queue
                    emptyMessage="This queue is empty. Add songs from above."
                  />
                </View>
              </>
            )}
            {!activeQueueId && !isLoading && (
                <View style={styles.centered}>
                    <Text>No active queue selected. Select or create one using the switcher above.</Text>
                </View>
            )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
    backgroundColor: '#f0f0f0', // Light background for section titles
    color: '#333',
  },
  mediaLibraryListContainer: {
    flex: 1, // Adjust flex proportions as needed
    // maxHeight: '50%', // Example: limit height if both lists are always visible
  },
  activeQueueListContainer: {
    flex: 1, // Adjust flex proportions as needed
    // maxHeight: '50%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  }
});

export default SongsScreen;
