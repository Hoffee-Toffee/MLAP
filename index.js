/**
 * @format
 */

if (!Array.prototype.at) {
  Array.prototype.at = function (index) {
    if (index < 0) {
      index = this.length + index;
    }
    return this[index];
  };
}

import {Buffer} from 'buffer';

if (typeof atob === 'undefined') {
  global.atob = input => Buffer.from(input, 'base64').toString('binary');
}

if (typeof btoa === 'undefined') {
  global.btoa = input => Buffer.from(input, 'binary').toString('base64');
}

import {AppRegistry} from 'react-native';
import {useColorScheme} from 'react-native';
import {
  MD3LightTheme as DefaultThemeLight,
  MD3DarkTheme as DefaultThemeDark,
  PaperProvider,
} from 'react-native-paper';
import App from './App';
import {name as appName} from './app.json';
import AppColorScheme from './app-color-scheme.json';

export default function Main() {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === 'dark'
      ? {...DefaultThemeLight, colors: AppColorScheme.dark}
      : {...DefaultThemeDark, colors: AppColorScheme.light};

  return (
    <PaperProvider theme={theme}>
      <App />
    </PaperProvider>
  );
}

AppRegistry.registerComponent(appName, () => Main);
