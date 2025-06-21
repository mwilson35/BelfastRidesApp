import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RiderDashboard from '../components/RiderDashboard';
import RideHistoryScreen from '../components/RideHistoryScreen';

const Tab = createBottomTabNavigator();

const RiderStack = ({ logout, token }: any) => (
  <Tab.Navigator>
    <Tab.Screen
      name="Dashboard"
      component={RiderDashboard}
      initialParams={{ logout, token }}
      options={{ title: 'Dashboard', headerShown: false }}
    />
    <Tab.Screen
      name="RideHistory"
      component={RideHistoryScreen}
      initialParams={{ token }}
      options={{ title: 'Ride History' }}
    />
  </Tab.Navigator>
);

export default RiderStack;
