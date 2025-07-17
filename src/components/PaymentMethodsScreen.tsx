import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
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

type PaymentMethod = {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  email?: string; // for PayPal
};

type Props = {
  token: string;
};

const PaymentMethodsScreen: React.FC<Props> = ({ token }) => {
  const navigation = useNavigation();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    nameOnCard: '',
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/payment/methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(res.data.methods || []);
    } catch (err: any) {
      console.error('Failed to fetch payment methods:', err);
      // Don't show error popup for 404 (endpoint not implemented yet)
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load payment methods');
      }
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newCard.cardNumber || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cvv) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        'http://192.168.33.5:5000/api/payment/methods',
        {
          type: 'card',
          cardNumber: newCard.cardNumber.replace(/\s/g, ''),
          expiryMonth: parseInt(newCard.expiryMonth),
          expiryYear: parseInt(newCard.expiryYear),
          cvv: newCard.cvv,
          nameOnCard: newCard.nameOnCard,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPaymentMethods(prev => [...prev, res.data.method]);
      setShowAddModal(false);
      setNewCard({ cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', nameOnCard: '' });
      Alert.alert('Success', 'Payment method added successfully');
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Feature Coming Soon', 'Payment methods will be available once the backend is fully set up.');
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to add payment method');
      }
    } finally {
      setSaving(false);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      await axios.patch(
        `http://192.168.33.5:5000/api/payment/methods/${methodId}/default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentMethods(prev =>
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );
      Alert.alert('Success', 'Default payment method updated');
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Feature Coming Soon', 'Payment methods will be available once the backend is fully set up.');
      } else {
        Alert.alert('Error', 'Failed to update default payment method');
      }
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://192.168.33.5:5000/api/payment/methods/${methodId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
              Alert.alert('Success', 'Payment method removed');
            } catch (err: any) {
              if (err.response?.status === 404) {
                Alert.alert('Feature Coming Soon', 'Payment methods will be available once the backend is fully set up.');
              } else {
                Alert.alert('Error', 'Failed to remove payment method');
              }
            }
          },
        },
      ]
    );
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substr(0, 19); // Max 16 digits + 3 spaces
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return 'credit-card';
      case 'mastercard': return 'credit-card';
      case 'amex': return 'credit-card';
      default: return 'credit-card';
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <ModernCard style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodInfo}>
          <MaterialIcons 
            name={item.type === 'card' ? getCardIcon(item.brand || '') : 'account-balance-wallet'} 
            size={24} 
            color={colors.primary[500]} 
          />
          <View style={styles.methodDetails}>
            {item.type === 'card' ? (
              <>
                <Text style={styles.methodTitle}>
                  {item.brand?.toUpperCase()} •••• {item.lastFour}
                </Text>
                <Text style={styles.methodSubtitle}>
                  Expires {item.expiryMonth?.toString().padStart(2, '0')}/{item.expiryYear}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.methodTitle}>{item.type.replace('_', ' ').toUpperCase()}</Text>
                {item.email && <Text style={styles.methodSubtitle}>{item.email}</Text>}
              </>
            )}
          </View>
        </View>
        
        <View style={styles.methodActions}>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => removePaymentMethod(item.id)}
            style={styles.removeButton}
          >
            <MaterialIcons name="delete" size={20} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {!item.isDefault && (
        <ModernButton
          title="Set as Default"
          variant="outline"
          size="sm"
          onPress={() => setDefaultMethod(item.id)}
          style={styles.defaultButton}
        />
      )}
    </ModernCard>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Payment Methods" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Payment Methods" 
        subtitle="Manage your payment options"
        onMenuPress={() => navigation.goBack()} 
      />

      <View style={styles.content}>
        <FlatList
          data={paymentMethods}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentMethod}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <ModernCard style={styles.emptyCard}>
              <MaterialIcons name="payment" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No payment methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a payment method to start booking rides
              </Text>
            </ModernCard>
          )}
        />

        <ModernButton
          title="Add Payment Method"
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        />
      </View>

      {/* Add Payment Method Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <ModernHeader 
            title="Add Card" 
            subtitle="Enter your card details"
            onMenuPress={() => setShowAddModal(false)} 
          />

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={newCard.cardNumber}
                onChangeText={(text) => setNewCard(prev => ({ ...prev, cardNumber: formatCardNumber(text) }))}
                placeholder="1234 5678 9012 3456"
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing[2] }]}>
                <Text style={styles.inputLabel}>Expiry Month</Text>
                <TextInput
                  style={styles.input}
                  value={newCard.expiryMonth}
                  onChangeText={(text) => setNewCard(prev => ({ ...prev, expiryMonth: text }))}
                  placeholder="MM"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing[2] }]}>
                <Text style={styles.inputLabel}>Expiry Year</Text>
                <TextInput
                  style={styles.input}
                  value={newCard.expiryYear}
                  onChangeText={(text) => setNewCard(prev => ({ ...prev, expiryYear: text }))}
                  placeholder="YYYY"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  value={newCard.cvv}
                  onChangeText={(text) => setNewCard(prev => ({ ...prev, cvv: text }))}
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name on Card</Text>
              <TextInput
                style={styles.input}
                value={newCard.nameOnCard}
                onChangeText={(text) => setNewCard(prev => ({ ...prev, nameOnCard: text }))}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.modalButtons}>
              <ModernButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowAddModal(false)}
                style={styles.cancelButton}
              />
              <ModernButton
                title="Add Card"
                onPress={addPaymentMethod}
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
  listContent: {
    paddingBottom: spacing[6],
  },
  methodCard: {
    marginBottom: spacing[3],
    padding: spacing[4],
  },
  methodHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  methodInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  methodDetails: {
    marginLeft: spacing[3],
    flex: 1,
  },
  methodTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  methodSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  methodActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  defaultBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginRight: spacing[2],
  },
  defaultText: {
    ...typography.styles.bodySmall,
    color: colors.success[700],
    fontWeight: '600' as const,
  },
  removeButton: {
    padding: spacing[2],
  },
  defaultButton: {
    alignSelf: 'flex-start' as const,
  },
  addButton: {
    marginTop: spacing[4],
  },
  emptyCard: {
    alignItems: 'center' as const,
    padding: spacing[8],
    marginTop: spacing[8],
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginTop: spacing[4],
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[2],
    lineHeight: 24,
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
  rowInputs: {
    flexDirection: 'row' as const,
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

export default PaymentMethodsScreen;
