import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RiderStack from './src/navigation/RiderStack';
import DriverDashboard from './src/components/DriverDashboard';
import LoginScreen from './src/components/LoginScreen';
import AuthStack from './src/navigation/AuthStack';

export default function App() {
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLogin = (userRole: string, accessToken: string) => {
    setRole(userRole);
    setToken(accessToken);
  };

  const logout = () => {
    setRole(null);
    setToken(null);
  };

  if (role === 'driver') {
    return <DriverDashboard logout={logout} token={token} />;
  }

  if (role === 'rider') {
    return (
      <NavigationContainer>
        <RiderStack logout={logout} token={token || ''} />
      </NavigationContainer>
    );
  }

  if (role === 'admin') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Admin Dashboard (placeholder)</Text>
      </View>
    );
  }

return (
  <NavigationContainer>
    <AuthStack onLogin={handleLogin} />
  </NavigationContainer>
);}
