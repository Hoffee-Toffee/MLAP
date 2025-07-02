import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import SongItem from './SongItem';
import { Song } from '../../services/AudioPlaybackService';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

interface SongListProps {
  songs: Song[];
}

const SongList: React.FC<SongListProps> = ({ songs }) => {
  const { loadAndPlayQueue, currentSong, isPlaying } = useAudioPlayer();

  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No songs found.</Text>
      </View>
    );
  }

  const handleSongPress = (index: number) => {
    loadAndPlayQueue(songs, index);
  };

  return (
    <FlatList
      data={songs}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <SongItem
          song={item}
          onPress={() => handleSongPress(index)}
          isPlaying={isPlaying && currentSong?.id === item.id}
        />
      )}
      contentContainerStyle={styles.listContentContainer}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContentContainer: {
    paddingBottom: 80, // Add padding to avoid overlap with player bar
  }
});

export default SongList;
