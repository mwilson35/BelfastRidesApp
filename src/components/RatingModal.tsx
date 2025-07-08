import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: number;
  rateeId: number;
  token: string;
  onSubmitted: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ visible, onClose, rideId, rateeId, token, onSubmitted }) => {
  const [rating, setRating] = useState('5');
  const [review, setReview] = useState('');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      Alert.alert('Invalid Rating', 'Rating must be between 1 and 5.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://192.168.33.3:5000/ratings',
        { rideId, rateeId, rating: Number(rating), review, tip: tip ? Number(tip) : 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Rating submission failed:', error);
      Alert.alert('Error', 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Rate Your Driver</Text>
          <TextInput
            placeholder="Rating (1-5)"
            keyboardType="numeric"
            value={rating}
            onChangeText={setRating}
            style={styles.input}
          />
          <TextInput
            placeholder="Review (optional)"
            value={review}
            onChangeText={setReview}
            style={[styles.input, { height: 80 }]}
            multiline
          />
          <TextInput
            placeholder="Tip (optional)"
            keyboardType="numeric"
            value={tip}
            onChangeText={setTip}
            style={styles.input}
          />
          <View style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="#888" disabled={loading} />
            <Button title="Submit" onPress={handleSubmit} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default RatingModal;
