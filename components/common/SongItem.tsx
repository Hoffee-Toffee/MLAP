import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../../services/AudioPlaybackService'; // Assuming Song type is exported

interface SongItemProps {
  song: Song;
  onPress: () => void;
  isPlaying?: boolean; // Optional: to show a playing indicator
}

const formatDuration = (millis?: number) => {
  if (millis === undefined || millis === null) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const SongItem: React.FC<SongItemProps> = ({ song, onPress, isPlaying }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {song.albumArtUri ? (
        <Image source={{ uri: song.albumArtUri }} style={styles.albumArt} />
      ) : (
        <View style={styles.placeholderAlbumArt}>
          <Ionicons name="musical-note" size={24} color="#888" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, isPlaying && styles.playingTitle]} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist || 'Unknown Artist'}
        </Text>
      </View>
      <Text style={styles.duration}>{formatDuration(song.durationMillis)}</Text>
      {isPlaying && <Ionicons name="volume-high" size={20} color="tomato" style={styles.playingIcon} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 15,
  },
  placeholderAlbumArt: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  playingTitle: {
    color: 'tomato',
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 14,
    color: '#666',
  },
  duration: {
    fontSize: 14,
    color: '#888',
    marginLeft: 10,
  },
  playingIcon: {
    marginLeft: 10,
  }
});

export default SongItem;
