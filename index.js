import { AppRegistry } from 'react-native';
import App from './App'; // This will now load App.js instead of App.tsx if App.js exists
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
