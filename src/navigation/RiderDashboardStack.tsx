import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderDashboard from '../components/RiderDashboard';
import ProfileScreen from '../components/ProfileScreen';

export type RiderDashboardStackParamList = {
  MainDashboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RiderDashboardStackParamList>();

const RiderDashboardStack = ({ token, logout }: { token: string; logout: () => void }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainDashboard">
        {(props) => <RiderDashboard {...props} token={token} logout={logout} />}
      </Stack.Screen>
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default RiderDashboardStack;
