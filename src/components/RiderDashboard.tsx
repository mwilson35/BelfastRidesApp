import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Button, 
  TextInput, 
  Keyboard, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable
} from 'react-native';
import MapScreen from './MapScreen';
import axios from 'axios';
import { useRideStore } from '../store/useRideStore';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { io } from 'socket.io-client';
import RatingModal from './RatingModal';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import DriverDetailsBox from './DriverDetailsBox';
import ChatScreen from './ChatScreen';

// Modern UI Components
import ModernHeader from './ui/ModernHeader';
import ModernCard from './ui/ModernCard';
import ModernButton from './ui/ModernButton';
import StatusBadge from './ui/StatusBadge';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  logout: () => void;
  token: string;
};

const socket = io('http://192.168.33.5:5000');

const requestRide = async (pickupLocation: string, destination: string, token: string | null) => {
  const response = await axios.post(
    'http://192.168.33.5:5000/api/rides/request',
    { pickupLocation, destination },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

const RiderDashboard: React.FC<Props> = ({ logout, token }) => {
  // Bottom sheet states: 'mini', 'half', 'full'
  const [bottomSheetState, setBottomSheetState] = useState<'mini' | 'half' | 'full'>('half');
  
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const { preview, setPreview, requestedRide, setRequestedRide } = useRideStore();
  const [mapKey, setMapKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState<'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rateeId, setRateeId] = useState<number | null>(null);
  const [showRideSummary, setShowRideSummary] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Connectivity state
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Favorites state
  const [favoriteLocations, setFavoriteLocations] = useState<any[]>([]);

  // Socket setup
  useEffect(() => {
    if (!token) return;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      setCurrentUserId(riderId); // Set current user ID for chat
      if (riderId) {
        socket.emit('registerRider', riderId);
        console.log('📡 registerRider sent for', riderId);
      }
    } catch (err) {
      console.error('Token decode failed:', err);
    }

    socket.on('driverAccepted', (data) => {
      console.log('🎉 driverAccepted event received:', data);
      setRideStatus('accepted');
      Alert.alert('Driver Accepted', `Your driver has accepted the ride.`);
    });

    socket.on('rideStarted', () => {
      console.log('🚕 Ride started');
      setRideStatus('in_progress');
      Alert.alert('Ride Started', 'Your ride is now in progress.');
    });

    socket.on('rideCompleted', (data) => {
      console.log('✅ Ride completed:', data);
      Alert.alert('Ride Completed', `Fare: £${data.fare}`);
      setRideStatus('completed');
      setRateeId(data.driverId);
      setShowRideSummary(true);
    });

    // Listen for driver location updates
    socket.on('driverLocationUpdate', (location) => {
      setDriverLocation(location);
    });

    return () => {
      socket.off('driverAccepted');
      socket.off('rideStarted');
      socket.off('rideCompleted');
      socket.off('driverLocationUpdate');
    };
  }, [token]);

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      setIsConnected(connected);
      
      if (!connected) {
        Alert.alert('No Internet', 'Please check your connection.');
      } else if (!isConnected && connected) {
        setIsReconnecting(true);
        setTimeout(() => setIsReconnecting(false), 2000);
      }
    });

    return unsubscribe;
  }, [isConnected]);

  useFocusEffect(
    React.useCallback(() => {
      setMapKey(prev => prev + 1);
      
      // Load favorites when screen comes into focus
      const loadFavorites = async () => {
        try {
          const res = await axios.get('http://192.168.33.5:5000/api/user/favorites', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const favorites = res.data.locations || res.data.favorites || res.data || [];
          setFavoriteLocations(favorites);
        } catch (err) {
          console.log('Could not load favorites');
        }
      };
      
      if (token) loadFavorites();
    }, [token])
  );

  const handlePostRatingCleanup = () => {
    setShowRatingModal(false);
    setRateeId(null);
    setRideStatus(null);
    setRequestedRide(null);
    setPreview(null);
    setPickupLocation('');
    setDestination('');
    setMapKey(prev => prev + 1);
  };

  const handlePreviewRide = async () => {
    Keyboard.dismiss();
    if (!pickupLocation || !destination) {
      Alert.alert('Error', 'Please enter both pickup and destination.');
      return;
    }

    if (!isConnected) {
      Alert.alert('No Internet', 'Please check your connection and try again.');
      return;
    }

    setLoading(true);
    setPreview(null);
    try {
      const response = await fetch('http://192.168.33.5:5000/api/rides/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pickupLocation, destination }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Preview failed');
      setPreview(data);
    } catch (err: any) {
      Alert.alert('Preview Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!requestedRide?.rideId) {
      Alert.alert('Error', 'No ride to cancel.');
      return;
    }

    try {
      await axios.post(
        'http://192.168.33.5:5000/api/rides/cancel',
        { rideId: requestedRide.rideId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Ride Cancelled', 'Your ride has been successfully cancelled.');
      handleClearPreview();
      setRideStatus(null);
    } catch (err: any) {
      Alert.alert('Cancel Failed', err.response?.data?.message || err.message);
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    setRequestedRide(null);
    setPickupLocation('');
    setDestination('');
  };

  const handleRequestRide = async () => {
    if (!preview) {
      Alert.alert('Error', 'Please preview the ride first.');
      return;
    }
    setRequestLoading(true);
    try {
      const data = await requestRide(pickupLocation, destination, token);
      setRequestedRide(data);
    } catch (err: any) {
      Alert.alert('Request Failed', err.response?.data?.message || err.message);
    } finally {
      setRequestLoading(false);
    }
  };

  // Calculate bottom sheet height based on state
  const getBottomSheetHeight = () => {
    switch (bottomSheetState) {
      case 'mini': return 80; // Just a thin bar
      case 'half': return screenHeight * 0.4; // 40% of screen
      case 'full': return screenHeight * 0.8; // 80% of screen
      default: return screenHeight * 0.4;
    }
  };

  const toggleBottomSheet = () => {
    if (bottomSheetState === 'mini') {
      setBottomSheetState('half');
    } else if (bottomSheetState === 'half') {
      setBottomSheetState('full');
    } else {
      setBottomSheetState('mini');
    }
  };

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.compactHeader}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Belfast Rides</Text>
        
        {/* Connection status */}
        <View style={styles.connectionStatus}>
          {!isConnected && (
            <MaterialIcons name="signal-wifi-off" size={20} color="#e53e3e" />
          )}
          {isReconnecting && (
            <MaterialIcons name="sync" size={20} color="#007bff" />
          )}
        </View>
        
        {/* Quick status when mini */}
        {bottomSheetState === 'mini' && rideStatus && (
          <View style={styles.quickStatus}>
            <Text style={styles.statusEmoji}>
              {rideStatus === 'in_progress' ? '🚕' : rideStatus === 'accepted' ? '🚗' : '⏳'}
            </Text>
          </View>
        )}
      </View>

      {/* Map - now gets most of the screen */}
      <View style={[styles.mapContainer, { height: screenHeight - getBottomSheetHeight() - 60 }]}>
        <MapScreen 
          key={mapKey} 
          encodedPolyline={(requestedRide || preview)?.encodedPolyline}
          driverLocation={driverLocation}
        />
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { height: getBottomSheetHeight() }]}>
        {/* Drag handle and toggle */}
        <TouchableOpacity onPress={toggleBottomSheet} style={styles.dragHandle}>
          <View style={styles.dragBar} />
          <MaterialIcons 
            name={bottomSheetState === 'mini' ? 'expand-less' : bottomSheetState === 'half' ? 'expand-less' : 'expand-more'} 
            size={20} 
            color="#999" 
          />
        </TouchableOpacity>

        {/* Content based on state */}
        {bottomSheetState === 'mini' ? (
          // Mini view - just essential info
          <View style={styles.miniContent}>
            {rideStatus ? (
              <Text style={styles.miniText}>
                {rideStatus === 'in_progress' ? 'Ride in Progress' : 
                 rideStatus === 'accepted' ? 'Driver En Route' : 'Finding Driver...'}
                {requestedRide && ` • £${requestedRide.estimatedFare}`}
              </Text>
            ) : (
              <Text style={styles.miniText}>Tap to book a ride</Text>
            )}
          </View>
        ) : (
          // Half and Full view
          <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
            {/* Input Section */}
            {!requestedRide && !['accepted', 'in_progress', 'completed'].includes(rideStatus || '') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Where to?</Text>
                <LocationAutocompleteInput
                  label="Pickup location"
                  value={pickupLocation}
                  onChange={setPickupLocation}
                />
                <View style={{ marginTop: 12 }}>
                  <LocationAutocompleteInput
                    label="Destination"
                    value={destination}
                    onChange={setDestination}
                  />
                </View>
                <View style={styles.buttonRow}>
                  <Button title="Preview Ride" onPress={handlePreviewRide} />
                  {preview && (
                    <Button title="Clear" onPress={handleClearPreview} color="#f77" />
                  )}
                </View>
              </View>
            )}

            
            {favoriteLocations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Select ({favoriteLocations.length} favorites)</Text>
                {favoriteLocations.map((location: any) => (
                  <View key={location.id} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{ 
                        flex: 1, 
                        backgroundColor: '#e3f2fd', 
                        padding: 10, 
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}
                      onPress={() => {
                        setPickupLocation(location.address);
                        // Don't clear destination - let user keep it if they want
                      }}
                    >
                      <MaterialIcons name="my-location" size={16} color="#1976d2" />
                      <Text style={{ fontSize: 12, color: '#1976d2' }}>From: {location.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ 
                        flex: 1, 
                        backgroundColor: '#1976d2', 
                        padding: 10, 
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8
                      }}
                      onPress={() => setDestination(location.address)}
                    >
                      <MaterialIcons name="place" size={16} color="white" />
                      <Text style={{ fontSize: 12, color: 'white' }}>To: {location.name}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {loading && <ActivityIndicator style={{ margin: 12 }} />}

            {/* Preview Section */}
            {preview && !requestedRide && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ride Preview</Text>
                <Text>Distance: {preview.distance}</Text>
                <Text>Duration: {preview.duration}</Text>
                <Text>Fare: {preview.estimatedFare}</Text>
                <View style={{ marginTop: 12 }}>
                  <Button title="Request Ride" onPress={handleRequestRide} disabled={requestLoading} />
                </View>
                {requestLoading && <ActivityIndicator style={{ marginTop: 8 }} />}
              </View>
            )}

            {/* Status Messages */}
            {rideStatus === 'accepted' && (
              <View style={styles.section}>
                <Text style={styles.statusTitle}>🚗 Driver en route...</Text>
              </View>
            )}

            {rideStatus === 'in_progress' && (
              <View style={styles.section}>
                <Text style={styles.statusTitle}>🕒 Ride in progress...</Text>
              </View>
            )}

            {/* Driver Details */}
            {rideStatus && ['accepted', 'in_progress'].includes(rideStatus) && requestedRide?.rideId && (
              <DriverDetailsBox 
                rideId={requestedRide.rideId} 
                token={token}
                onChatPress={() => setShowChatModal(true)}
              />
            )}

            {/* Active Ride Info */}
            {requestedRide && rideStatus !== 'completed' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Ride</Text>
                <Text>Distance: {requestedRide.distance}</Text>
                <Text>Duration: {requestedRide.duration}</Text>
                <Text>Fare: {requestedRide.estimatedFare}</Text>
                {rideStatus !== 'in_progress' && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title="Cancel Ride"
                      color="#f33"
                      onPress={() => {
                        Alert.alert('Cancel Ride?', 'Are you sure?', [
                          { text: 'No', style: 'cancel' },
                          { text: 'Yes, Cancel', style: 'destructive', onPress: cancelRide },
                        ]);
                      }}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Completed Ride Summary */}
            {rideStatus === 'completed' && showRideSummary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✅ Ride Completed!</Text>
                <Text>Distance: {requestedRide?.distance}</Text>
                <Text>Duration: {requestedRide?.duration}</Text>
                <Text>Fare: £{requestedRide?.estimatedFare}</Text>
                <View style={{ marginTop: 12 }}>
                  <Button
                    title="Rate Trip"
                    onPress={() => {
                      setShowRideSummary(false);
                      setShowRatingModal(true);
                    }}
                  />
                </View>
              </View>
            )}

            {/* Add some bottom padding */}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuModal}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Profile' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="person" size={22} color="#333" />
              <Text style={styles.menuText}>Profile</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('FavoriteLocations' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="place" size={22} color="#333" />
              <Text style={styles.menuText}>Favorite Locations</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('RideHistory' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="history" size={22} color="#333" />
              <Text style={styles.menuText}>Ride History</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('MyScheduledRides' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="event-note" size={22} color="#333" />
              <Text style={styles.menuText}>My Scheduled Rides</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('PaymentMethods' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="payment" size={22} color="#333" />
              <Text style={styles.menuText}>Payment Methods</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Notifications' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="notifications" size={22} color="#333" />
              <Text style={styles.menuText}>Notifications</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Emergency' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="emergency" size={22} color="#333" />
              <Text style={styles.menuText}>Emergency</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Settings' as never);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="settings" size={22} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMenuVisible(false);
                logout();
              }}
              style={[styles.menuItem, { marginTop: 8 }]}
            >
              <MaterialIcons name="logout" size={22} color="#e53e3e" />
              <Text style={[styles.menuText, { color: '#e53e3e' }]}>Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Rating Modal */}
      {showRatingModal && rateeId && (
        <RatingModal
          rideId={requestedRide?.rideId}
          rateeId={rateeId}
          visible={showRatingModal}
          token={token}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={handlePostRatingCleanup}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && requestedRide?.rideId && currentUserId && (
        <Modal
          visible={showChatModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChatModal(false)}
        >
          <ChatScreen
            rideId={requestedRide.rideId}
            token={token}
            currentUserId={currentUserId}
            currentUserType="rider"
            onClose={() => setShowChatModal(false)}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  connectionStatus: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatus: {
    paddingHorizontal: 8,
  },
  statusEmoji: {
    fontSize: 20,
  },
  mapContainer: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginRight: 8,
  },
  miniContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  miniText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: 12,
    gap: 8,
  },
  menuModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingLeft: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
});

export default RiderDashboard;
