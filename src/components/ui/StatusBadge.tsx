import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';
import { spacing, borderRadius } from '../../theme/layout';

type StatusType = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'offline' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text }) => {
  const getStatusConfig = () => {
    const configs = {
      requested: {
        backgroundColor: colors.warning[100],
        textColor: colors.warning[800],
        icon: '⏳',
        defaultText: 'Finding Driver...',
      },
      accepted: {
        backgroundColor: colors.primary[100],
        textColor: colors.primary[800],
        icon: '🚗',
        defaultText: 'Driver En Route',
      },
      in_progress: {
        backgroundColor: colors.success[100],
        textColor: colors.success[800],
        icon: '🚕',
        defaultText: 'In Progress',
      },
      completed: {
        backgroundColor: colors.success[100],
        textColor: colors.success[800],
        icon: '✅',
        defaultText: 'Completed',
      },
      cancelled: {
        backgroundColor: colors.error[100],
        textColor: colors.error[800],
        icon: '❌',
        defaultText: 'Cancelled',
      },
      offline: {
        backgroundColor: colors.gray[100],
        textColor: colors.gray[800],
        icon: '📵',
        defaultText: 'Offline',
      },
      pending: {
        backgroundColor: colors.primary[100],
        textColor: colors.primary[800],
        icon: '📅',
        defaultText: 'Scheduled',
      },
    };

    return configs[status] || configs.requested; // Fallback to 'requested' if status not found
  };

  const config = getStatusConfig();

  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.backgroundColor }
    ]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[
        styles.text,
        { color: config.textColor }
      ]}>
        {text || config.defaultText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 14,
    marginRight: spacing[1],
  },
  text: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
});

export default StatusBadge;
