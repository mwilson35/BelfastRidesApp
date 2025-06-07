// app/signup.tsx
import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const response = await fetch('https://your-backend-url.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      Alert.alert('Success', 'Account created!');
    } catch (error) {
      console.error(error);
if (error instanceof Error) {
  Alert.alert('Error', error.message);
} else {
  Alert.alert('Error', 'Something went wrong.');
}

    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Sign Up</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Create Account" onPress={handleSignup} />
    </View>
  );
}
