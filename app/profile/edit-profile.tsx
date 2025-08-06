import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  StatusBar,
  ScrollView,
  TextInput,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { useAuth } from '@/hooks/useAuth';
import { UserType } from '@/types/enums';
import { supabase, STORAGE_BUCKETS } from '@/utils/superbase';
import { uploadImage } from '@/utils/uploadUtils';
import ScreenContainer from '@/components/ScreenContainer';
import { Feather } from '@expo/vector-icons';

interface EditedProfile {
  name: string;
  surname: string;
  username: string;
  bio: string;
  user_type: UserType;
  website: string;
  phone: string;
  location: string;
  profession: string;
  experience_years: string;
  education: string;
  skills: string;
}

export default function EditProfileNative() {
  const router = useRouter();
  const { user, profile, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editedProfile, setEditedProfile] = useState<EditedProfile>({
    name: '',
    surname: '',
    username: '',
    bio: '',
    user_type: UserType.User,
    website: '',
    phone: '',
    location: '',
    profession: '',
    experience_years: '',
    education: '',
    skills: '',
  });

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        surname: profile.surname || '',
        username: profile.username || '',
        bio: profile.bio || '',
        user_type: profile.user_type,
        website: profile.website || '',
        phone: profile.phone || '',
        location: profile.location || '',
        profession: profile.profession || '',
        experience_years: profile.experience_years?.toString() || '',
        education: profile.education || '',
        skills: profile.skills?.join(', ') || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    if (!editedProfile.name?.trim() || !editedProfile.surname?.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...editedProfile,
          experience_years: editedProfile.experience_years
            ? parseInt(editedProfile.experience_years)
            : null,
          skills: editedProfile.skills
            ? editedProfile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
            : null,
        })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      await refresh();
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    if (!user || !profile) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    try {
      setUploading(true);
      setError(null);
      const uri = result.assets[0].uri;
      const publicUrl = await uploadImage({
        bucket: STORAGE_BUCKETS.AVATARS,
        userId: user.id,
        uri,
        fileNamePrefix: 'avatar',
      });
      if (!publicUrl) throw new Error('Failed to upload avatar');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      await refresh();
      Alert.alert('Success', 'Avatar updated!');
    } catch (e: any) {
      setError(e.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenContainer>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={loading || uploading}>
          <Text style={styles.headerButtonText}>Done</Text>
        </Pressable>
      </View>
      {(loading || uploading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Saving...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Avatar */}
          <Pressable onPress={pickAvatar} style={styles.avatarPreview}>
            <Image
              source={{
                uri:
                  (profile?.avatar_url as string) ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    editedProfile.name || 'User'
                  )}&size=100`,
              }}
              style={styles.avatarImage}
            />
            <View style={styles.avatarOverlay}>
              <Feather name="camera" size={20} color="#fff" />
            </View>
          </Pressable>

          <LabelledInput
            label="First Name"
            value={editedProfile.name}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, name: v }))}
          />
          <LabelledInput
            label="Last Name"
            value={editedProfile.surname}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, surname: v }))}
          />
          <LabelledInput
            label="Username"
            value={editedProfile.username}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, username: v }))}
          />
          <LabelledInput
            label="Bio"
            value={editedProfile.bio}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, bio: v }))}
            multiline
          />

          {/* User Type selection */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Account Type</Text>
            <View style={{ flexDirection: 'row' }}>
              {Object.values(UserType).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.userTypeButton,
                    editedProfile.user_type === type && styles.userTypeButtonSelected
                  ]}
                  onPress={() => setEditedProfile(p => ({ ...p, user_type: type }))}
                >
                  <Text style={{
                    color: editedProfile.user_type === type ? '#fff' : '#3871f3',
                  }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {editedProfile.user_type === UserType.Professional && (
            <>
              <LabelledInput
                label="Profession"
                value={editedProfile.profession}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, profession: v }))}
              />
              <LabelledInput
                label="Experience Years"
                value={editedProfile.experience_years}
                keyboardType="numeric"
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, experience_years: v }))}
              />
              <LabelledInput
                label="Education"
                value={editedProfile.education}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, education: v }))}
              />
              <LabelledInput
                label="Skills"
                value={editedProfile.skills}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, skills: v }))}
              />
            </>
          )}

          {editedProfile.user_type === UserType.Company && (
            <LabelledInput
              label="Company Name"
              value={editedProfile.profession}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, profession: v }))}
            />
          )}

          <LabelledInput
            label="Website"
            value={editedProfile.website}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, website: v }))}
            keyboardType="url"
          />
          <LabelledInput
            label="Phone"
            value={editedProfile.phone}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />
          <LabelledInput
            label="Location"
            value={editedProfile.location}
            onChangeText={(v: string) => setEditedProfile(p => ({ ...p, location: v }))}
          />

          {error && <Text style={{ color: 'red', margin: 8 }}>{error}</Text>}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

interface LabelledInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: string;
}

function LabelledInput({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: LabelledInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}</Text>
      <TextInput
        style={{
          height: multiline ? 80 : 40,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 6,
          paddingHorizontal: 12,
          fontSize: 16,
          backgroundColor: "#fff",
        }}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType as any}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3871f3'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3871f3',
    borderRadius: 15, padding: 6,
  },
  userTypeButton: {
    borderWidth: 1,
    borderColor: '#3871f3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff'
  },
  userTypeButtonSelected: {
    backgroundColor: '#3871f3',
    borderColor: '#3871f3',
  },
});
