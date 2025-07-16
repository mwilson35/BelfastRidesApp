import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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

const ForgotPasswordScreen = ({ navigation }: any) => {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://192.168.33.5:5000/api/auth/request-password-reset', { email });
      Alert.alert(
        'Email Sent', 
        'Check your inbox for a reset link. It may take a few minutes to arrive.',
        [{ text: 'OK', onPress: () => nav.goBack() }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      Alert.alert('Error', errorMessage);
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
          <MaterialIcons name="lock-reset" size={64} color={colors.primary[500]} />
          <Text style={styles.appTitle}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Don't worry, we'll help you reset it</Text>
        </View>

        {/* Reset Form */}
        <ModernCard style={styles.formCard}>
          <Text style={styles.formTitle}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={colors.text.secondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
            />
          </View>

          <ModernButton
            title="Send Reset Link"
            onPress={handleSendReset}
            loading={loading}
            size="lg"
            fullWidth
            style={styles.resetButton}
          />
        </ModernCard>

        {/* Back to Login Link */}
        <View style={styles.backContainer}>
          <Text style={styles.backText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={styles.backLink}>Sign in</Text>
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
    marginBottom: spacing[3],
  },
  description: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[6],
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
  resetButton: {
    marginTop: spacing[2],
  },
  backContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backText: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  backLink: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: 600 as const,
  },
};

export default ForgotPasswordScreen;
