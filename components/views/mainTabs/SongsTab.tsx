import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { getAudioMetadata } from '@missingcore/audio-metadata';
import SongList from '../../SongList';
import RNFS from 'react-native-fs';

const SongsScreen = () => {
  const demoSongs = [
    {
      id: '1',
      uri: 'https://lh3.googleusercontent.com/ogw/AF2bZyg9OY8teH-Qvc9h7r6pFBaa5xloqH0vnsP3K-PhGH74Bug',
      filename: 'Song 1',
      artist: 'Artist 1',
      duration: 240,
    },
    {
      id: '2',
      uri: 'https://lh3.googleusercontent.com/ogw/AF2bZyi1L3x_522qczncklksub0F3VOz2FsUrdjCJ_eBmcCTcg',
      filename: 'Song 2',
      artist: 'Artist 2',
      duration: 4000,
    },
    {
      id: '3',
      uri: null,
      filename: 'Song 3',
      artist: 'Artist 1',
      duration: 3,
    },
  ];

  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) { // Android 13+
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            {
              title: 'Audio Files Permission',
              message: 'This app needs access to your audio files to fetch songs.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else if (Platform.Version >= 30) { // Android 11+
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to fetch songs.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else { // Below Android 11
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to fetch songs.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
      return true;
    };

    const fetchSongs = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.log('Permission denied');
        return;
      }

      const scanDirectory = async (path) => {
        try {
          const files = await RNFS.readDir(path);
          const audioFiles = await Promise.all(files.map(async (file, index) => {
            if (file.isFile() && file.name.endsWith('.mp3')) {
              try {
                const uri = `file://${file.path}`;
                const wantedTags = ['album', 'albumArtist', 'artist', 'artwork', 'name', 'track', 'year'] as const;
                const { metadata } = await getAudioMetadata(uri, wantedTags);

                return {
                  id: index.toString(), // Use the index from the map function for unique IDs
                  filename: metadata.name || file.name.replace('.mp3', ''),
                  uri: metadata.artwork || '',
                  artist: metadata.artist || 'Unknown Artist',
                  duration: 0, // Placeholder, as duration is not provided by metadata
                };
              } catch (metadataError) {
                console.error(`Error fetching metadata for file ${file.path}:`, metadataError);
                return null;
              }
            } else if (file.isDirectory()) {
              return null;
            }
          }));

          return audioFiles.filter(Boolean);
        } catch (error) {
          console.error(`Error reading directory ${path}:`, error);
          return [];
        }
      };

      try {
        const internalStoragePath = RNFS.ExternalStorageDirectoryPath + '/Music/BCS';
        // const sdCardPath = RNFS.ExternalStorageDirectoryPath.replace('emulated/0', 'sdcard');

        const internalSongs = await scanDirectory(internalStoragePath);
        const sdCardSongs = [];

        const allSongs = [...internalSongs, ...sdCardSongs];

        setSongs(allSongs);
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };

    fetchSongs();

    return () => {
      // TrackPlayer.destroy();
    };
  }, []);

  return (
    <View style={styles.container}>
      <SongList songs={songs} sortable />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1a1a',
    padding: 10,
  },
});

export default SongsScreen;
