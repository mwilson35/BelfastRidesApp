import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RiderDashboardStack from './RiderDashboardStack';
import PrebookScreen from '../components/PrebookScreen'; // we'll build this soon

type Props = {
  logout: () => void;
  token: string;
};

export type RiderStackParamList = {
  RiderDashboard: undefined;
  Prebook: undefined;
};

const Tab = createBottomTabNavigator<RiderStackParamList>();

const RiderStack: React.FC<Props> = ({ logout, token }) => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="RiderDashboard"
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      >
        {(props) => (
          <RiderDashboardStack {...props} token={token} logout={logout} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Prebook"
        options={{
          tabBarLabel: 'Prebook',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" color={color} size={size} />
          ),
        }}
        component={PrebookScreen}
      />
    </Tab.Navigator>
  );
};

export default RiderStack;
