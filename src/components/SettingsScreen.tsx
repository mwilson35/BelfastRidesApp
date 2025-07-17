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

// Services
import PrivacyService from '../services/PrivacyService';

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
  // Emergency Features (synced with backend)
  enableEmergencyAlerts: boolean;
  
  // Privacy Preferences (frontend-only, no backend needed)
  allowAppAnalytics: boolean;
  allowLocationInsights: boolean;
  receiveLocalOffers: boolean;
};

type Props = {
  token: string;
};

const SettingsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<AppSettings>({
    // Emergency Features
    enableEmergencyAlerts: true,
    
    // Data & Analytics (default to user-friendly settings)
    allowAppAnalytics: true,
    allowLocationInsights: false,
    receiveLocalOffers: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Sync initial privacy settings with Privacy Service
    const currentConsent = PrivacyService.getConsent();
    setSettings(prev => ({
      ...prev,
      allowAppAnalytics: currentConsent.allowAppAnalytics,
      allowLocationInsights: currentConsent.allowLocationInsights,
      receiveLocalOffers: currentConsent.receiveLocalOffers,
    }));
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Only merge emergency settings from backend
      // Privacy settings stay as defaults (frontend-only)
      const backendSettings = res.data.settings || {};
      setSettings(prev => ({ 
        ...prev, 
        // Only update emergency settings from backend
        enableEmergencyAlerts: backendSettings.enableEmergencyAlerts ?? prev.enableEmergencyAlerts
      }));
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      // Just use default settings - no need for alerts
      console.log('Using default settings (backend not available)');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    // Update local state immediately for better UX
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Update Privacy Service for privacy-related settings
    if (key === 'allowAppAnalytics' || key === 'allowLocationInsights' || key === 'receiveLocalOffers') {
      PrivacyService.updateConsent({ [key]: value });
    }
    
    // Only sync emergency settings with backend for now
    // Privacy settings (analytics, location, offers) work locally only
    if (key === 'enableEmergencyAlerts') {
      try {
        await axios.patch(
          'http://192.168.33.5:5000/api/user/settings',
          { [key]: value },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        console.warn('Failed to save emergency setting to backend:', err);
        // Could optionally revert this specific setting on failure
      }
    }
    // Privacy settings are frontend-only for now - no backend needed
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
        subtitle="Emergency features, privacy preferences, and account info"
        onMenuPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency</Text>
          
          {renderSettingRow(
            'emergency',
            'Emergency SMS Alerts',
            'Send ride details to emergency contacts via SMS when needed',
            settings.enableEmergencyAlerts,
            (value) => updateSetting('enableEmergencyAlerts', value)
          )}
        </ModernCard>

        {/* Privacy Preferences */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy Preferences</Text>
          
          {renderSettingRow(
            'analytics',
            'Usage Analytics',
            'Allow anonymous usage data to improve app performance',
            settings.allowAppAnalytics,
            (value) => updateSetting('allowAppAnalytics', value)
          )}

          {renderSettingRow(
            'insights',
            'Location Data',
            'Share location data to enhance service recommendations',
            settings.allowLocationInsights,
            (value) => updateSetting('allowLocationInsights', value)
          )}

          {renderSettingRow(
            'local-offer',
            'Personalized Content',
            'Allow personalized offers and content based on your activity',
            settings.receiveLocalOffers,
            (value) => updateSetting('receiveLocalOffers', value)
          )}
        </ModernCard>

        {/* Account Actions */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => Alert.alert('Help', 'Contact support at support@belfastridesapp.com')}
          >
            <MaterialIcons name="help" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => Alert.alert('Belfast Rides', 'Version 1.0.0\nMade with ❤️ in Belfast')}
          >
            <MaterialIcons name="info" size={20} color={colors.primary[500]} />
            <Text style={styles.actionText}>About</Text>
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
};

export default SettingsScreen;
