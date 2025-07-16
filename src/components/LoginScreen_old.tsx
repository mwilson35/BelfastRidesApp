import React, { useState } from 'react';
import { View, TextInput, Text, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
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


type Props = {
  onLogin: (userRole: string, accessToken: string) => void;
};

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://192.168.33.5:5000/api/auth/login', {
        email,
        password,
      });

      const { accessToken } = response.data;
      const decoded: any = jwtDecode(accessToken);
      onLogin(decoded.role, accessToken);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      setMessage(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
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

          <ModernButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
          />

<TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
  <Text style={styles.link}>Forgot password?</Text>
</TouchableOpacity>


      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
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
  errorMessage: {
    ...typography.styles.bodySmall,
    color: colors.error[600],
    textAlign: 'center' as const,
    marginBottom: spacing[4],
  },
  loginButton: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  forgotPassword: {
    alignItems: 'center' as const,
  },
  forgotPasswordText: {
    ...typography.styles.body,
    color: colors.primary[600],
  },
  signupContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  signupText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  signupLink: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: 600 as const,
  },
};

export default LoginScreen;
