import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useGlobalState } from '../utils/QueueState';

const PlaybackControls = ({ isPlaying }) => {
  const { setIsPlaying, currentIndex, queue, setCurrentIndex } = useGlobalState();
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => { if (currentIndex > 0) { setCurrentIndex(currentIndex - 1); } }} disabled={currentIndex === 0}>
        <Icon style={styles.icon} name="step-backward" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
        <Icon name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { if (currentIndex < queue.length - 1) { setCurrentIndex(currentIndex + 1); } }} disabled={currentIndex === queue.length - 1}>
        <Icon style={styles.icon} name="step-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e1a1a',
    gap: 16,
  },
  icon: {
    padding: 10,
  },
});

export default PlaybackControls;
