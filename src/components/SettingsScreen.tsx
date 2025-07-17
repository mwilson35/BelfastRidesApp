import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernCard from './ui/ModernCard';
import ModernHeader from './ui/ModernHeader';
import ModernButton from './ui/ModernButton';

// Theme
import { colors, typography } from '../theme';
import { spacing } from '../theme/layout';

type FavoriteLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'other';
};

type Notification = {
  id: string;
  type: 'ride_accepted' | 'ride_started' | 'ride_completed' | 'driver_arrived' | 'payment_processed' | 'scheduled_reminder' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type AppSettings = {
  // Ride Preferences
  autoAcceptBestFare: boolean;
  autoBookFromFavorites: boolean;
  showDriverPhoto: boolean;
  
  // Privacy & Security
  enableLocationServices: boolean;
  shareLocationWithContacts: boolean;
  enableTouchId: boolean;
  enableFaceId: boolean;
  
  // Notification Preferences
  enablePushNotifications: boolean;
  rideUpdates: boolean;
  driverArrival: boolean;
  paymentConfirmations: boolean;
  scheduledReminders: boolean;
  promotions: boolean;
  systemUpdates: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
};

type Props = {
  token: string;
};

const SettingsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    // Ride Preferences
    autoAcceptBestFare: false,
    autoBookFromFavorites: false,
    showDriverPhoto: true,
    
    // Privacy & Security
    enableLocationServices: true,
    shareLocationWithContacts: true,
    enableTouchId: false,
    enableFaceId: false,
    
    // Notification Preferences
    enablePushNotifications: true,
    rideUpdates: true,
    driverArrival: true,
    paymentConfirmations: true,
    scheduledReminders: true,
    promotions: false,
    systemUpdates: true,
    emailEnabled: true,
    smsEnabled: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchRecentNotifications();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(prev => ({ ...prev, ...res.data.settings }));
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const res = await axios.get('http://192.168.33.5:5000/api/notifications?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      // Silently handle - notifications are optional in settings
    } finally {
      setNotificationsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      await axios.patch(
        'http://192.168.33.5:5000/api/user/settings',
        { [key]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err: any) {
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to update setting');
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await axios.patch(
        `http://192.168.33.5:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_accepted': return 'check-circle';
      case 'ride_started': return 'directions-car';
      case 'ride_completed': return 'done-all';
      case 'driver_arrived': return 'location-on';
      case 'payment_processed': return 'payment';
      case 'scheduled_reminder': return 'schedule';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <MaterialIcons name={icon} size={20} color={colors.primary[500]} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
        thumbColor={value ? colors.primary[500] : colors.gray[400]}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Settings" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Settings" 
        subtitle="App preferences and notifications"
        onMenuPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ride Preferences */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Ride Preferences</Text>
          
          {renderSettingRow(
            'auto-awesome',
            'Auto-Accept Best Fare',
            'Automatically accept the lowest fare when multiple drivers respond',
            settings.autoAcceptBestFare,
            (value) => updateSetting('autoAcceptBestFare', value)
          )}

          {renderSettingRow(
            'bookmark',
            'Quick Book from Favorites',
            'Enable one-tap booking to your favorite locations',
            settings.autoBookFromFavorites,
            (value) => updateSetting('autoBookFromFavorites', value)
          )}

          {renderSettingRow(
            'face',
            'Show Driver Photo',
            'Display driver photos for safety and recognition',
            settings.showDriverPhoto,
            (value) => updateSetting('showDriverPhoto', value)
          )}
        </ModernCard>

        {/* Privacy & Security */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          {renderSettingRow(
            'location-on',
            'Location Services',
            'Required for ride booking and navigation',
            settings.enableLocationServices,
            (value) => updateSetting('enableLocationServices', value)
          )}

          {renderSettingRow(
            'share',
            'Share Location with Contacts',
            'Allow emergency contacts to see your location during rides',
            settings.shareLocationWithContacts,
            (value) => updateSetting('shareLocationWithContacts', value)
          )}

          {renderSettingRow(
            'fingerprint',
            'Touch ID',
            'Use Touch ID to secure the app',
            settings.enableTouchId,
            (value) => updateSetting('enableTouchId', value)
          )}

          {renderSettingRow(
            'face',
            'Face ID',
            'Use Face ID to secure the app',
            settings.enableFaceId,
            (value) => updateSetting('enableFaceId', value)
          )}
        </ModernCard>

        {/* Notifications */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingRow(
            'notifications',
            'Push Notifications',
            'Receive app notifications on your device',
            settings.enablePushNotifications,
            (value) => updateSetting('enablePushNotifications', value)
          )}

          {renderSettingRow(
            'email',
            'Email Notifications',
            'Receive notifications via email',
            settings.emailEnabled,
            (value) => updateSetting('emailEnabled', value)
          )}

          {renderSettingRow(
            'sms',
            'SMS Notifications',
            'Receive important updates via text message',
            settings.smsEnabled,
            (value) => updateSetting('smsEnabled', value)
          )}

          <View style={styles.subSectionHeader}>
            <Text style={styles.subSectionTitle}>Notification Types</Text>
          </View>

          {renderSettingRow(
            'directions-car',
            'Ride Updates',
            'Driver acceptance, ride started, completed',
            settings.rideUpdates,
            (value) => updateSetting('rideUpdates', value)
          )}

          {renderSettingRow(
            'location-on',
            'Driver Arrival',
            'When your driver arrives at pickup location',
            settings.driverArrival,
            (value) => updateSetting('driverArrival', value)
          )}

          {renderSettingRow(
            'payment',
            'Payment Confirmations',
            'Payment processing and receipt notifications',
            settings.paymentConfirmations,
            (value) => updateSetting('paymentConfirmations', value)
          )}

          {renderSettingRow(
            'schedule',
            'Scheduled Reminders',
            'Reminders for your scheduled rides',
            settings.scheduledReminders,
            (value) => updateSetting('scheduledReminders', value)
          )}

          {renderSettingRow(
            'local-offer',
            'Promotions & Offers',
            'Special deals and promotional offers',
            settings.promotions,
            (value) => updateSetting('promotions', value)
          )}

          {renderSettingRow(
            'system-update',
            'System Updates',
            'App updates and maintenance notifications',
            settings.systemUpdates,
            (value) => updateSetting('systemUpdates', value)
          )}
        </ModernCard>

        {/* Recent Notifications */}
        <ModernCard style={styles.card}>
          <View style={styles.notificationHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notificationsLoading && (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            )}
          </View>
          
          {notifications.length > 0 ? (
            <>
              {notifications.slice(0, 3).map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationItem}
                  onPress={() => !notification.isRead && markNotificationAsRead(notification.id)}
                >
                  <View style={styles.notificationContent}>
                    <MaterialIcons 
                      name={getNotificationIcon(notification.type)} 
                      size={20} 
                      color={colors.primary[500]} 
                    />
                    <View style={styles.notificationText}>
                      <Text style={[
                        styles.notificationTitle, 
                        !notification.isRead && styles.unreadNotification
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatNotificationDate(notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </View>
                </TouchableOpacity>
              ))}
              
              {notifications.length > 3 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>
                    View all {notifications.length} notifications
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyNotifications}>
              <MaterialIcons name="notifications-none" size={48} color={colors.gray[400]} />
              <Text style={styles.emptyText}>No recent notifications</Text>
            </View>
          )}
        </ModernCard>

        {/* Account Actions */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.actionRow}>
            <MaterialIcons name="help" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <MaterialIcons name="info" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>About</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <MaterialIcons name="privacy-tip" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <MaterialIcons name="description" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </ModernCard>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  subSectionHeader: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  subSectionTitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
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
  settingText: {
    marginLeft: spacing[3],
    flex: 1,
  },
  settingTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500' as const,
  },
  settingSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  actionText: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginLeft: spacing[3],
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  notificationItem: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  notificationContent: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  notificationText: {
    flex: 1,
    marginLeft: spacing[3],
  },
  notificationTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '500' as const,
  },
  unreadNotification: {
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  notificationMessage: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  notificationTime: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft: spacing[2],
    marginTop: spacing[1],
  },
  viewAllButton: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing[2],
  },
  viewAllText: {
    ...typography.styles.body,
    color: colors.primary[500],
    fontWeight: '500' as const,
  },
  emptyNotifications: {
    alignItems: 'center' as const,
    paddingVertical: spacing[6],
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[3],
    textAlign: 'center' as const,
  },
};

export default SettingsScreen;
