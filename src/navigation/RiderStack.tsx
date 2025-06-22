import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RiderDashboard from '../components/RiderDashboard';
import RideHistoryScreen from '../components/RideHistoryScreen';




type RiderStackParamList = {
  Dashboard: undefined; // props injected manually
  RideHistory: { token: string };
};


const Tab = createBottomTabNavigator<RiderStackParamList>();

const RiderStack = ({ logout, token }: any) => (
  <Tab.Navigator>
<Tab.Screen
  name="Dashboard"
  options={{ title: 'Dashboard', headerShown: false }}
>
  {() => <RiderDashboard logout={logout} token={token} />}
</Tab.Screen>

    <Tab.Screen
      name="RideHistory"
      component={RideHistoryScreen}
      initialParams={{ token }}
      options={{ title: 'Ride History' }}
    />
  </Tab.Navigator>
);

export default RiderStack;
