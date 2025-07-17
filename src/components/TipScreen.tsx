import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
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
import { spacing, borderRadius } from '../theme/layout';

type TipSettings = {
  auto_tip_enabled: boolean;
  default_tip_amount: number;
};

type RecentRide = {
  id: number;
  pickup_location: string;
  destination: string;
  fare: number;
  requested_at: string;
  driver_name: string;
  existing_tip: number | null;
};

type Props = {
  token: string;
};

const TipScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [tipSettings, setTipSettings] = useState<TipSettings>({
    auto_tip_enabled: false,
    default_tip_amount: 0
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [customAmount, setCustomAmount] = useState('');

  const quickTipAmounts = [1, 3, 5, 10];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, ridesRes] = await Promise.all([
        axios.get('http://192.168.33.5:5000/api/user/tip-settings', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://192.168.33.5:5000/api/user/recent-rides-for-tip', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      // Validate and set tip settings
      const settings = settingsRes.data || {};
      setTipSettings({
        auto_tip_enabled: Boolean(settings.auto_tip_enabled),
        default_tip_amount: Number(settings.default_tip_amount || 0)
      });

      // Validate and set recent rides  
      const rides = Array.isArray(ridesRes.data) ? ridesRes.data : [];
      const validatedRides = rides.map((ride: any) => ({
        id: ride.id || 0,
        pickup_location: ride.pickup_location || 'Unknown pickup',
        destination: ride.destination || 'Unknown destination', 
        fare: Number(ride.fare || 0),
        requested_at: ride.requested_at || new Date().toISOString(),
        driver_name: ride.driver_name || '',
        existing_tip: ride.existing_tip ? Number(ride.existing_tip) : null
      }));
      setRecentRides(validatedRides);
      
      setCustomAmount((settings.default_tip_amount || 0).toString());
    } catch (err: any) {
      console.error('Failed to fetch tip data:', err);
      
      // Check if it's a 404 error (backend not implemented yet)
      if (err.response?.status === 404) {
        setBackendAvailable(false);
        // Set default values and show helpful message
        setTipSettings({
          auto_tip_enabled: false,
          default_tip_amount: 0
        });
        setRecentRides([]);
        Alert.alert(
          'Backend Setup Required', 
          'The tipping system backend endpoints need to be implemented. Using default settings for now.'
        );
      } else {
        Alert.alert('Error', 'Failed to load tip settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTipSettings = async (newSettings: Partial<TipSettings>) => {
    setSaving(true);
    try {
      const updatedSettings = { ...tipSettings, ...newSettings };
      
      await axios.put(
        'http://192.168.33.5:5000/api/user/tip-settings',
        updatedSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTipSettings(updatedSettings);
      Alert.alert('Success', 'Tip settings updated');
    } catch (err: any) {
      console.error('Failed to update tip settings:', err);
      
      if (err.response?.status === 404) {
        // Backend not implemented, just update local state
        setTipSettings({ ...tipSettings, ...newSettings });
        Alert.alert('Note', 'Settings updated locally. Backend implementation required for persistence.');
      } else {
        Alert.alert('Error', 'Failed to update tip settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const selectQuickAmount = (amount: number) => {
    setCustomAmount(amount.toString());
    updateTipSettings({ default_tip_amount: amount });
  };

  const updateCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 0 || amount > 100) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount between £0 and £100');
      return;
    }
    updateTipSettings({ default_tip_amount: amount });
  };

  const addTipToRide = async (rideId: number, tipAmount: number) => {
    try {
      await axios.post(
        'http://192.168.33.5:5000/api/user/add-tip',
        { ride_id: rideId, tip_amount: tipAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert('Success', `£${tipAmount.toFixed(2)} tip added!`);
      fetchData(); // Refresh the rides list
    } catch (err: any) {
      console.error('Failed to add tip:', err);
      
      if (err.response?.status === 404) {
        Alert.alert(
          'Backend Setup Required', 
          'The tip backend needs to be implemented. Your tip preference has been noted but not saved.'
        );
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to add tip');
      }
    }
  };

  const showTipAmountSelector = (ride: RecentRide) => {
    Alert.alert(
      'Add Tip',
      `Add tip for ride to ${ride.destination}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '£1', onPress: () => addTipToRide(ride.id, 1) },
        { text: '£3', onPress: () => addTipToRide(ride.id, 3) },
        { text: '£5', onPress: () => addTipToRide(ride.id, 5) },
        { 
          text: 'Custom', 
          onPress: () => {
            Alert.prompt(
              'Custom Tip Amount',
              'Enter tip amount (£):',
              (value) => {
                const amount = parseFloat(value || '0');
                if (!isNaN(amount) && amount > 0 && amount <= 100) {
                  addTipToRide(ride.id, amount);
                } else {
                  Alert.alert('Invalid Amount', 'Please enter a valid amount');
                }
              },
              'plain-text',
              '',
              'numeric'
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Tip Settings" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading tip settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Tip Settings" 
        subtitle="Manage your tipping preferences"
        onMenuPress={() => navigation.goBack()} 
      />

      {/* Backend Status Banner */}
      {!backendAvailable && (
        <View style={styles.statusBanner}>
          <MaterialIcons name="info" size={20} color={colors.warning[700]} />
          <Text style={styles.statusText}>
            Backend setup required. Settings saved locally only.
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Auto-Tip Settings */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Auto-Tip</Text>
          <Text style={styles.sectionDescription}>
            Automatically add a tip to every completed ride
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Auto-Tip</Text>
              <Text style={styles.settingSubtitle}>
                Tips will be added automatically after each ride
              </Text>
            </View>
            <Switch
              value={tipSettings.auto_tip_enabled}
              onValueChange={(enabled) => updateTipSettings({ auto_tip_enabled: enabled })}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={tipSettings.auto_tip_enabled ? colors.primary[500] : colors.gray[400]}
              disabled={saving}
            />
          </View>

          {tipSettings.auto_tip_enabled && (
            <>
              <Text style={styles.amountSectionTitle}>Default Tip Amount</Text>
              
              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountsRow}>
                {quickTipAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickAmountButton,
                      tipSettings.default_tip_amount === amount && styles.quickAmountButtonSelected
                    ]}
                    onPress={() => selectQuickAmount(amount)}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      tipSettings.default_tip_amount === amount && styles.quickAmountTextSelected
                    ]}>
                      £{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Amount */}
              <View style={styles.customAmountRow}>
                <Text style={styles.customAmountLabel}>Custom Amount (£):</Text>
                <View style={styles.customAmountContainer}>
                  <TextInput
                    style={styles.customAmountInput}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    onBlur={updateCustomAmount}
                  />
                  <ModernButton
                    title="Set"
                    onPress={updateCustomAmount}
                    size="sm"
                    disabled={saving}
                  />
                </View>
              </View>
            </>
          )}
        </ModernCard>

        {/* Recent Rides */}
        <ModernCard style={styles.card}>
          <Text style={styles.sectionTitle}>Add Tip to Past Rides</Text>
          <Text style={styles.sectionDescription}>
            Add tips to your recent completed rides
          </Text>

          {recentRides.length === 0 ? (
            <View style={styles.noRidesContainer}>
              <MaterialIcons name="directions-car" size={48} color={colors.gray[400]} />
              <Text style={styles.noRidesText}>No recent rides to tip</Text>
            </View>
          ) : (
            recentRides.map((ride) => (
              <TouchableOpacity
                key={ride.id}
                style={styles.rideItem}
                onPress={() => ride.existing_tip ? null : showTipAmountSelector(ride)}
                disabled={!!ride.existing_tip}
              >
                <View style={styles.rideInfo}>
                  <Text style={styles.rideDestination}>
                    {ride.pickup_location} → {ride.destination}
                  </Text>
                  <Text style={styles.rideDetails}>
                    {ride.requested_at ? new Date(ride.requested_at).toLocaleDateString() : 'Unknown date'} • £{Number(ride.fare || 0).toFixed(2)}
                    {ride.driver_name && ` • ${ride.driver_name}`}
                  </Text>
                </View>
                <View style={styles.rideAction}>
                  {ride.existing_tip ? (
                    <View style={styles.tippedBadge}>
                      <MaterialIcons name="check-circle" size={16} color={colors.success[500]} />
                      <Text style={styles.tippedText}>£{Number(ride.existing_tip || 0).toFixed(2)} tipped</Text>
                    </View>
                  ) : (
                    <MaterialIcons name="add-circle-outline" size={24} color={colors.primary[500]} />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
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
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  sectionDescription: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  settingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing[3],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  settingTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
  },
  settingSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  amountSectionTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  quickAmountsRow: {
    flexDirection: 'row' as const,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center' as const,
  },
  quickAmountButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  quickAmountText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    fontWeight: '600' as const,
  },
  quickAmountTextSelected: {
    color: colors.primary[500],
  },
  customAmountRow: {
    marginBottom: spacing[2],
  },
  customAmountLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  customAmountContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
  },
  customAmountInput: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  noRidesContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing[8],
  },
  noRidesText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  rideItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  rideInfo: {
    flex: 1,
  },
  rideDestination: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
    marginBottom: spacing[1],
  },
  rideDetails: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  rideAction: {
    marginLeft: spacing[3],
  },
  tippedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1],
  },
  tippedText: {
    ...typography.styles.bodySmall,
    color: colors.success[500],
    fontWeight: '600' as const,
  },
  statusBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[200],
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  statusText: {
    ...typography.styles.bodySmall,
    color: colors.warning[700],
    flex: 1,
  },
};

export default TipScreen;
