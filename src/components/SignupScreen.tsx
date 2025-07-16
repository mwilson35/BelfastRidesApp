import React, { useState } from 'react';
import { View, TextInput, Text, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernButton from './ui/ModernButton';
import ModernCard from './ui/ModernCard';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

const SignupScreen = ({ navigation }: any) => {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://192.168.33.5:5000/api/auth/signup', { 
        username: name, 
        email, 
        password 
      });
      Alert.alert('Success', 'Account created! Please log in.', [
        { text: 'OK', onPress: () => nav.goBack() }
      ]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="local-taxi" size={64} color={colors.primary[500]} />
          <Text style={styles.appTitle}>Belfast Rides</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        {/* Signup Form */}
        <ModernCard style={styles.formCard}>
          <Text style={styles.formTitle}>Sign Up</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.text.tertiary}
              value={name}
              autoCapitalize="words"
              autoCorrect={false}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 6 characters)"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setPassword}
            />
          </View>

          <ModernButton
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.signupButton}
          />
        </ModernCard>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[4],
    justifyContent: 'center' as const,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: spacing[8],
  },
  appTitle: {
    ...typography.styles.h1,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: 'center' as const,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[2],
    textAlign: 'center' as const,
  },
  formCard: {
    marginBottom: spacing[6],
  },
  formTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: spacing[6],
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    paddingVertical: spacing[4],
  },
  signupButton: {
    marginTop: spacing[2],
  },
  loginContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loginText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  loginLink: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: 600 as const,
  },
};

export default SignupScreen;
