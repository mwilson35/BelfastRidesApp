import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RiderDashboard from '../components/RiderDashboard';
import RideHistoryScreen from '../components/RideHistoryScreen';

const Tab = createBottomTabNavigator();

const RiderStack = ({ logout, token }: any) => (
  <Tab.Navigator>
    <Tab.Screen
      name="Dashboard"
      options={{ title: 'Dashboard', headerShown: false }}
      children={() => <RiderDashboard logout={logout} token={token} />}
    />
    <Tab.Screen
      name="RideHistory"
      options={{ title: 'Ride History' }}
      children={() => <RideHistoryScreen token={token} />}
    />
  </Tab.Navigator>
);

export default RiderStack;
