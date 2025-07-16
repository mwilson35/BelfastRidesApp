import React, { useState, useEffect } from 'react';
import { View, Text, Keyboard, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { TouchableOpacity, Pressable } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

import MapScreen from './MapScreen';
import { useRideStore } from '../store/useRideStore';
import RatingModal from './RatingModal';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import DriverDetailsBox from './DriverDetailsBox';
import ChatScreen from './ChatScreen';

// Modern UI Components
import ModernHeader from './ui/ModernHeader';
import ModernCard from './ui/ModernCard';
import ModernButton from './ui/ModernButton';
import StatusBadge from './ui/StatusBadge';
import ErrorBoundary from './ui/ErrorBoundary';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

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
  // State declarations
  const [menuVisible, setMenuVisible] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
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

  const navigation = useNavigation();
  const route = useRoute();
  const { preview, setPreview, requestedRide, setRequestedRide, clearAll } = useRideStore();

  useFocusEffect(
    React.useCallback(() => {
      setMapKey((prev) => prev + 1);
    }, [])
  );

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
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ pickupLocation, destination })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Preview failed');
      setPreview(data);
    } catch (err: any) {
      if (!isConnected) {
        Alert.alert('Connection Lost', 'Please check your internet connection.');
      } else {
        Alert.alert('Preview Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

const cancelRide = async () => {
  if (!requestedRide?.rideId) {
    Alert.alert('Error', 'No ride to cancel.');
    return;
  }

  if (!isConnected) {
    Alert.alert('No Internet', 'Cannot cancel ride while offline. Please check your connection.');
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
    // Handle token expiration
    if (err.response?.status === 401) {
      Alert.alert('Session Expired', 'Please log in again.', [
        { text: 'OK', onPress: handleLogout }
      ]);
      return;
    }
    // Handle business rule violations (ride already started)
    if (err.response?.status === 400) {
      Alert.alert('Cannot Cancel', err.response?.data?.message || 'This ride cannot be cancelled as it has already started.');
      // Refresh ride status to sync with backend
      setRideStatus('in_progress');
      return;
    }
    if (!isConnected) {
      Alert.alert('Connection Lost', 'Please check your internet connection and try again.');
    } else {
      Alert.alert('Cancel Failed', err.response?.data?.message || err.message);
    }
  }
};



  const handleClearPreview = () => {
    setPreview(null);
    setRequestedRide(null); // <-- CLEAR REQUESTED RIDE TOO
    setPickupLocation('');
    setDestination('');
    setDriverLocation(null); // clear driver location
  };

  // ADDED HANDLE REQUEST RIDE FUNCTION CLEARLY:
  const handleRequestRide = async () => {
    if (!preview) {
      Alert.alert('Error', 'Please preview the ride first.');
      return;
    }

    if (!isConnected) {
      Alert.alert('No Internet', 'Cannot request ride while offline. Please check your connection.');
      return;
    }

    setRequestLoading(true);
    try {
      const data = await requestRide(pickupLocation, destination, token);
      setRequestedRide(data);
    } catch (err: any) {
      // Handle token expiration
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [
          { text: 'OK', onPress: handleLogout }
        ]);
        return;
      }
      if (!isConnected) {
        Alert.alert('Connection Lost', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Request Failed', err.response?.data?.message || err.message);
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleChatPress = () => {
    setShowChatModal(true);
  };

  const handleLogout = () => {
    // Clean up all ride state
    clearAll();
    setRideStatus(null);
    setDriverLocation(null);
    setShowChatModal(false);
    setShowRatingModal(false);
    setRateeId(null);
    setShowRideSummary(false);
    setMapKey(prev => prev + 1);
    
    // Disconnect socket
    socket.disconnect();
    
    // Call the parent logout function
    logout();
  };

  // Socket connection and event handlers
  useEffect(() => {
    if (!token) return;

    try {
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      if (riderId) {
        setCurrentUserId(riderId);
        
        // Delay socket connection to prevent immediate crashes
        const connectSocket = () => {
          try {
            // Ensure socket is connected before registering
            if (!socket.connected) {
              socket.connect();
            }
            
            socket.emit('registerRider', riderId);
            console.log('📡 registerRider sent for rider ID:', riderId);
            
            // Add a delay before fetching current ride status
            setTimeout(() => {
              try {
                fetchCurrentRideStatus();
              } catch (fetchError) {
                console.warn('Failed to fetch ride status:', fetchError);
              }
            }, 2000);
          } catch (socketError) {
            console.warn('Socket connection failed:', socketError);
          }
        };

        // Delay the entire socket setup
        setTimeout(connectSocket, 1000);
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

    socket.on('driverLocationUpdate', (location) => {
      console.log('📍 Driver location update:', location);
      setDriverLocation(location);
    });

    // Add socket connection event listeners for debugging
    socket.on('connect', () => {
      console.log('🔌 Socket connected, ID:', socket.id);
      const payload: any = JSON.parse(atob(token.split('.')[1]));
      const riderId = payload.id;
      if (riderId) {
        socket.emit('registerRider', riderId);
        console.log('🔄 Re-registered rider after reconnection:', riderId);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    return () => {
      socket.off('driverAccepted');
      socket.off('rideStarted');
      socket.off('rideCompleted');
      socket.off('driverLocationUpdate');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token]);

  // Fetch current ride status from backend
  const fetchCurrentRideStatus = async () => {
    try {
      if (!isConnected) {
        console.log('⚠️ Skipping ride status fetch - offline');
        return;
      }
      
      console.log('🔍 Fetching current ride status from backend...');
      
      const response = await axios.get('http://192.168.33.5:5000/api/rides/current', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      
      if (response.data.ride) {
        const currentRide = response.data.ride;
        console.log('🎯 Found active ride from backend:', currentRide);
        
        try {
          setRequestedRide({
            rideId: currentRide.id || currentRide.rideId,
            distance: currentRide.distance,
            duration: currentRide.duration,
            estimatedFare: currentRide.estimatedFare || currentRide.estimated_fare,
            encodedPolyline: currentRide.encodedPolyline || currentRide.encoded_polyline,
            status: currentRide.status
          });
          
          // Map backend status to frontend status
          switch (currentRide.status) {
            case 'requested':
              setRideStatus('requested');
              console.log('🔄 Synced status: requested');
              break;
            case 'accepted':
              setRideStatus('accepted');
              console.log('🔄 Synced status: accepted');
              // Show driver accepted notification since user missed it
              setTimeout(() => {
                Alert.alert('Driver Found!', 'A driver has accepted your ride.');
              }, 1000);
              break;
            case 'in_progress':
            case 'started':
              setRideStatus('in_progress');
              console.log('🔄 Synced status: in_progress');
              setTimeout(() => {
                Alert.alert('Ride in Progress', 'Your ride is currently in progress.');
              }, 1000);
              break;
            case 'completed':
              setRideStatus('completed');
              setRateeId(currentRide.driverId || currentRide.driver_id);
              setShowRideSummary(true);
              console.log('🔄 Synced status: completed');
              break;
            default:
              setRideStatus(null);
              console.log('🔄 Synced status: unknown -', currentRide.status);
          }
          
          console.log('✅ Successfully synced ride status from backend:', currentRide.status);
        } catch (stateError) {
          console.error('Failed to update ride state:', stateError);
        }
      } else {
        console.log('ℹ️ No active ride found in backend');
      }
    } catch (err: any) {
      // No active ride or error - this is fine for 404
      if (err.response?.status === 404) {
        console.log('ℹ️ No active ride (404) - this is normal');
      } else if (err.code === 'ECONNABORTED') {
        console.log('⏰ Request timeout - will retry later');
      } else {
        console.error('❌ Failed to fetch current ride status:', err.response?.status, err.message);
      }
    }
  };

  // Token validation helper
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  // Check token on component mount
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
        { text: 'OK', onPress: handleLogout }
      ]);
    }
  }, []);

  // State persistence functions
  const saveRideState = async () => {
    try {
      const state = {
        rideStatus,
        requestedRide,
        driverLocation,
        pickupLocation,
        destination,
        preview,
        currentUserId,
        rateeId,
        showRideSummary
      };
      // In a real app, you'd use AsyncStorage here
      console.log('💾 Saving ride state:', state);
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  };

  const loadRideState = async () => {
    try {
      // In a real app, you'd load from AsyncStorage here
      console.log('📂 Loading ride state...');
      // For now, we'll skip loading from storage
    } catch (err) {
      console.error('Failed to load state:', err);
    }
  };

  // Socket reconnection helper
  const reconnectSocket = () => {
    if (!isConnected) return;
    
    setIsReconnecting(true);
    socket.disconnect();
    socket.connect();
    
    if (currentUserId) {
      socket.emit('registerRider', currentUserId);
      console.log('🔄 Socket reconnected for rider:', currentUserId);
    }
    
    setTimeout(() => setIsReconnecting(false), 2000);
  };

  // Network connectivity monitoring
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = NetInfo.addEventListener(state => {
        try {
          const connected = !!(state.isConnected && state.isInternetReachable);
          
          if (connected !== isConnected) {
            setIsConnected(connected);
            
            if (connected) {
              console.log('🌐 Internet connection restored');
              setTimeout(() => {
                Alert.alert('Connection Restored', 'You are back online!');
                reconnectSocket();
                // Fetch current ride status when back online
                setTimeout(() => {
                  try {
                    fetchCurrentRideStatus();
                  } catch (fetchError) {
                    console.warn('Failed to fetch ride status after reconnection:', fetchError);
                  }
                }, 1500);
              }, 500);
            } else {
              console.log('📵 Internet connection lost');
              setTimeout(() => {
                Alert.alert(
                  'Connection Lost', 
                  'You are offline. The app will continue to work with limited functionality.',
                  [{ text: 'OK' }]
                );
              }, 500);
            }
          }
        } catch (stateError) {
          console.warn('NetInfo state handling error:', stateError);
        }
      });
    } catch (netInfoError) {
      console.warn('NetInfo setup failed:', netInfoError);
    }

    return () => {
      try {
        if (unsubscribe) {
          unsubscribe();
        }
      } catch (cleanupError) {
        console.warn('NetInfo cleanup error:', cleanupError);
      }
    };
  }, [isConnected]);

  // Load state on component mount
  useEffect(() => {
    loadRideState();
  }, []);

  // Save state when critical data changes
  useEffect(() => {
    if (rideStatus || requestedRide) {
      saveRideState();
    }
  }, [rideStatus, requestedRide, driverLocation]);

  // Helper functions
  const handlePostRatingCleanup = () => {
    setShowRatingModal(false);
    setRateeId(null);
    setRideStatus(null);
    setRequestedRide(null);
    setPreview(null);
    setPickupLocation('');
    setDestination('');
    setDriverLocation(null);
    setMapKey(prev => prev + 1);
  };


  return (
    <ErrorBoundary>
      <View style={styles.container}>
      {/* Modern Header with Connection Status */}
      <ModernHeader
        title="Belfast Rides"
        subtitle="Your reliable ride partner"
        onMenuPress={() => setMenuVisible(true)}
        showConnectionStatus={true}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ride Input Section */}
        {!requestedRide && !['accepted', 'in_progress', 'completed'].includes(rideStatus || '') && (
          <ModernCard style={styles.inputCard}>
            <Text style={styles.sectionTitle}>Where to?</Text>
            <LocationAutocompleteInput
              label="Pickup location"
              value={pickupLocation}
              onChange={setPickupLocation}
            />
            <View style={{ marginTop: spacing[3] }}>
              <LocationAutocompleteInput
                label="Destination"
                value={destination}
                onChange={setDestination}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <ModernButton
                title="Preview Ride"
                onPress={handlePreviewRide}
                loading={loading}
                fullWidth
                size="lg"
              />
              {preview && (
                <ModernButton
                  title="Clear"
                  onPress={handleClearPreview}
                  variant="outline"
                  style={{ marginTop: spacing[2] }}
                />
              )}
            </View>
          </ModernCard>
        )}

        {/* Ride Preview */}
        {preview && !requestedRide && (
          <ModernCard variant="elevated" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Ride Preview</Text>
              <StatusBadge status="requested" text="Ready to Book" />
            </View>
            
            <View style={styles.rideDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="straighten" size={20} color={colors.text.secondary} />
                <Text style={styles.detailText}>Distance: {preview.distance}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="schedule" size={20} color={colors.text.secondary} />
                <Text style={styles.detailText}>Duration: {preview.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="payment" size={20} color={colors.text.secondary} />
                <Text style={styles.fareText}>Fare: {preview.estimatedFare}</Text>
              </View>
            </View>

            <ModernButton
              title="Request Ride"
              onPress={handleRequestRide}
              loading={requestLoading}
              variant="success"
              size="lg"
              fullWidth
            />
          </ModernCard>
        )}

        {/* Ride Status Cards */}
        {rideStatus === 'accepted' && (
          <ModernCard variant="elevated" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <StatusBadge status="accepted" />
              <Text style={styles.statusTitle}>Driver Found!</Text>
            </View>
            <Text style={styles.statusSubtitle}>Your driver is on the way</Text>
          </ModernCard>
        )}

        {rideStatus === 'in_progress' && (
          <ModernCard variant="elevated" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <StatusBadge status="in_progress" />
              <Text style={styles.statusTitle}>Ride in Progress</Text>
            </View>
            <Text style={styles.statusSubtitle}>Enjoy your journey</Text>
          </ModernCard>
        )}

        {/* Driver Details */}
        {rideStatus && ['accepted', 'in_progress'].includes(rideStatus) && requestedRide?.rideId && (
          <DriverDetailsBox 
            rideId={requestedRide.rideId} 
            token={token} 
            onChatPress={handleChatPress}
          />
        )}

        {/* Completed Ride Summary */}
        {rideStatus === 'completed' && showRideSummary && (
          <ModernCard variant="elevated" style={styles.completedCard}>
            <View style={styles.completedHeader}>
              <StatusBadge status="completed" />
              <Text style={styles.completedTitle}>Trip Completed!</Text>
            </View>
            
            <View style={styles.rideDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="straighten" size={20} color={colors.text.secondary} />
                <Text style={styles.detailText}>Distance: {requestedRide?.distance}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="schedule" size={20} color={colors.text.secondary} />
                <Text style={styles.detailText}>Duration: {requestedRide?.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="payment" size={20} color={colors.text.secondary} />
                <Text style={styles.fareText}>Total: £{requestedRide?.estimatedFare}</Text>
              </View>
            </View>

            <ModernButton
              title="Rate Your Trip"
              onPress={() => {
                setShowRideSummary(false);
                setShowRatingModal(true);
              }}
              variant="primary"
              size="lg"
              fullWidth
            />
          </ModernCard>
        )}

        {/* Spacer for floating active ride card */}
        {requestedRide && rideStatus !== 'completed' && (
          <View style={{ height: 200 }} />
        )}
      </ScrollView>

      {/* Active Ride Floating Card */}
      {requestedRide && rideStatus !== 'completed' && (
        <View style={styles.floatingCard}>
          <ModernCard variant="elevated" style={styles.activeRideCard}>
            <View style={styles.activeRideHeader}>
              <Text style={styles.activeRideTitle}>Active Ride</Text>
              <StatusBadge status={rideStatus as any} />
            </View>
            
            <View style={styles.rideDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="straighten" size={18} color={colors.text.secondary} />
                <Text style={styles.detailTextSmall}>Distance: {requestedRide.distance}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="schedule" size={18} color={colors.text.secondary} />
                <Text style={styles.detailTextSmall}>Duration: {requestedRide.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="payment" size={18} color={colors.text.secondary} />
                <Text style={styles.fareTextSmall}>Fare: {requestedRide.estimatedFare}</Text>
              </View>
            </View>

            {rideStatus !== 'in_progress' && requestedRide.status !== 'in_progress' && requestedRide.status !== 'started' && (
              <ModernButton
                title="Cancel Ride"
                onPress={() => {
                  Alert.alert('Cancel Ride?', 'Are you sure?', [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: cancelRide },
                  ]);
                }}
                variant="error"
                size="sm"
                fullWidth
              />
            )}
          </ModernCard>
        </View>
      )}

      {/* Map View - DISABLED FOR DEBUGGING */}
      <View style={styles.mapContainer}>
        <View style={{ flex: 1, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Map disabled for debugging</Text>
        </View>
      </View>

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
    presentationStyle="fullScreen"
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

{/* Navigation Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuModal} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuContainer} onPress={() => {}}>
            <Text style={styles.menuTitle}>Menu</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('RideHistory' as never);
              }}
            >
              <MaterialIcons name="history" size={24} color={colors.text.secondary} />
              <Text style={styles.menuItemText}>Ride History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('MyScheduledRides' as never);
              }}
            >
              <MaterialIcons name="schedule" size={24} color={colors.text.secondary} />
              <Text style={styles.menuItemText}>Scheduled Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('Profile' as never);
              }}
            >
              <MaterialIcons name="person" size={24} color={colors.text.secondary} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={() => {
                setMenuVisible(false);
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: handleLogout },
                ]);
              }}
            >
              <MaterialIcons name="logout" size={24} color={colors.error[600]} />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>

            <ModernButton
              title="Close"
              onPress={() => setMenuVisible(false)}
              variant="outline"
              size="sm"
              style={{ marginTop: spacing[4] }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </ErrorBoundary>
  );
};

export default RiderDashboard;

// Modern Styles using the design system
const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    backgroundColor: 'transparent',
  },
  inputCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  buttonRow: {
    marginTop: spacing[4],
  },
  previewCard: {
    marginBottom: spacing[4],
  },
  previewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  previewTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },
  rideDetails: {
    marginBottom: spacing[4],
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[2],
  },
  detailText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginLeft: spacing[2],
    flex: 1,
  },
  detailTextSmall: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing[2],
    flex: 1,
  },
  fareText: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: '600' as const,
    fontSize: 18,
    marginLeft: spacing[2],
    flex: 1,
  },
  fareTextSmall: {
    ...typography.styles.body,
    color: colors.primary[600],
    fontWeight: '600' as const,
    marginLeft: spacing[2],
    flex: 1,
  },
  statusCard: {
    marginBottom: spacing[4],
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[2],
  },
  statusTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginLeft: spacing[2],
  },
  statusSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  completedCard: {
    marginBottom: spacing[4],
  },
  completedHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  completedTitle: {
    ...typography.styles.h3,
    color: colors.success[600],
    marginLeft: spacing[2],
  },
  floatingCard: {
    position: 'absolute' as const,
    bottom: 80,
    left: spacing[4],
    right: spacing[4],
    zIndex: 10,
    ...shadows.md,
  },
  activeRideCard: {
    padding: spacing[4],
  },
  activeRideHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  activeRideTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  mapContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  // Navigation Menu Modal Styles
  menuModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    margin: spacing[4],
    width: '80%' as const,
    maxWidth: 300,
    ...shadows.lg,
  },
  menuTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: spacing[4],
  },
  menuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  menuItemText: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginLeft: spacing[3],
    flex: 1,
  },
  logoutItem: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  logoutText: {
    color: colors.error[600],
  },
};


