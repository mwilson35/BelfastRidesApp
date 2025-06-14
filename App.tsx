import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import RiderDashboard from './src/components/RiderDashboard';
import DriverDashboard from './src/components/DriverDashboard';


export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<string | null>(null);

  // 1. Logout function
  const logout = () => {
    setRole(null);
    setUsername('');
    setPassword('');
    setMessage('');
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        'http://192.168.33.6:5000/auth/login',
        { username, password }
      );
      const { accessToken } = response.data;
      setMessage('Login successful!');
      const decoded: any = jwtDecode(accessToken);
      setRole(decoded.role);
    } catch (error: any) {
      setMessage('Login failed.');
      Alert.alert('Login failed', error?.response?.data?.message || 'Unknown error');
    }
  };

if (role === 'driver') {
  return <DriverDashboard logout={logout} />;
}

  // 2. Pass logout to RiderDashboard
  if (role === 'rider') {
    return <RiderDashboard logout={logout} />;
  }
  if (role === 'admin') {
    return (
      <View style={styles.center}>
        <Text>Admin Dashboard (placeholder)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        autoCapitalize="none"
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        autoCapitalize="none"
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  message: { color: 'red', marginTop: 10, textAlign: 'center' }
});
