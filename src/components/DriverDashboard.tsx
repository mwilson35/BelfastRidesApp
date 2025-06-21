import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import MapScreen from './MapScreen';

type Props = {
  logout: () => void;
  token: string | null;
};


const DriverDashboard: React.FC<Props> = ({ logout }) => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Driver Dashboard</Text>
      <Button title="Logout" onPress={logout} />
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
    backgroundColor: '#e0f7fa',
  },
});

export default DriverDashboard;
