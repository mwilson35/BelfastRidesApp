import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      await axios.post('http://192.168.33.3:5000/api/auth/signup', { username: name, email, password });
      Alert.alert('Success', 'Account created! Please log in.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Signup failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:16 },
  input: { borderWidth:1, borderColor:'#aaa', padding:10, marginBottom:12, borderRadius:4 },
});

export default SignupScreen;
