import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'; // Ensure this is installed or use an Expo alternative
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define your StackParamList if not already defined elsewhere
type RootStackParamList = {
  Main: undefined; // Or whatever parameters your Main screen expects
  NowPlaying: undefined; // Or parameters for NowPlaying
};

type PlayerBarNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;


const formatTime = (millis: number) => {
  if (isNaN(millis) || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    playbackPositionMillis,
    playbackDurationMillis,
    play,
    pause,
    playNext,
    queue, // Get the current queue
  } = useAudioPlayer();
  const navigation = useNavigation<PlayerBarNavigationProp>();

  // Only render PlayerBar if there's a song in the current queue context,
  // not necessarily if a song is *loaded* in the service, to allow it to show even if paused/stopped.
  // Or, always show if you prefer, and currentSong from service will be null if nothing is loaded.
  // For this change, let's make it visible if there's an active queue with songs, or a current song.
  const activeQueueHasSongs = queue && queue.length > 0;

  if (!currentSong && !activeQueueHasSongs) {
     // If no song is loaded into the player service AND the active queue is empty, don't render.
     // This means if you switch to an empty queue, the player bar disappears.
     // If you want it to persist and show "Nothing playing" for an empty active queue,
     // then remove `&& !activeQueueHasSongs` and adjust the UI below for when `currentSong` is null.
    return null;
  }

  const displaySong = currentSong; // Use the song loaded in the player service for display

  const onPlayPausePress = () => {
    if (!displaySong) return; // Cannot play/pause if no song is loaded
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Calculate progress for the Slider component
  const progress = displaySong && playbackDurationMillis > 0 ? playbackPositionMillis / playbackDurationMillis : 0;

  return (
    <TouchableOpacity
        style={styles.container}
        onPress={() => displaySong ? navigation.navigate('NowPlaying') : {}}
        disabled={!displaySong} // Disable press if no song is loaded
    >
      <View style={styles.content}>
        {displaySong?.albumArtUri ? (
          <Image source={{ uri: displaySong.albumArtUri }} style={styles.albumArt} />
        ) : (
          <View style={styles.placeholderAlbumArt}>
            <Ionicons name="musical-note" size={20} color="#fff" />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{displaySong?.title || (activeQueueHasSongs ? "Tap a song to play" : "No songs in queue")}</Text>
          <Text style={styles.artist} numberOfLines={1}>{displaySong?.artist || ''}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={onPlayPausePress} style={styles.controlButton} disabled={!displaySong}>
            <Ionicons name={isPlaying && displaySong ? 'pause' : 'play'} size={28} color={displaySong ? "#fff" : "#888"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.controlButton} disabled={!displaySong}>
            <Ionicons name="play-skip-forward" size={24} color={displaySong ? "#fff" : "#888"} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // position: 'absolute', // No longer absolute positioning
    // bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2c3e50',
    paddingVertical: 5,
    // borderTopWidth: 1, // Becomes borderBottomWidth if it's under something like QueueSwitcher
    // borderTopColor: '#34495e',
    borderBottomWidth: 1,
    borderBottomColor: '#1a252f', // Darker border for separation
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Reduced horizontal padding
  },
  albumArt: {
    width: 40, // Smaller album art
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  placeholderAlbumArt: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14, // Smaller font size
    fontWeight: 'bold',
  },
  artist: {
    color: '#bdc3c7', // Lighter gray for artist
    fontSize: 12, // Smaller font size
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8, // Smaller touch target
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 3, // Thinner progress bar
    backgroundColor: '#34495e', // Darker background for progress bar
    marginTop: 5, // Space between content and progress bar
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'tomato', // Accent color for progress
  },
});

export default PlayerBar;
