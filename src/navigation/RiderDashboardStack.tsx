import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderDashboard from '../components/RiderDashboard';
import ProfileScreen from '../components/ProfileScreen';
import RideHistoryScreen from '../components/RideHistoryScreen';
import MyScheduledRidesScreen from '../components/MyScheduledRidesScreen';
import ScheduledRideDetailsScreen from '../components/ScheduledRideDetailsScreen';
import PaymentMethodsScreen from '../components/PaymentMethodsScreen';
import EmergencyFeaturesScreen from '../components/EmergencyFeaturesScreen';
import SettingsScreen from '../components/SettingsScreen';
import FavoriteLocationsScreen from '../components/FavoriteLocationsScreen';

export type RiderDashboardStackParamList = {
  MainDashboard: undefined;
  Profile: undefined;
  RideHistory: undefined;
  MyScheduledRides: undefined;
  ScheduledRideDetails: { ride: Ride };
  PaymentMethods: undefined;
  Emergency: {
    isRideActive?: boolean;
    rideId?: number;
    currentLocation?: { latitude: number; longitude: number };
  } | undefined;
  Settings: undefined;
  FavoriteLocations: undefined;
};

type Ride = {
  id: number;
  pickup: string;
  destination: string;
  scheduled_time: string;
  status: string;
  estimated_fare: number;
  duration_minutes: number;
  encoded_polyline: string; // ← ADD THIS FIELD
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

      <Stack.Screen name="MyScheduledRides">
        {(props) => <MyScheduledRidesScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="ScheduledRideDetails">
        {(props) => <ScheduledRideDetailsScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="PaymentMethods">
        {(props) => <PaymentMethodsScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="Emergency">
        {(props) => <EmergencyFeaturesScreen {...props} token={token} {...(props.route.params || {})} />}
      </Stack.Screen>

      <Stack.Screen name="Settings">
        {(props) => <SettingsScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="FavoriteLocations">
        {(props) => <FavoriteLocationsScreen {...props} token={token} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RiderDashboardStack;
