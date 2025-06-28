import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RideHistoryScreen from '../components/RideHistoryScreen';
// Import other screens as needed
import RiderDashboard from '../components/RiderDashboard';

type Props = {
  logout: () => void;
  token: string;
};

export type RiderStackParamList = {
  RideHistory: undefined;
  RiderDashboard: undefined;
};

const Tab = createBottomTabNavigator<RiderStackParamList>();

const RiderStack: React.FC<Props> = ({ logout, token }) => {
  return (
<Tab.Navigator screenOptions={{ headerShown: false }}>
<Tab.Screen
  name="RiderDashboard"
  options={{ title: '', tabBarLabel: '' }}
>
  {(props) => <RiderDashboard {...props} token={token} logout={logout} />}
</Tab.Screen>


      <Tab.Screen
        name="RideHistory"
        options={{ title: 'Ride History' }}
      >
        {(props) => <RideHistoryScreen {...props} token={token} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default RiderStack;
