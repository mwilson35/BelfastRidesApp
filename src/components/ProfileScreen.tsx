import React, { useEffect, useState } from 'react';
import { View, Text, Image, Button, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';

type Profile = {
  username: string;
  email: string;
  profilePicUrl?: string;
};

const ProfileScreen = ({ token }: { token: string }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('http://192.168.33.3:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }, // ✅ FIXED
      })
      .then((res) => setProfile(res.data))
      .catch((err) => console.error('Profile load failed', err))
      .finally(() => setLoading(false));
  }, []);

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
        'http://192.168.33.3:5000/api/uploadDocument',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ FIXED
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

  if (loading) return <ActivityIndicator style={styles.loader} />;
  if (!profile) return <Text style={styles.center}>Failed to load profile.</Text>;

  const imageUri = profile.profilePicUrl?.startsWith('http')
    ? profile.profilePicUrl
    : `http://192.168.33.3:5000/${profile.profilePicUrl}`;

  return (
    <View style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.avatar} />
      ) : (
        <Text>No profile picture available.</Text>
      )}
      <Text style={styles.label}>
        <Text style={styles.bold}>Name:</Text> {profile.username}
      </Text>
      <Text style={styles.label}>
        <Text style={styles.bold}>Email:</Text> {profile.email}
      </Text>
      <Button title="Change Profile Photo" onPress={handlePickPhoto} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  label: { fontSize: 16, marginVertical: 4 },
  bold: { fontWeight: 'bold' },
  loader: { flex: 1, justifyContent: 'center' },
  center: { flex: 1, textAlign: 'center', marginTop: 20 },
});

export default ProfileScreen;
