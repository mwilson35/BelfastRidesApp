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
  memberSince?: string;
  role?: string;
};

type Statistics = {
  totalRides: number;
  completedRides: number;
  totalSpent: number;
  totalDistance: number;
  avgFare: number;
  favoritesCount: number;
};

type DashboardData = {
  user: Profile;
  statistics: Statistics;
  recentActivity: Array<{
    id: number;
    from: string;
    to: string;
    fare: number;
    status: string;
    date: string;
  }>;
};

const ProfileScreen = ({ token }: { token: string }) => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // First, always fetch basic profile data
      const profileRes = await axios.get('http://192.168.33.5:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProfile(profileRes.data);
      setName(profileRes.data.username);
      setEmail(profileRes.data.email);

      // Then try to get dashboard stats separately
      try {
        const dashboardRes = await axios.get('http://192.168.33.5:5000/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (dashboardRes.data && dashboardRes.data.statistics) {
          setStatistics(dashboardRes.data.statistics);
          // Also update profile with more complete data if available
          if (dashboardRes.data.user) {
            setProfile(dashboardRes.data.user);
          }
        }
      } catch (statsErr: any) {
        // Dashboard stats failed, but that's okay - profile still works
        console.log('Stats not available:', statsErr.response?.status || 'Network error');
        setStatistics(null);
      }
      
    } catch (err: any) {
      console.error('Profile load failed:', err);
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
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('document', {
      uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    formData.append('documentType', 'profilePhoto');

    try {
      console.log('Uploading photo to:', 'http://192.168.33.5:5000/api/documents/uploadDocument');
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
      console.log('Upload successful:', res.data);
      setProfile((prev) =>
        prev ? { ...prev, profilePicUrl: res.data.profilePicUrl } : prev
      );
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Upload failed:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile picture';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        'http://192.168.33.5:5000/api/user/profile',
        { email }, // Only update email, not username
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      Alert.alert('Success', 'Email updated successfully');
      setProfile({ ...profile!, email });
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

  const imageUri = profile?.profilePicUrl?.startsWith('http')
    ? profile.profilePicUrl
    : profile?.profilePicUrl 
    ? `http://192.168.33.5:5000/${profile.profilePicUrl}`
    : null;

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
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
              </View>
            )}
            <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
            <Text style={styles.profileRole}>
              {profile?.role || 'Rider'} • Member since {
                profile?.memberSince 
                  ? new Date(profile.memberSince).getFullYear() 
                  : 'Recently'
              }
            </Text>
            <ModernButton
              title={uploadingPhoto ? "Uploading..." : "Change Photo"}
              onPress={handlePickPhoto}
              variant="outline"
              size="sm"
              style={styles.photoButton}
              disabled={uploadingPhoto}
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
                style={[styles.input, styles.inputDisabled]}
                value={name}
                editable={false}
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
                    setEmail(profile.email); // Only revert email, not name
                  }}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <ModernButton
                  title="Save Email"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveButton}
                />
              </View>
            ) : (
              <ModernButton
                title="Edit Email"
                onPress={() => setEditMode(true)}
                fullWidth
              />
            )}
          </View>
        </ModernCard>

        {/* Account Stats */}
        <ModernCard style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
          {statistics ? (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons name="directions-car" size={24} color={colors.primary[500]} />
                  <Text style={styles.statValue}>{statistics.totalRides}</Text>
                  <Text style={styles.statLabel}>Total Rides</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="attach-money" size={24} color={colors.success[500]} />
                  <Text style={styles.statValue}>£{statistics.totalSpent.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="calendar-today" size={24} color={colors.primary[500]} />
                  <Text style={styles.statValue}>
                    {profile?.memberSince ? new Date(profile.memberSince).getFullYear() : 'New'}
                  </Text>
                  <Text style={styles.statLabel}>Member Since</Text>
                </View>
              </View>
              
              {/* Additional Stats Row */}
              <View style={[styles.statsRow, { marginTop: spacing[4] }]}>
                <View style={styles.statItem}>
                  <MaterialIcons name="route" size={24} color={colors.warning[500]} />
                  <Text style={styles.statValue}>{statistics.totalDistance.toFixed(0)} km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="favorite" size={24} color={colors.error[500]} />
                  <Text style={styles.statValue}>{statistics.favoritesCount}</Text>
                  <Text style={styles.statLabel}>Favorites</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="trending-up" size={24} color={colors.success[500]} />
                  <Text style={styles.statValue}>£{statistics.avgFare.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Avg Fare</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noStatsContainer}>
              <Text style={styles.noStatsText}>Ride statistics will appear here after your first completed trip.</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons name="directions-car" size={24} color={colors.primary[500]} />
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>Total Rides</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="calendar-today" size={24} color={colors.success[500]} />
                  <Text style={styles.statValue}>
                    {profile?.memberSince ? new Date(profile.memberSince).getFullYear() : 'New'}
                  </Text>
                  <Text style={styles.statLabel}>Member Since</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="verified" size={24} color={colors.primary[500]} />
                  <Text style={styles.statValue}>✓</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
            </View>
          )}
        </ModernCard>

        {/* Account Actions */}
        <ModernCard style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => Alert.alert('Help & Support', 'For assistance, please contact us via the app or visit our website.')}
          >
            <View style={styles.actionContent}>
              <MaterialIcons name="help" size={24} color={colors.primary[500]} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Help & Support</Text>
                <Text style={styles.actionSubtitle}>Get help with your account and rides</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => Alert.alert('About', `Belfast Rides App\nVersion 1.0\n\nProviding reliable transportation across Belfast.`)}
          >
            <View style={styles.actionContent}>
              <MaterialIcons name="info" size={24} color={colors.primary[500]} />
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>About</Text>
                <Text style={styles.actionSubtitle}>App information and version</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
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
  uploadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 60,
    marginBottom: spacing[4],
  },
  photoButton: {
    marginTop: spacing[2],
  },
  profileName: {
    ...typography.styles.h3,
    color: colors.text.primary,
    textAlign: 'center' as const,
    marginTop: spacing[2],
  },
  profileRole: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginTop: spacing[1],
    marginBottom: spacing[2],
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
  fieldNote: {
    ...typography.styles.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    fontStyle: 'italic' as const,
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
  actionsCard: {
    marginBottom: spacing[4],
  },
  actionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  actionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  actionText: {
    marginLeft: spacing[3],
    flex: 1,
  },
  actionTitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: '600' as const,
  },
  actionSubtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
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
  noStatsContainer: {
    padding: spacing[4],
  },
  noStatsText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: spacing[4],
    fontStyle: 'italic' as const,
  },
};


export default ProfileScreen;
