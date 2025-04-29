import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../../utils/colors';
import Header from './Header';
import PlaybackControls from '../PlaybackControls';
import { useGlobalState } from '../../utils/QueueState';

const NowPlayingScreen = () => {
  const { currentSong, duration, isPlaying } = useGlobalState();
  const song = currentSong;

  const progress = song ? (duration / song.duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <Header title="Now Playing" />
      <Image source={{ uri: song.uri }} style={styles.songImage} />
      <Text style={styles.songTitle}>{song.filename}</Text>
      <Text style={styles.songArtist}>{song.artist}</Text>
      <PlaybackControls isPlaying={isPlaying} />
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1a1a',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
  songImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  songTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  songArtist: {
    color: 'grey',
    fontSize: 18,
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: colors['gray-125'],
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors['blue-75'],
  },
});

export default NowPlayingScreen;
