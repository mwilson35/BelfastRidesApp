import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Modern UI Components
import ModernButton from './ui/ModernButton';
import ModernCard from './ui/ModernCard';
import ModernHeader from './ui/ModernHeader';

// Theme
import { colors, typography } from '../theme';
import { spacing, borderRadius, shadows } from '../theme/layout';

type Profile = {
  username: string;
  email: string;
  profilePicUrl?: string;
};

const ProfileScreen = ({ token }: { token: string }) => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://192.168.33.5:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setName(res.data.username);
      setEmail(res.data.email);
    } catch (err) {
      console.error('Profile load failed', err);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickPhoto = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel || response.errorMessage) return;
      if (response.assets?.[0]?.uri) uploadPhoto(response.assets[0].uri!);
    });
  };

  const uploadPhoto = async (uri: string) => {
    const formData = new FormData();
    formData.append('document', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    formData.append('documentType', 'profilePhoto');

    try {
      const res = await axios.post(
        'http://192.168.33.5:5000/api/documents/uploadDocument',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setProfile((prev) =>
        prev ? { ...prev, profilePicUrl: res.data.profilePicUrl } : prev
      );
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        'http://192.168.33.5:5000/api/user/profile',
        { username: name, email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Alert.alert('Success', 'Profile updated successfully');
      setProfile({ ...profile!, username: name, email });
      setEditMode(false);
    } catch (err) {
      console.error('Update failed:', err);
      Alert.alert('Update Failed', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Profile" onMenuPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <ModernHeader title="Profile" onMenuPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error[500]} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <ModernButton title="Retry" onPress={fetchProfile} />
        </View>
      </View>
    );
  }

  const imageUri = profile.profilePicUrl?.startsWith('http')
    ? profile.profilePicUrl
    : `http://192.168.33.5:5000/${profile.profilePicUrl}`;

  return (
    <View style={styles.container}>
      <ModernHeader title="Profile" subtitle="Manage your account" onMenuPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <ModernCard style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={60} color={colors.text.tertiary} />
              </View>
            )}
            <ModernButton
              title="Change Photo"
              onPress={handlePickPhoto}
              variant="outline"
              size="sm"
              style={styles.photoButton}
            />
          </View>
        </ModernCard>

        {/* Profile Info Section */}
        <ModernCard style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={name}
                onChangeText={setName}
                editable={editMode}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !editMode && styles.inputDisabled]}
                value={email}
                onChangeText={setEmail}
                editable={editMode}
                placeholder="Enter your email"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {editMode ? (
              <View style={styles.editButtonRow}>
                <ModernButton
                  title="Cancel"
                  onPress={() => {
                    setEditMode(false);
                    setName(profile.username);
                    setEmail(profile.email);
                  }}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <ModernButton
                  title="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveButton}
                />
              </View>
            ) : (
              <ModernButton
                title="Edit Profile"
                onPress={() => setEditMode(true)}
                fullWidth
              />
            )}
          </View>
        </ModernCard>

        {/* Account Stats */}
        <ModernCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Account Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-car" size={24} color={colors.primary[500]} />
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={24} color={colors.warning[500]} />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="account-circle" size={24} color={colors.success[500]} />
              <Text style={styles.statValue}>2y</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  errorText: {
    ...typography.styles.h3,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginVertical: spacing[4],
  },
  profileCard: {
    marginBottom: spacing[4],
  },
  avatarContainer: {
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing[4],
    borderWidth: 3,
    borderColor: colors.primary[100],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[4],
    borderWidth: 3,
    borderColor: colors.gray[200],
  },
  photoButton: {
    marginTop: spacing[2],
  },
  infoCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  fieldContainer: {
    marginBottom: spacing[4],
  },
  fieldLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    fontWeight: 600 as const,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[4],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    ...typography.styles.body,
    color: colors.text.primary,
    paddingVertical: spacing[4],
  },
  inputDisabled: {
    color: colors.text.secondary,
  },
  buttonContainer: {
    marginTop: spacing[6],
  },
  editButtonRow: {
    flexDirection: 'row' as const,
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  statsCard: {
    marginBottom: spacing[4],
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statValue: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  statLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
    textAlign: 'center' as const,
  },
};


export default ProfileScreen;
