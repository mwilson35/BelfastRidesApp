import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
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

type FavoriteLocation = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'other';
};

type AppSettings = {
  defaultPaymentMethod: string;
  autoAcceptBestFare: boolean;
  shareLocationWithContacts: boolean;
  enablePushNotifications: boolean;
  enableLocationServices: boolean;
  enableTouchId: boolean;
  enableFaceId: boolean;
  autoBookFromFavorites: boolean;
  showDriverPhoto: boolean;
  enableRideReminders: boolean;
  preferredLanguage: string;
  distanceUnit: 'km' | 'miles';
  currency: 'GBP' | 'EUR' | 'USD';
};

type Props = {
  token: string;
};

const SettingsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultPaymentMethod: '',
    autoAcceptBestFare: false,
    shareLocationWithContacts: true,
    enablePushNotifications: true,
    enableLocationServices: true,
    enableTouchId: false,
    enableFaceId: false,
    autoBookFromFavorites: false,
    showDriverPhoto: true,
    enableRideReminders: true,
    preferredLanguage: 'en',
    distanceUnit: 'km',
    currency: 'GBP',
  });
  const [loading, setLoading] = useState(true);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    type: 'other' as 'home' | 'work' | 'other',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [locationsRes, settingsRes] = await Promise.all([
        axios.get('http://192.168.33.5:5000/api/user/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://192.168.33.5:5000/api/user/settings', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setFavoriteLocations(locationsRes.data.locations || []);
      setSettings(prev => ({ ...prev, ...settingsRes.data.settings }));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      Alert.alert('Error', 'Failed to load settings');
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
    } catch (err) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const addFavoriteLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

    setSaving(true);
    try {
      // Geocode the address
      const geocodeRes = await axios.post(
        'http://192.168.33.5:5000/api/geocode',
        { address: newLocation.address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { latitude, longitude } = geocodeRes.data;

      const res = await axios.post(
        'http://192.168.33.5:5000/api/user/favorites',
        {
          ...newLocation,
          latitude,
          longitude,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFavoriteLocations(prev => [...prev, res.data.location]);
      setShowAddLocationModal(false);
      setNewLocation({ name: '', address: '', type: 'other' });
      Alert.alert('Success', 'Favorite location added');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add location');
    } finally {
      setSaving(false);
    }
  };

  const removeFavoriteLocation = async (locationId: string) => {
    Alert.alert(
      'Remove Location',
      'Are you sure you want to remove this favorite location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://192.168.33.5:5000/api/user/favorites/${locationId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setFavoriteLocations(prev => prev.filter(loc => loc.id !== locationId));
              Alert.alert('Success', 'Location removed');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove location');
            }
          },
        },
      ]
    );
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home': return 'home';
      case 'work': return 'business';
      default: return 'place';
    }
  };

  const renderFavoriteLocation = (location: FavoriteLocation) => (
    <View key={location.id} style={styles.locationItem}>
      <View style={styles.locationInfo}>
        <MaterialIcons 
          name={getLocationIcon(location.type)} 
          size={20} 
          color={colors.primary[500]} 
        />
        <View style={styles.locationDetails}>
          <Text style={styles.locationName}>{location.name}</Text>
          <Text style={styles.locationAddress}>{location.address}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => removeFavoriteLocation(location.id)}
        style={styles.removeButton}
      >
        <MaterialIcons name="close" size={18} color={colors.error[500]} />
      </TouchableOpacity>
    </View>
  );

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
        subtitle="Customize your ride experience"
        onMenuPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Favorite Locations */}
        <ModernCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Favorite Locations</Text>
            <ModernButton
              title="Add Location"
              variant="outline"
              size="sm"
              onPress={() => setShowAddLocationModal(true)}
            />
          </View>

          {favoriteLocations.length > 0 ? (
            favoriteLocations.map(renderFavoriteLocation)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="place" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No favorite locations yet</Text>
              <Text style={styles.emptySubtext}>Add your home, work, or frequently visited places</Text>
            </View>
          )}
        </ModernCard>

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

        {/* App Preferences */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="language" size={20} color={colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingSubtitle}>App display language</Text>
              </View>
            </View>
            <Text style={styles.settingValue}>English</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="straighten" size={20} color={colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Distance Unit</Text>
                <Text style={styles.settingSubtitle}>Kilometers or miles</Text>
              </View>
            </View>
            <Text style={styles.settingValue}>
              {settings.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="attach-money" size={20} color={colors.primary[500]} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Currency</Text>
                <Text style={styles.settingSubtitle}>Preferred currency display</Text>
              </View>
            </View>
            <Text style={styles.settingValue}>{settings.currency}</Text>
          </View>
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

      {/* Add Location Modal */}
      <Modal visible={showAddLocationModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <ModernHeader 
            title="Add Favorite Location" 
            subtitle="Save a location for quick booking"
            onMenuPress={() => setShowAddLocationModal(false)} 
          />

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location Name</Text>
              <TextInput
                style={styles.input}
                value={newLocation.name}
                onChangeText={(text) => setNewLocation(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Home, Office, Gym"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={newLocation.address}
                onChangeText={(text) => setNewLocation(prev => ({ ...prev, address: text }))}
                placeholder="Enter full address"
                autoCapitalize="words"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {(['home', 'work', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newLocation.type === type && styles.selectedType
                    ]}
                    onPress={() => setNewLocation(prev => ({ ...prev, type }))}
                  >
                    <MaterialIcons 
                      name={getLocationIcon(type)} 
                      size={20} 
                      color={newLocation.type === type ? colors.white : colors.primary[500]} 
                    />
                    <Text style={[
                      styles.typeText,
                      newLocation.type === type && styles.selectedTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <ModernButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddLocationModal(false)}
                style={styles.cancelButton}
              />
              <ModernButton
                title="Add Location"
                onPress={addFavoriteLocation}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  locationItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  locationInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  locationDetails: {
    marginLeft: spacing[3],
    flex: 1,
  },
  locationName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
  },
  locationAddress: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  removeButton: {
    padding: spacing[2],
  },
  emptyContainer: {
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[2],
    textAlign: 'center' as const,
  },
  emptySubtext: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    textAlign: 'center' as const,
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
  settingValue: {
    ...typography.styles.body,
    color: colors.text.secondary,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContent: {
    flex: 1,
    padding: spacing[4],
  },
  inputGroup: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600' as const,
    marginBottom: spacing[2],
  },
  input: {
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: spacing[2],
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
    backgroundColor: colors.white,
  },
  selectedType: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  typeText: {
    ...typography.styles.bodySmall,
    color: colors.primary[500],
    marginLeft: spacing[2],
    fontWeight: '500' as const,
  },
  selectedTypeText: {
    color: colors.white,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: spacing[3],
    marginTop: spacing[6],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
};

export default SettingsScreen;
