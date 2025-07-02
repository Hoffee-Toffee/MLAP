import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import PlaybackControls from '../components/player/PlaybackControls';
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get('window');
const albumArtSize = width * 0.8;

const formatTime = (millis: number) => {
    if (isNaN(millis) || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

const NowPlayingScreen: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    playbackPositionMillis,
    playbackDurationMillis,
    seek,
  } = useAudioPlayer();

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={styles.emptyText}>No song is currently playing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onSliderValueChange = (value: number) => {
    if (playbackDurationMillis > 0) {
      seek(value * playbackDurationMillis);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        {currentSong.albumArtUri ? (
            <Image source={{ uri: currentSong.albumArtUri }} style={styles.albumArt} />
        ) : (
            <View style={styles.placeholderAlbumArt}>
            <Ionicons name="musical-note" size={albumArtSize * 0.5} color="#888" />
            </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentSong.artist || 'Unknown Artist'}</Text>

        <View style={styles.sliderContainer}>
            <Text style={styles.timeText}>{formatTime(playbackPositionMillis)}</Text>
            <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={playbackDurationMillis > 0 ? playbackPositionMillis / playbackDurationMillis : 0}
            minimumTrackTintColor="tomato"
            maximumTrackTintColor="#ccc"
            thumbTintColor="tomato"
            onSlidingComplete={onSliderValueChange}
            />
            <Text style={styles.timeText}>{formatTime(playbackDurationMillis)}</Text>
        </View>

        <PlaybackControls />
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Light background for the screen
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    padding: 20,
  },
  albumArt: {
    width: albumArtSize,
    height: albumArtSize,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  placeholderAlbumArt: {
    width: albumArtSize,
    height: albumArtSize,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  artist: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  sliderContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 5, // Add some padding if slider is too close to edges
  },
  slider: {
    flex: 1, // Slider takes up available space
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#555',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  }
});

export default NowPlayingScreen;
