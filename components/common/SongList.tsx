import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import SongItem from './SongItem';
import { Song } from '../../services/AudioPlaybackService';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';

interface SongListProps {
  songs: Song[];
  onSongPress?: (song: Song, index: number, songs: Song[]) => void; // Made more generic
  // If onSongPress is not provided, default behavior (play from this list) will be used.
  // This allows SongList to be used for displaying songs that might not be directly playable
  // or have custom actions (e.g., adding to a different queue).
  emptyMessage?: string;
}

const SongList: React.FC<SongListProps> = ({ songs, onSongPress, emptyMessage = "No songs found." }) => {
  const audioPlayer = useAudioPlayer(); // Get the whole context for more flexibility

  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const handleDefaultSongPress = (song: Song, index: number, currentList: Song[]) => {
    // Default behavior: load and play from the provided list of songs
    audioPlayer.loadAndPlayQueue(currentList, index);
  };

  const effectiveOnSongPress = onSongPress || handleDefaultSongPress;

  return (
    <FlatList
      data={songs}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <SongItem
          song={item}
          onPress={() => effectiveOnSongPress(item, index, songs)}
          isPlaying={audioPlayer.isPlaying && audioPlayer.currentSong?.id === item.id}
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
    // Adjust paddingBottom if PlayerBar is no longer at the very bottom of the screen globally
    // Since PlayerBar is now at the top, this might not be needed or needs adjustment
    // based on where SongList is rendered relative to other elements.
    // For now, let's assume it's still good to have some padding at the bottom of lists.
    paddingBottom: 20,
  }
});

export default SongList;
