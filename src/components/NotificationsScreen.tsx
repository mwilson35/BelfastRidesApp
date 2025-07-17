import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernButton from './ui/ModernButton';
import ModernCard from './ui/ModernCard';
import ModernHeader from './ui/ModernHeader';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius } from '../theme/layout';

type Notification = {
  id: string;
  type: 'ride_accepted' | 'ride_started' | 'ride_completed' | 'driver_arrived' | 'payment_processed' | 'scheduled_reminder' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  rideId?: number;
  metadata?: any;
};

type NotificationSettings = {
  rideUpdates: boolean;
  driverArrival: boolean;
  paymentConfirmations: boolean;
  scheduledReminders: boolean;
  promotions: boolean;
  systemUpdates: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

type Props = {
  token: string;
};

const NotificationsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    rideUpdates: true,
    driverArrival: true,
    paymentConfirmations: true,
    scheduledReminders: true,
    promotions: false,
    systemUpdates: true,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      // Don't show error popup for 404 (endpoint not implemented yet)
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/notifications/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(prev => ({ ...prev, ...res.data.settings }));
    } catch (err: any) {
      console.error('Failed to fetch notification settings:', err);
      // Silently handle 404 for missing endpoints
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(
        `http://192.168.33.5:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      // Silently handle 404 for missing endpoints
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        'http://192.168.33.5:5000/api/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (err: any) {
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to mark all notifications as read');
      }
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete('http://192.168.33.5:5000/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
              });
              setNotifications([]);
              Alert.alert('Success', 'All notifications cleared');
            } catch (err: any) {
              if (err.response?.status !== 404) {
                Alert.alert('Error', 'Failed to clear notifications');
              }
            }
          },
        },
      ]
    );
  };

  const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
    setSettingsLoading(true);
    try {
      const updatedSettings = { ...settings, [key]: value };
      await axios.patch(
        'http://192.168.33.5:5000/api/notifications/settings',
        { [key]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(updatedSettings);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ride_accepted': return 'check-circle';
      case 'ride_started': return 'directions-car';
      case 'ride_completed': return 'flag';
      case 'driver_arrived': return 'location-on';
      case 'payment_processed': return 'payment';
      case 'scheduled_reminder': return 'schedule';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'ride_accepted': return colors.success[500];
      case 'ride_started': return colors.primary[500];
      case 'ride_completed': return colors.success[600];
      case 'driver_arrived': return colors.warning[500];
      case 'payment_processed': return colors.primary[600];
      case 'scheduled_reminder': return colors.primary[400];
      case 'system': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => !item.isRead && markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <ModernCard style={!item.isRead ? {...styles.notificationCard, ...styles.unreadCard} : styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <MaterialIcons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationTitleRow}>
              <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>
                {formatNotificationDate(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </ModernCard>
    </TouchableOpacity>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <ModernCard style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Delivery Methods</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="notifications" size={20} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={settings.pushEnabled}
            onValueChange={(value) => updateSettings('pushEnabled', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.pushEnabled ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="email" size={20} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={settings.emailEnabled}
            onValueChange={(value) => updateSettings('emailEnabled', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.emailEnabled ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="sms" size={20} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>SMS Notifications</Text>
          </View>
          <Switch
            value={settings.smsEnabled}
            onValueChange={(value) => updateSettings('smsEnabled', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.smsEnabled ? colors.primary[500] : colors.gray[400]}
          />
        </View>
      </ModernCard>

      <ModernCard style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Notification Types</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="directions-car" size={20} color={colors.success[500]} />
            <Text style={styles.settingLabel}>Ride Updates</Text>
          </View>
          <Switch
            value={settings.rideUpdates}
            onValueChange={(value) => updateSettings('rideUpdates', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.rideUpdates ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="location-on" size={20} color={colors.warning[500]} />
            <Text style={styles.settingLabel}>Driver Arrival</Text>
          </View>
          <Switch
            value={settings.driverArrival}
            onValueChange={(value) => updateSettings('driverArrival', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.driverArrival ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="payment" size={20} color={colors.primary[500]} />
            <Text style={styles.settingLabel}>Payment Confirmations</Text>
          </View>
          <Switch
            value={settings.paymentConfirmations}
            onValueChange={(value) => updateSettings('paymentConfirmations', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.paymentConfirmations ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="schedule" size={20} color={colors.primary[400]} />
            <Text style={styles.settingLabel}>Scheduled Ride Reminders</Text>
          </View>
          <Switch
            value={settings.scheduledReminders}
            onValueChange={(value) => updateSettings('scheduledReminders', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.scheduledReminders ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="local-offer" size={20} color={colors.warning[500]} />
            <Text style={styles.settingLabel}>Promotions & Offers</Text>
          </View>
          <Switch
            value={settings.promotions}
            onValueChange={(value) => updateSettings('promotions', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.promotions ? colors.primary[500] : colors.gray[400]}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialIcons name="system-update" size={20} color={colors.gray[500]} />
            <Text style={styles.settingLabel}>System Updates</Text>
          </View>
          <Switch
            value={settings.systemUpdates}
            onValueChange={(value) => updateSettings('systemUpdates', value)}
            trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
            thumbColor={settings.systemUpdates ? colors.primary[500] : colors.gray[400]}
          />
        </View>
      </ModernCard>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Notifications" 
        subtitle={`${unreadCount} unread`}
        onMenuPress={() => navigation.goBack()} 
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'notifications' ? (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.loadingText}>Loading notifications...</Text>
              </View>
            ) : (
              <>
                {notifications.length > 0 && (
                  <View style={styles.actionBar}>
                    <ModernButton
                      title="Mark All Read"
                      variant="outline"
                      size="sm"
                      onPress={markAllAsRead}
                      style={styles.actionButton}
                    />
                    <ModernButton
                      title="Clear All"
                      variant="error"
                      size="sm"
                      onPress={clearAllNotifications}
                      style={styles.actionButton}
                    />
                  </View>
                )}

                <FlatList
                  data={notifications}
                  keyExtractor={(item) => item.id}
                  renderItem={renderNotification}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <ModernCard style={styles.emptyCard}>
                      <MaterialIcons name="notifications-none" size={64} color={colors.text.tertiary} />
                      <Text style={styles.emptyTitle}>No notifications</Text>
                      <Text style={styles.emptySubtitle}>
                        You'll see ride updates and important information here
                      </Text>
                    </ModernCard>
                  )}
                />
              </>
            )}
          </>
        ) : (
          renderSettings()
        )}
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: colors.gray[50],
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    padding: spacing[1],
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: '500' as const,
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: '600' as const,
  },
  badge: {
    backgroundColor: colors.error[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: spacing[2],
  },
  badgeText: {
    ...typography.styles.caption,
    color: colors.white,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  actionBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: spacing[4],
  },
  actionButton: {
    flex: 0.48,
  },
  listContent: {
    paddingBottom: spacing[6],
  },
  notificationCard: {
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing[3],
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[1],
  },
  notificationTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500' as const,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600' as const,
  },
  notificationTime: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  notificationMessage: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[2],
    marginTop: spacing[1],
  },
  emptyCard: {
    alignItems: 'center' as const,
    padding: spacing[8],
    marginTop: spacing[8],
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[2],
    lineHeight: 24,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  settingsTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  settingLabel: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginLeft: spacing[3],
  },
};

export default NotificationsScreen;
