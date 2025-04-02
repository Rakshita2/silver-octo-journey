import React from 'react';
import { SafeAreaView } from 'react-native';
import MapScreen from './MapScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapScreen />
    </SafeAreaView>
  );
};

export default App;
