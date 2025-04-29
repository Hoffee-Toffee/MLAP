import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import SongItem from './SongItem';

interface Song {
  id: string;
  uri: string | null;
  filename: string;
  artist: string;
  duration: number;
}

const SongList = ({ songs, sortable = false, orderable = false }: { songs: Song[]; sortable?: boolean | string; orderable?: boolean; }) => {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Determine initial sortBy and sortOrder based on sortable prop
  useEffect(() => {
    if (typeof sortable === 'string') {
      const [field, order] = sortable.split('-');
      setSortBy(field);
      setSortOrder(order);
    } else if (sortable === true) {
      setSortBy('date');
      setSortOrder('asc');
    }
  }, [sortable]);

  const sortedSongs = sortable
    ? [...songs].sort((a, b) => {
      // Swap a and b if sortOrder is 'desc'
      if (sortOrder === 'desc') { [a, b] = [b, a]; }
      switch (sortBy) {
        case 'date':
          return new Date(b.filename).getTime() - new Date(a.filename).getTime();
        case 'duration':
          return b.duration - a.duration;
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        default:
          return 0;
      }
    })
    : songs;

  return (
    <View>
      <View style={styles.listBar}>
        <Text style={styles.listLen}>{sortedSongs.length || 'No'} Song{sortedSongs.length !== 1 ? 's' : ''}</Text>
        {sortable && typeof sortable === 'boolean' && (
          <View style={styles.sortDropdown}>
            <Text>Sort By:</Text>
            <Text style={styles.sortOption} onPress={() => setSortBy('duration')}>Duration</Text>
            <Text style={styles.sortOption} onPress={() => setSortBy('date')}>Date</Text>
            <Text style={styles.sortOption} onPress={() => setSortBy('name')}>Name</Text>
            <Text style={styles.sortOption} onPress={() => setSortBy('artist')}>Artist</Text>
            <Text style={styles.sortOption} onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Text>
          </View>
        )}
      </View>
      <View>
        <FlatList
          data={sortedSongs}
          renderItem={({ item, index }) => (
            <SongItem song={item} orderable={orderable} queue={sortedSongs} index={index} />
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  listLen: {
    color: 'grey',
  },
  sortDropdown: {
    // flexDirection: 'row',
    // alignItems: 'center',
  },
  sortOption: {
    marginHorizontal: 5,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
});

export default SongList;
