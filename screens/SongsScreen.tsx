import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import SongList from '../components/common/SongList';
import { Song } from '../services/AudioPlaybackService';
import PlayerBar from '../components/player/PlayerBar'; // Import PlayerBar
import { SafeAreaView } from 'react-native-safe-area-context';


const SongsScreen: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const fetchSongs = async () => {
    if (!permissionResponse) {
      // Permissions are still loading or not yet determined
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
        albumArtUri: (asset as any).albumId ? MediaLibrary.getAlbumAsync(asset.albumId).then(a => a?.uri).toString() : undefined, // This is a simplification
        durationMillis: asset.duration * 1000, // Convert seconds to milliseconds
      }));
      setSongs(fetchedSongs);
    } catch (error) {
      console.error("Failed to fetch songs:", error);
      // Handle error (e.g., show a message to the user)
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch or when permissions change
  useEffect(() => {
    if (permissionResponse?.granted) {
        fetchSongs();
    }
  }, [permissionResponse?.granted]);


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

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <SongList songs={songs} />
            {/* PlayerBar is now part of the MainTabs structure, not here directly */}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Or your app's background color
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
});

export default SongsScreen;
