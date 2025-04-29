import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { Menu } from 'react-native-paper';
import colors from '../utils/colors';
import { useGlobalState } from '../utils/QueueState';
import AwesomeIcon from 'react-native-vector-icons/FontAwesome';

// Define the Song type
interface Song {
  id: string;
  uri: string;
  filename: string;
  artist: string;
  duration: number;
}

const SongItem = ({ queue, index, song, orderable = false }: {
  queue: Song[];
  index: number;
  song: Song;
  orderable?: boolean;
}) => {
  console.log('SongItem', song);
  const navigation = useNavigation();
  const { setQueue, setCurrentIndex } = useGlobalState();

  const [menuVisible, setMenuVisible] = useState(false);
  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    return `${hours > 0 ? `${hours}:` : ''}${hours > 0 && minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const handleSongPress = () => {
    // set as playing song in global state
    setQueue(queue);
    setCurrentIndex(index);
    navigation.navigate('NowPlayingScreen');
  };

  return (
    <TouchableOpacity style={styles.songContainer} onPress={handleSongPress}>
      {orderable && (
        <Text style={styles.dragIcon}>
          =
        </Text>
      )}
      {song.uri ? (
        <Image source={{ uri: song.uri }} style={styles.songImage} />
      ) : (
        <Text style={styles.defaultImage}>
          <AwesomeIcon name="music" size={24} color={colors['gray-50']} />
        </Text>
      )}
      <View style={styles.songDetails}>
        <Text style={styles.songTitle}>{song.filename}</Text>
        <Text style={styles.songSubtitle}>
          <Text>{song.artist}</Text>
          <Text>  •  </Text>
          <Text>{formatDuration(song.duration)}</Text>
        </Text>
      </View>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuIcon}>
            <Text style={styles.menuText}>⋮</Text>
          </TouchableOpacity>
        }>
        <Menu.Item onPress={() => { setMenuVisible(false); }} title="Option 1" />
        <Menu.Item onPress={() => { setMenuVisible(false); }} title="Option 2" />
        <Menu.Item onPress={() => { setMenuVisible(false); }} title="Option 3" />
      </Menu>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  songContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors['lavender-175'],
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    width: '100%',
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  songDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  songSubtitle: {
    color: colors['gray-75'],
    fontSize: 14,
  },
  menuIcon: {
    padding: 10,
  },
  menuText: {
    color: 'white',
    fontSize: 20,
  },
  dragIcon: {
    color: colors['gray-75'],
    fontSize: 26,
    marginRight: 10,
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
});

export default SongItem;

