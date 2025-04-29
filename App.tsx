import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './components/views/MainScreen';
import NowPlayingScreen from './components/views/NowPlayingScreen';
import { GlobalStateProvider } from './utils/QueueState';

const Stack = createStackNavigator();

export default () => {
  return (
    <GlobalStateProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="MainScreen">
          <Stack.Screen name="MainScreen" component={MainScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NowPlayingScreen" component={NowPlayingScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </GlobalStateProvider>
  );
};
