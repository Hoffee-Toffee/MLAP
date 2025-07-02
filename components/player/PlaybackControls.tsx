import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

const PlaybackControls: React.FC = () => {
  const { isPlaying, play, pause, playNext, playPrevious } = useAudioPlayer();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={playPrevious} style={styles.controlButton}>
        <Ionicons name="play-skip-back" size={32} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.playPauseButton}>
        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={64} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={playNext} style={styles.controlButton}>
        <Ionicons name="play-skip-forward" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    width: '80%', // Controls take up 80% of screen width
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    padding: 10,
  }
});

export default PlaybackControls;
