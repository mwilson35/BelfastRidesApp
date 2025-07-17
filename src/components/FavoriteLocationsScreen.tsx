import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
  id: string | number; // Handle both string and number IDs from backend
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'other';
};

type Props = {
  token: string;
};

const FavoriteLocationsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    type: 'other' as 'home' | 'work' | 'other',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFavoriteLocations();
  }, []);

  const fetchFavoriteLocations = async () => {
    try {
      console.log('📋 Fetching favorite locations...');
      const res = await axios.get('http://192.168.33.5:5000/api/user/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('📋 Fetch favorites response:', res.data);
      
      // Handle different possible response formats
      const locations = res.data.locations || res.data.favorites || res.data || [];
      setFavoriteLocations(locations);
      console.log('📋 Set favorite locations:', locations);
    } catch (err: any) {
      console.error('❌ Failed to fetch favorite locations:', err);
      console.error('❌ Error response:', err.response?.data);
      
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load favorite locations');
      }
    } finally {
      setLoading(false);
    }
  };

  const addFavoriteLocation = async () => {
    if (!newLocation.name || !newLocation.address) {
      Alert.alert('Error', 'Please fill in name and address');
      return;
    }

    setSaving(true);
    try {
      // Step 1: Geocode the address
      console.log('🔍 Geocoding address:', newLocation.address);
      const geocodeRes = await axios.post(
        'http://192.168.33.5:5000/api/user/geocode',
        { address: newLocation.address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('📍 Geocode response:', geocodeRes.data);
      const { latitude, longitude } = geocodeRes.data;

      // Step 2: Add favorite location
      const locationData = {
        name: newLocation.name,
        address: newLocation.address,
        type: newLocation.type,
        latitude,
        longitude,
      };
      
      console.log('💾 Saving location data:', locationData);
      const res = await axios.post(
        'http://192.168.33.5:5000/api/user/favorites',
        locationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Add favorite response:', res.data);
      
      // Handle different possible response formats
      const newFavorite = res.data.location || res.data.favorite || res.data;
      setFavoriteLocations(prev => [...prev, newFavorite]);
      setShowAddLocationModal(false);
      setNewLocation({ name: '', address: '', type: 'other' });
      Alert.alert('Success', 'Favorite location added');
    } catch (err: any) {
      console.error('❌ Failed to add favorite location:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Request URL:', err.config?.url);
      
      if (err.response?.status === 404) {
        // Check if the error is from geocoding endpoint
        if (err.config?.url?.includes('/api/user/geocode')) {
          Alert.alert(
            'Address Lookup Unavailable', 
            'The address geocoding service is not yet available. Please contact support to enable this feature.'
          );
        } else {
          Alert.alert('Feature Coming Soon', 'Favorite locations will be available once the backend is fully set up.');
        }
      } else if (err.response?.data?.message) {
        Alert.alert('Error', err.response.data.message);
      } else {
        Alert.alert('Error', `Failed to add location: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const removeFavoriteLocation = async (locationId: string | number) => {
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
              console.log('🗑️ Removing location with ID:', locationId);
              await axios.delete(`http://192.168.33.5:5000/api/user/favorites/${locationId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setFavoriteLocations(prev => prev.filter(loc => loc.id != locationId)); // Use != to handle both types
              Alert.alert('Success', 'Location removed');
            } catch (err: any) {
              console.error('❌ Failed to remove location:', err);
              if (err.response?.status === 404) {
                Alert.alert('Feature Coming Soon', 'Favorite locations will be available once the backend is fully set up.');
              } else {
                Alert.alert('Error', 'Failed to remove location');
              }
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
    <TouchableOpacity key={location.id} style={styles.locationCard}>
      <View style={styles.locationContent}>
        <View style={styles.locationIcon}>
          <MaterialIcons 
            name={getLocationIcon(location.type)} 
            size={24} 
            color={colors.primary[500]} 
          />
        </View>
        <View style={styles.locationDetails}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationType}>{location.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.locationAddress}>{location.address}</Text>
        </View>
      </View>
      <View style={styles.locationActions}>
        <TouchableOpacity
          onPress={() => removeFavoriteLocation(location.id)}
          style={styles.removeButton}
        >
          <MaterialIcons name="close" size={20} color={colors.error[500]} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader 
          title="Favorite Locations" 
          onMenuPress={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading your favorite places...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Favorite Locations" 
        subtitle="Quick access to your frequently visited places"
        onMenuPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Location Button */}
        <ModernCard style={styles.addCard}>
          <ModernButton
            title="+ Add New Location"
            variant="outline"
            onPress={() => setShowAddLocationModal(true)}
            style={styles.addButton}
          />
          <Text style={styles.addHint}>Save your home, work, or frequently visited places for quick booking</Text>
        </ModernCard>

        {/* Favorite Locations List */}
        {favoriteLocations.length > 0 ? (
          <View style={styles.locationsContainer}>
            {favoriteLocations.map(renderFavoriteLocation)}
          </View>
        ) : (
          <ModernCard style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <MaterialIcons name="place" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No favorite locations yet</Text>
              <Text style={styles.emptySubtext}>
                Add your home, work, or frequently visited places to book rides faster
              </Text>
            </View>
          </ModernCard>
        )}
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
                placeholder="e.g., 123 Main Street, Belfast BT1 1AA, UK"
                autoCapitalize="words"
                multiline
              />
              <Text style={styles.inputHint}>
                Include street number, street name, city, and postcode for best results
              </Text>
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
  addCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
    alignItems: 'center' as const,
  },
  addButton: {
    width: '100%' as const,
    marginBottom: spacing[2],
  },
  addHint: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center' as const,
  },
  locationsContainer: {
    gap: spacing[3],
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationContent: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing[3],
  },
  locationDetails: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[1],
  },
  locationName: {
    ...typography.styles.h4,
    color: colors.text.primary,
    flex: 1,
  },
  locationType: {
    ...typography.styles.caption,
    color: colors.primary[500],
    fontWeight: '600' as const,
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  locationAddress: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  locationActions: {
    marginLeft: spacing[2],
  },
  removeButton: {
    padding: spacing[2],
    borderRadius: borderRadius.sm,
  },
  emptyCard: {
    padding: spacing[6],
  },
  emptyContainer: {
    alignItems: 'center' as const,
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.secondary,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  emptySubtext: {
    ...typography.styles.body,
    color: colors.text.tertiary,
    textAlign: 'center' as const,
    lineHeight: 22,
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
  inputHint: {
    ...typography.styles.caption,
    color: colors.gray[600],
    marginTop: spacing[1],
    fontStyle: 'italic' as const,
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

export default FavoriteLocationsScreen;
