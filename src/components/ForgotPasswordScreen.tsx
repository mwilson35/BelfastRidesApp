import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');

  const handleSendReset = async () => {
    if (!email) return Alert.alert('Error', 'Email is required');

    try {
await axios.post('http://192.168.33.5:5000/api/auth/request-password-reset', { email });
      Alert.alert('Email Sent', 'Check your inbox for a reset link.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send reset email');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Forgot Password</Text>
      <TextInput
        placeholder="Enter your email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Send Reset Link" onPress={handleSendReset} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 4 },
});

export default ForgotPasswordScreen;
