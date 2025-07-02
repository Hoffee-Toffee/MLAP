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
  } = useAudioPlayer();
  const navigation = useNavigation<PlayerBarNavigationProp>();

  if (!currentSong) {
    return null; // Don't render if no song is loaded/playing
  }

  const onPlayPausePress = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Calculate progress for the Slider component
  const progress = playbackDurationMillis > 0 ? playbackPositionMillis / playbackDurationMillis : 0;

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('NowPlaying')}>
      <View style={styles.content}>
        {currentSong.albumArtUri ? (
          <Image source={{ uri: currentSong.albumArtUri }} style={styles.albumArt} />
        ) : (
          <View style={styles.placeholderAlbumArt}>
            <Ionicons name="musical-note" size={20} color="#fff" />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artist || 'Unknown Artist'}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={onPlayPausePress} style={styles.controlButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={playNext} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
       {/* Thin progress bar at the bottom */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, // Adjust if you have a tab bar, might need to be dynamic
    left: 0,
    right: 0,
    backgroundColor: '#2c3e50', // Darker theme color
    paddingVertical: 5, // Reduced padding
    borderTopWidth: 1,
    borderTopColor: '#34495e',
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
