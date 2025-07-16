import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, typography } from '../../theme';
import { spacing, layout, shadows } from '../../theme/layout';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress: () => void;
  showConnectionStatus?: boolean;
  isConnected?: boolean;
  isReconnecting?: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  showConnectionStatus = false,
  isConnected = true,
  isReconnecting = false,
}) => {
  const getConnectionStatus = () => {
    if (!showConnectionStatus) return null;
    
    if (isReconnecting) {
      return (
        <View style={[styles.statusBanner, { backgroundColor: colors.warning[500] }]}>
          <Text style={styles.statusText}>🔄 Reconnecting...</Text>
        </View>
      );
    }
    
    if (!isConnected) {
      return (
        <View style={[styles.statusBanner, { backgroundColor: colors.error[500] }]}>
          <Text style={styles.statusText}>📵 You are offline</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <>
      {getConnectionStatus()}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          
          <View style={styles.rightSpace} />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    ...shadows.sm,
    zIndex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
  },
  titleContainer: {
    flex: 1,
    marginLeft: spacing[4],
  },
  title: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  rightSpace: {
    width: 40, // Balance the menu button
  },
  statusBanner: {
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  statusText: {
    ...typography.styles.caption,
    color: colors.white,
    fontWeight: '600',
  },
});

export default ModernHeader;
