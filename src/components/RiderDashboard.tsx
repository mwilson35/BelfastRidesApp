import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapScreen from './MapScreen';

const RiderDashboard = () => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Rider Dashboard</Text>
      <View style={{ flex: 1 }}>
        <MapScreen />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'center',
    backgroundColor: '#f3f3f3',
  },
});

export default RiderDashboard;
