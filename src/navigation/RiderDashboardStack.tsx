import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderDashboard from '../components/RiderDashboard';
import ProfileScreen from '../components/ProfileScreen';
import RideHistoryScreen from '../components/RideHistoryScreen';


export type RiderDashboardStackParamList = {
  MainDashboard: undefined;
  Profile: undefined;
  RideHistory: undefined; // ← add this
};


const Stack = createNativeStackNavigator<RiderDashboardStackParamList>();

const RiderDashboardStack = ({ token, logout }: { token: string; logout: () => void }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
<Stack.Screen name="MainDashboard">
  {(props) => <RiderDashboard {...props} token={token} logout={logout} />}
</Stack.Screen>

<Stack.Screen name="Profile">
  {(props) => <ProfileScreen {...props} token={token} />}
</Stack.Screen>

<Stack.Screen name="RideHistory">
  {(props) => <RideHistoryScreen {...props} token={token} />}
</Stack.Screen>



    </Stack.Navigator>
  );
};

export default RiderDashboardStack;
