import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

type Props = {
  onLogin: (userRole: string, accessToken: string) => void;
};

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.33.3:5000/api/auth/login', {
        email,
        password,
      });

      const { accessToken } = response.data;
      const decoded: any = jwtDecode(accessToken);
      onLogin(decoded.role, accessToken);
    } catch (error: any) {
      setMessage('Login failed.');
      Alert.alert('Login failed', error?.response?.data?.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
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

      <TouchableOpacity onPress={() => Alert.alert('Not implemented', 'Sign-up screen goes here.')}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert('Not implemented', 'Password recovery goes here.')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  input: { borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  message: { color: 'red', marginTop: 10, textAlign: 'center' },
  link: { marginTop: 16, color: 'blue', textAlign: 'center' },
});

export default LoginScreen;
