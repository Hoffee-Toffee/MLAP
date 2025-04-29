import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useGlobalState } from '../utils/QueueState';
import colors from '../utils/colors';
import { useNavigation } from '@react-navigation/native';

const PlayerBar = () => {
  const navigation = useNavigation();
  const { currentSong, isPlaying, setIsPlaying, duration, currentIndex, queue, setCurrentIndex } = useGlobalState();

  const progress = currentSong ? (duration / currentSong.duration) * 100 : 0;

  function onExpand(song) {
    navigation.navigate('NowPlayingScreen', { song });
  }

  return (
    <TouchableOpacity style={styles.container} onPress={() => onExpand(currentSong)}>
      <View style={styles.songDetails}>
        {currentSong && currentSong.uri ? (
          <Image
            source={{ uri: currentSong?.uri }}
            style={styles.songImage}
          />) :
          (<Text style={styles.defaultImage}>
            <Icon name="music" size={24} color={colors['gray-50']} />
          </Text>)}
        <View style={styles.infoContainer}>
          <Text style={styles.songTitle}>{currentSong?.filename || 'No Song Playing'}</Text>
          <Text style={styles.artistName}>{currentSong?.artist || ''}</Text>
        </View>
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={() => { if (currentSong) { setIsPlaying(!isPlaying); } }}>
            <Icon style={styles.control} name={isPlaying ? 'pause' : 'play'} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (currentIndex < queue.length - 1) { setCurrentIndex(currentIndex + 1); } }} disabled={currentIndex === queue.length - 1}>
            <Icon style={styles.control} name="step-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    backgroundColor: '#333',
    borderTopWidth: 1,
    borderTopColor: '#444',
    height: 80,
  },
  songDetails: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoContainer: {
    flex: 1,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistName: {
    color: '#aaa',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // width: 100,
    gap: 10,
  },
  control: {
    color: '#fff',
    fontSize: 20,
    padding: 16,
    outlineColor: colors['gray-125'],
    outlineWidth: 1,
    width: 50,
    textAlign: 'center',
  },
  defaultImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: colors['gray-125'],
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: 50,
    fontSize: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors['gray-125'],
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors['blue-75'],
  },
});

export default PlayerBar;
