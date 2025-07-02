import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Using Expo's vector icons
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';

// Placeholder Screens
// const SongsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Songs Screen</Text></View>; // Placeholder removed
const AlbumsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Albums Screen</Text></View>;
const ArtistsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Artists Screen</Text></View>;
const PlaylistsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Playlists Screen</Text></View>;
// Remove old NowPlayingScreen placeholder
// const NowPlayingScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Now Playing Screen</Text></View>;

// Import Text and View from react-native
import { Text, View } from 'react-native';
import NowPlayingScreen from './screens/NowPlayingScreen'; // Import the actual screen
import SongsScreen from './screens/SongsScreen'; // Import the actual SongsScreen
import { AllQueuesProvider } from './contexts/AllQueuesContext'; // Import AllQueuesProvider

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import PlayerBar from './components/player/PlayerBar'; // Import PlayerBar
import QueueSwitcher from './components/queues/QueueSwitcher'; // Import QueueSwitcher
import { View } from 'react-native'; // Import View

function MainTabs() {
  return (
    // Layout: QueueSwitcher, then Tabs, then PlayerBar at the bottom
    <View style={{ flex: 1 }}>
      <QueueSwitcher />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Songs') {
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
            } else if (route.name === 'Albums') {
              iconName = focused ? 'albums' : 'albums-outline';
            } else if (route.name === 'Artists') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Playlists') {
              iconName = focused ? 'list' : 'list-outline';
            }
            // Ensure iconName is a valid Ionicons name or handle undefined case
            return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          // tabBarPosition: 'top', // This is for createMaterialTopTabNavigator, not BottomTabNavigator
        })}
        // For BottomTabNavigator, tabs are always at the bottom.
        // To have tabs at the top, you'd typically use createMaterialTopTabNavigator
        // or style a custom tab bar component.
        // Given the constraint, we'll keep BottomTabNavigator and PlayerBar will be below it.
        // The visual effect will be: QueueSwitcher -> Content Area (Tabs manage this) -> PlayerBar.
        // If tabs *must* be visually at the top, below switcher, then createMaterialTopTabNavigator is the way.
        // Let's assume the request meant "PlayerBar at the very bottom, Tabs are part of the main content area above it".
      >
        <Tab.Screen name="Songs" component={SongsScreen} />
        <Tab.Screen name="Albums" component={AlbumsScreen} />
        <Tab.Screen name="Artists" component={ArtistsScreen} />
        <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      </Tab.Navigator>
      <PlayerBar />
    </View>
  );
}

// Main App Stack
const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MainTabs"
      component={MainTabs}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="NowPlaying"
      component={NowPlayingScreen}
      options={{ title: 'Now Playing', presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <AllQueuesProvider>
        <AudioPlayerProvider>
          <NavigationContainer>
            <AppStack />
          </NavigationContainer>
        </AudioPlayerProvider>
      </AllQueuesProvider>
    </SafeAreaProvider>
  );
}
