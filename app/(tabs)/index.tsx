import { registerRootComponent } from 'expo';
import React from 'react';
import MapScreen from './MapScreen';


export default function App() {
  return <MapScreen />;
}

registerRootComponent(App);
