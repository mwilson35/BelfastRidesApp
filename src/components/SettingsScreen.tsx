import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernCard from './ui/ModernCard';
import ModernHeader from './ui/ModernHeader';

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

type AppSettings = {
  autoAcceptBestFare: boolean;
  shareLocationWithContacts: boolean;
  enablePushNotifications: boolean;
  enableLocationServices: boolean;
  enableTouchId: boolean;
  enableFaceId: boolean;
  autoBookFromFavorites: boolean;
  showDriverPhoto: boolean;
  enableRideReminders: boolean;
};

type Props = {
  token: string;
};

const SettingsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    autoAcceptBestFare: false,
    shareLocationWithContacts: true,
    enablePushNotifications: true,
    enableLocationServices: true,
    enableTouchId: false,
    enableFaceId: false,
    autoBookFromFavorites: false,
    showDriverPhoto: true,
    enableRideReminders: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
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
        subtitle="Customize your ride preferences"
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

          {renderSettingRow(
            'schedule',
            'Ride Reminders',
            'Get notifications for scheduled rides',
            settings.enableRideReminders,
            (value) => updateSetting('enableRideReminders', value)
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
            'Receive updates about your rides and account',
            settings.enablePushNotifications,
            (value) => updateSetting('enablePushNotifications', value)
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
};

export default SettingsScreen;
