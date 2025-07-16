import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import { spacing, borderRadius, shadows } from '../../theme/layout';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  style?: ViewStyle;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  padding = 5,
  style,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing[padding],
    };

    const variantStyles = {
      default: {
        ...shadows.sm,
      },
      elevated: {
        ...shadows.md,
      },
      outlined: {
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.none,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

export default ModernCard;
