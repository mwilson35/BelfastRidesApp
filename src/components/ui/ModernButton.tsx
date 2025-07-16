import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';
import { spacing, borderRadius, shadows } from '../../theme/layout';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ModernButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    };

    // Size styles
    const sizeStyles = {
      sm: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        minHeight: 36,
      },
      md: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        minHeight: 44,
      },
      lg: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.gray[300] : colors.primary[500],
      },
      secondary: {
        backgroundColor: disabled ? colors.gray[300] : colors.gray[600],
      },
      success: {
        backgroundColor: disabled ? colors.gray[300] : colors.success[500],
      },
      warning: {
        backgroundColor: disabled ? colors.gray[300] : colors.warning[500],
      },
      error: {
        backgroundColor: disabled ? colors.gray[300] : colors.error[500],
      },
      outline: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: disabled ? colors.gray[300] : colors.primary[500],
        ...shadows.none,
      },
      ghost: {
        backgroundColor: 'transparent',
        ...shadows.none,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && { opacity: 0.6 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      sm: { fontSize: typography.fontSize.sm },
      md: { fontSize: typography.fontSize.base },
      lg: { fontSize: typography.fontSize.lg },
    };

    const variantStyles = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      success: { color: colors.white },
      warning: { color: colors.white },
      error: { color: colors.white },
      outline: { color: disabled ? colors.gray[400] : colors.primary[500] },
      ghost: { color: disabled ? colors.gray[400] : colors.primary[500] },
    };

    return {
      ...typography.styles.button,
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: '600' as TextStyle['fontWeight'],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary[500] : colors.white} 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default ModernButton;
