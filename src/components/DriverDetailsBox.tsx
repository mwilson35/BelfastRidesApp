import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

interface Props {
  rideId: number;
  token: string;
  onChatPress?: () => void;
}

const DriverDetailsBox: React.FC<Props> = ({ rideId, token, onChatPress }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [driverDetails, setDriverDetails] = useState<any>(null);
  const [driverRating, setDriverRating] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://192.168.33.5:5000/api/rides/details?rideId=${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setDriverDetails(data.driverDetails);
        setDriverRating(data.driverRating);
      } catch (err) {
        console.error('Failed to fetch driver details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [rideId, token]);

  if (loading) {
    return (
      <View style={styles.box}>
        <Text style={styles.title}>Fetching driver details...</Text>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  if (error || !driverDetails) {
    return (
      <View style={[styles.box, { backgroundColor: '#f0f0f0' }]}> 
        <Text style={styles.title}>Driver details unavailable</Text>
      </View>
    );
  }

  const {
    username = 'Unknown Driver',
    vehicle_description = 'Vehicle info missing',
    vehicle_reg = 'Registration unavailable',
    profilePicUrl,
    phone_number,
  } = driverDetails || {};

  const {
    avgRating = 'N/A',
    totalRatings = 0,
  } = driverRating || {};

  const imageUri = profilePicUrl?.startsWith('http')
    ? profilePicUrl
    : profilePicUrl
      ? `http://192.168.33.5:5000/${profilePicUrl}`
      : 'https://via.placeholder.com/64';

  const handleCall = () => {
    if (phone_number) {
      const phoneUrl = `tel:${phone_number}`;
      Linking.openURL(phoneUrl).catch(() => {
        Alert.alert('Error', 'Unable to make phone call');
      });
    } else {
      Alert.alert('No Phone Number', 'Driver phone number not available');
    }
  };

  const handleChat = () => {
    if (onChatPress) {
      onChatPress();
    } else {
      Alert.alert('Chat', 'Chat feature coming soon!');
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Your Driver</Text>
      <View style={styles.profileRow}>
        <Image source={{ uri: imageUri }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.detail}>{vehicle_description}</Text>
          <Text style={styles.detail}>Plate: {vehicle_reg}</Text>
          <Text style={styles.rating}>⭐ {avgRating} ({totalRatings} ratings)</Text>
        </View>
      </View>
      
      {/* Communication Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
          <MaterialIcons name="chat" size={20} color="#fff" />
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <MaterialIcons name="phone" size={20} color="#fff" />
          <Text style={styles.buttonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

};

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  detail: {
    fontSize: 14,
    color: '#444',
  },
  rating: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DriverDetailsBox;
