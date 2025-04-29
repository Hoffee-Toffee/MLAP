import * as React from 'react';
import { View, StyleSheet, DrawerLayoutAndroid, ScrollView } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import SongsScreen from './mainTabs/SongsTab';
import PlayerBar from '../PlayerBar';
import { DrawerLayoutAndroid as DrawerLayoutAndroidType } from 'react-native';

import colors from '../../utils/colors';

const TopBar = ({ onMenuPress }: { onMenuPress: () => void }) => (
  <Appbar.Header style={styles.header}>
    <Appbar.Action icon="menu" onPress={onMenuPress} />
    <Appbar.Content title="MLAP" />
    <Appbar.Action icon="magnify" onPress={() => { }} />
    <Appbar.Action icon="dots-vertical" onPress={() => { }} />
  </Appbar.Header>
);

const TabSwitcher = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => (
  <View style={styles.tabWrapper}>
    <ScrollView horizontal={true} contentContainerStyle={styles.tabContainer}>
      {['Suggested', 'Songs', 'Albums', 'Artists', 'Playlists', 'Folders'].map((tab, index) => (
        <Text
          key={index}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          {tab}
        </Text>
      ))}
    </ScrollView>
  </View>
);

const MainScreen = () => {
  const [activeTab, setActiveTab] = React.useState('Suggested');
  const drawerRef = React.useRef<DrawerLayoutAndroidType>(null);

  const renderDrawerContent = () => (
    <View style={styles.drawer}>
      <ScrollView>
        <Text style={styles.drawerItem} onPress={() => { }}>Placeholders</Text>
        <Text style={styles.drawerItem} onPress={() => { }}>Scan Media</Text>
        <Text style={styles.drawerItem} onPress={() => { }}>Find Duplicates</Text>
        <Text style={styles.drawerItem} onPress={() => { }}>About</Text>
      </ScrollView>
    </View>
  );

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={renderDrawerContent}
    >
      <View style={styles.flexContainer}>
        <TopBar onMenuPress={() => drawerRef.current?.openDrawer()} />
        <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
        <View style={styles.contentContainer}>
          {(() => {
            switch (activeTab) {
              case 'Songs':
                return <SongsScreen />;
              case 'Suggested':
                return <Text style={styles.contentText}>Suggested Content</Text>;
              default:
                return <Text style={styles.contentText}>{`Content for ${activeTab}`}</Text>;
            }
          })()}
        </View>
        <PlayerBar />
      </View>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors['blue-75'],
  },
  flexContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e1a1a',
    paddingVertical: 5,
    paddingHorizontal: 10,
    height: 'auto',
    columnGap: 15,
  },
  tabWrapper: {
    flexShrink: 1,
    alignSelf: 'flex-start',
    maxHeight: 40,
  },
  tab: {
    color: 'white',
    fontSize: 16,
  },
  activeTab: {
    color: '#00bcd4',
    borderBottomWidth: 2,
    borderBottomColor: '#00bcd4',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#1e1a1a',
  },
  contentText: {
    color: 'white',
    fontSize: 18,
  },
  drawer: {
    backgroundColor: '#3a2f2f',
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    padding: 16,
    fontSize: 16,
    color: 'white',
  },
});

export default MainScreen;
