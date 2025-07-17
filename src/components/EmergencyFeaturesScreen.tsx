import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  Linking,
  Modal,
  ActivityIndicator,
  ScrollView,
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

type EmergencyContact = {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
};

type Props = {
  token: string;
  isRideActive?: boolean;
  rideId?: number;
  currentLocation?: { latitude: number; longitude: number };
};

const EmergencyFeaturesScreen: React.FC<Props> = ({ 
  token, 
  isRideActive = false, 
  rideId,
  currentLocation 
}) => {
  const navigation = useNavigation();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [panicActivated, setPanicActivated] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/emergency/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmergencyContacts(res.data.contacts || []);
    } catch (err: any) {
      console.error('Failed to fetch emergency contacts:', err);
      // Don't show error popup for 404 (endpoint not implemented yet)
      if (err.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load emergency contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = async () => {
    if (!newContact.name || !newContact.phoneNumber) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        'http://192.168.33.5:5000/api/emergency/contacts',
        newContact,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmergencyContacts(prev => [...prev, res.data.contact]);
      setShowAddModal(false);
      setNewContact({ name: '', phoneNumber: '', relationship: '' });
      Alert.alert('Success', 'Emergency contact added successfully');
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Feature Coming Soon', 'Emergency features will be available once the backend is fully set up.');
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Failed to add emergency contact');
      }
    } finally {
      setSaving(false);
    }
  };

  const setPrimaryContact = async (contactId: string) => {
    try {
      await axios.patch(
        `http://192.168.33.5:5000/api/emergency/contacts/${contactId}/primary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmergencyContacts(prev =>
        prev.map(contact => ({
          ...contact,
          isPrimary: contact.id === contactId,
        }))
      );
      Alert.alert('Success', 'Primary emergency contact updated');
    } catch (err: any) {
      if (err.response?.status === 404) {
        Alert.alert('Feature Coming Soon', 'Emergency features will be available once the backend is fully set up.');
      } else {
        Alert.alert('Error', 'Failed to update primary contact');
      }
    }
  };

  const removeEmergencyContact = async (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`http://192.168.33.5:5000/api/emergency/contacts/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setEmergencyContacts(prev => prev.filter(contact => contact.id !== contactId));
              Alert.alert('Success', 'Emergency contact removed');
            } catch (err: any) {
              if (err.response?.status === 404) {
                Alert.alert('Feature Coming Soon', 'Emergency features will be available once the backend is fully set up.');
              } else {
                Alert.alert('Error', 'Failed to remove emergency contact');
              }
            }
          },
        },
      ]
    );
  };

  const callEmergencyServices = () => {
    Alert.alert(
      'Call Emergency Services',
      'This will call 999 (emergency services). Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 999',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:999');
          },
        },
      ]
    );
  };

  const shareRideDetails = async () => {
    try {
      const message = `
🚨 EMERGENCY RIDE SHARE 🚨

I am currently in a Belfast Rides taxi and sharing my location for safety.

Ride ID: ${rideId || 'Unknown'}
Time: ${new Date().toLocaleString()}
${currentLocation ? `Location: https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}` : ''}

If you don't hear from me within 30 minutes, please contact me or call emergency services.

This is an automated safety message.
      `.trim();

      // Send to all emergency contacts
      for (const contact of emergencyContacts) {
        const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(message)}`;
        await Linking.openURL(smsUrl);
      }

      Alert.alert('Success', 'Ride details shared with emergency contacts');
    } catch (err: any) {
      console.error('Failed to share ride details:', err);
      Alert.alert('Error', 'Failed to share ride details. Please manually contact your emergency contacts.');
    }
  };

  const activatePanicMode = async () => {
    setPanicActivated(true);
    try {
      // Send panic alert to backend
      await axios.post(
        'http://192.168.33.5:5000/api/emergency/panic',
        {
          rideId,
          location: currentLocation,
          timestamp: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Share location with emergency contacts
      await shareRideDetails();

      // Optionally auto-call primary contact
      const primaryContact = emergencyContacts.find(c => c.isPrimary);
      if (primaryContact) {
        Alert.alert(
          'Call Primary Contact?',
          `Would you like to call ${primaryContact.name}?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Call',
              onPress: () => Linking.openURL(`tel:${primaryContact.phoneNumber}`),
            },
          ]
        );
      }

    } catch (err: any) {
      console.error('Panic mode activation failed:', err);
      if (err.response?.status === 404) {
        // If backend endpoint doesn't exist yet, still allow local panic mode
        Alert.alert('Panic Mode Activated', 'Emergency features are being processed locally. Consider calling emergency services directly.');
      } else {
        Alert.alert('Error', 'Failed to activate panic mode fully');
      }
    }
    
    setShowPanicModal(false);
  };

  const renderEmergencyContact = ({ item }: { item: EmergencyContact }) => (
    <ModernCard style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactInfo}>
          <MaterialIcons name="person" size={24} color={colors.primary[500]} />
          <View style={styles.contactDetails}>
            <View style={styles.contactTitleRow}>
              <Text style={styles.contactName}>{item.name}</Text>
              {item.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryText}>Primary</Text>
                </View>
              )}
            </View>
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
            {item.relationship && (
              <Text style={styles.contactRelationship}>{item.relationship}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.contactActions}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
            style={styles.callButton}
          >
            <MaterialIcons name="phone" size={20} color={colors.success[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => removeEmergencyContact(item.id)}
            style={styles.removeButton}
          >
            <MaterialIcons name="delete" size={20} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>

      {!item.isPrimary && (
        <ModernButton
          title="Set as Primary"
          variant="outline"
          size="sm"
          onPress={() => setPrimaryContact(item.id)}
          style={styles.primaryButton}
        />
      )}
    </ModernCard>
  );

  return (
    <View style={styles.container}>
      <ModernHeader 
        title="Emergency Features" 
        subtitle="Safety tools and contacts"
        onMenuPress={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Actions */}
        <ModernCard style={styles.emergencyCard}>
          <Text style={styles.sectionTitle}>Emergency Actions</Text>
          
          <View style={styles.emergencyButtonsRow}>
            <ModernButton
              title="🚨 Call 999"
              onPress={callEmergencyServices}
              variant="error"
              style={styles.emergencyButton}
            />
            
            {isRideActive && (
              <ModernButton
                title="⚠️ Panic Mode"
                onPress={() => setShowPanicModal(true)}
                variant="error"
                style={styles.emergencyButton}
              />
            )}
          </View>

          {isRideActive && (
            <ModernButton
              title="📍 Share Ride Location"
              onPress={shareRideDetails}
              variant="outline"
              style={styles.shareButton}
            />
          )}
        </ModernCard>

        {/* Emergency Contacts */}
        <ModernCard style={styles.contactsCard}>
          <View style={styles.contactsHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <ModernButton
              title="Add Contact"
              variant="outline"
              size="sm"
              onPress={() => setShowAddModal(true)}
            />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : emergencyContacts.length > 0 ? (
            emergencyContacts.map((contact, index) => (
              <View key={contact.id}>
                {renderEmergencyContact({ item: contact })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="contacts" size={64} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No emergency contacts</Text>
              <Text style={styles.emptySubtitle}>
                Add emergency contacts to quickly get help when needed
              </Text>
            </View>
          )}
        </ModernCard>

        {/* Safety Tips */}
        <ModernCard style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <MaterialIcons name="share" size={16} color={colors.primary[500]} />
              <Text style={styles.tipText}>Share your ride details with trusted contacts</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="phone" size={16} color={colors.primary[500]} />
              <Text style={styles.tipText}>Keep your phone charged during rides</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="visibility" size={16} color={colors.primary[500]} />
              <Text style={styles.tipText}>Stay alert and trust your instincts</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="gps-fixed" size={16} color={colors.primary[500]} />
              <Text style={styles.tipText}>Keep location services enabled</Text>
            </View>
          </View>
        </ModernCard>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <ModernHeader 
            title="Add Emergency Contact" 
            subtitle="Someone to contact in case of emergency"
            onMenuPress={() => setShowAddModal(false)} 
          />

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={newContact.name}
                onChangeText={(text) => setNewContact(prev => ({ ...prev, name: text }))}
                placeholder="John Doe"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={newContact.phoneNumber}
                onChangeText={(text) => setNewContact(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="+44 7123 456789"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.input}
                value={newContact.relationship}
                onChangeText={(text) => setNewContact(prev => ({ ...prev, relationship: text }))}
                placeholder="e.g., Family, Friend, Partner"
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
                title="Add Contact"
                onPress={addEmergencyContact}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Panic Mode Confirmation Modal */}
      <Modal visible={showPanicModal} animationType="fade" transparent>
        <View style={styles.panicModalOverlay}>
          <View style={styles.panicModalContent}>
            <MaterialIcons name="warning" size={64} color={colors.error[500]} />
            <Text style={styles.panicTitle}>Activate Panic Mode?</Text>
            <Text style={styles.panicSubtitle}>
              This will immediately:
              {'\n'}• Share your location with emergency contacts
              {'\n'}• Alert Belfast Rides support
              {'\n'}• Prepare emergency services contact
            </Text>
            
            <View style={styles.panicButtons}>
              <ModernButton
                title="Cancel"
                variant="outline"
                onPress={() => setShowPanicModal(false)}
                style={styles.panicCancelButton}
              />
              <ModernButton
                title="Activate"
                variant="error"
                onPress={activatePanicMode}
                style={styles.panicActivateButton}
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
  emergencyCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  emergencyButtonsRow: {
    flexDirection: 'row' as const,
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  emergencyButton: {
    flex: 1,
  },
  shareButton: {
    marginTop: spacing[2],
  },
  contactsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  contactsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  loadingText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  contactCard: {
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  contactHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[3],
  },
  contactInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  contactDetails: {
    marginLeft: spacing[3],
    flex: 1,
  },
  contactTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[1],
  },
  contactName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  primaryBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  primaryText: {
    ...typography.styles.caption,
    color: colors.success[700],
    fontWeight: '600' as const,
  },
  contactPhone: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  contactRelationship: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  contactActions: {
    flexDirection: 'row' as const,
    gap: spacing[2],
  },
  callButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.success[50],
  },
  removeButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.error[50],
  },
  primaryButton: {
    alignSelf: 'flex-start' as const,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginTop: spacing[3],
    textAlign: 'center' as const,
  },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[2],
    lineHeight: 22,
  },
  tipsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  tipsList: {
    gap: spacing[3],
  },
  tipItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  tipText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginLeft: spacing[3],
    flex: 1,
    lineHeight: 20,
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
  panicModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[4],
  },
  panicModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center' as const,
    maxWidth: 320,
    width: '100%' as const,
  },
  panicTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    textAlign: 'center' as const,
    marginTop: spacing[3],
  },
  panicSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[3],
    lineHeight: 22,
  },
  panicButtons: {
    flexDirection: 'row' as const,
    gap: spacing[3],
    marginTop: spacing[6],
    width: '100%' as const,
  },
  panicCancelButton: {
    flex: 1,
  },
  panicActivateButton: {
    flex: 1,
  },
};

export default EmergencyFeaturesScreen;
