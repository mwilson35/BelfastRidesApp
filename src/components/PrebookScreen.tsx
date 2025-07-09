import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PrebookScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗓️ Prebook Screen Placeholder</Text>
      <Text style={styles.subtext}>Coming soon to a ride near you.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#777',
  },
});

export default PrebookScreen;
