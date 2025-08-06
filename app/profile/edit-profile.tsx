import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedInput } from '@/components/ThemedInput';
import SettingsList from '@/components/ui/SettingsList';
import ScreenContainer from '@/components/ScreenContainer';
import { UserType } from '@/types/enums';
import { supabase, STORAGE_BUCKETS } from '@/utils/superbase';
import { uploadImage } from '@/utils/uploadUtils';
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
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
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

  const settingsData = [
    {
      title: 'Basic Information',
      data: [
        {
          title: 'First Name',
          subtitle: editedProfile.name || 'Enter your first name',
          icon: 'user',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Last Name',
          subtitle: editedProfile.surname || 'Enter your last name',
          icon: 'user',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Username',
          subtitle: editedProfile.username || 'Enter your username',
          icon: 'at-sign',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Bio',
          subtitle: editedProfile.bio || 'Tell us about yourself',
          icon: 'file-text',
          onPress: () => { },
          showArrow: false,
        },
      ]
    },
    {
      title: 'Account Type',
      data: [
        {
          title: 'Account Type',
          subtitle: editedProfile.user_type.charAt(0).toUpperCase() + editedProfile.user_type.slice(1),
          icon: 'briefcase',
          onPress: () => { },
          showArrow: false,
        },
      ]
    },
    {
      title: 'Contact Information',
      data: [
        {
          title: 'Website',
          subtitle: editedProfile.website || 'Enter your website',
          icon: 'globe',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Phone',
          subtitle: editedProfile.phone || 'Enter your phone number',
          icon: 'phone',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Location',
          subtitle: editedProfile.location || 'Enter your location',
          icon: 'map-pin',
          onPress: () => { },
          showArrow: false,
        },
      ]
    }
  ];

  if (editedProfile.user_type === UserType.Professional) {
    settingsData.splice(2, 0, {
      title: 'Professional Information',
      data: [
        {
          title: 'Profession',
          subtitle: editedProfile.profession || 'Enter your profession',
          icon: 'briefcase',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Experience Years',
          subtitle: editedProfile.experience_years || 'Enter years of experience',
          icon: 'clock',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Education',
          subtitle: editedProfile.education || 'Enter your education',
          icon: 'book',
          onPress: () => { },
          showArrow: false,
        },
        {
          title: 'Skills',
          subtitle: editedProfile.skills || 'Enter your skills',
          icon: 'award',
          onPress: () => { },
          showArrow: false,
        },
      ]
    });
  }

  if (editedProfile.user_type === UserType.Company) {
    settingsData.splice(2, 0, {
      title: 'Company Information',
      data: [
        {
          title: 'Company Name',
          subtitle: editedProfile.profession || 'Enter company name',
          icon: 'building',
          onPress: () => { },
          showArrow: false,
        },
      ]
    });
  }

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
    }
  };

  return (
    <ScreenContainer>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Custom Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          Edit Profile
        </ThemedText>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <ThemedText style={[styles.saveButtonText, { color: tintColor }]}>
            Save
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
      <ScrollView>
        {/* Avatar */}
        <Pressable onPress={pickAvatar} style={styles.avatarPreview}>
          <Image
            source={{
              uri:
                (profile?.avatar_url as string) ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  editedProfile.name || 'User'
                )}&size=60`,
            }}
            style={styles.avatarImage}
          />
          <View style={[styles.avatarOverlay, { backgroundColor: tintColor }]}>
            <Feather name="camera" size={16} color={backgroundColor} />
          </View>
        </Pressable>

        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>First Name</ThemedText>
            <ThemedInput
              value={editedProfile.name}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, name: v }))}
              style={styles.input}
              placeholder="Enter your first name"
            />
          </ThemedView>
          <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
            <ThemedInput
              value={editedProfile.surname}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, surname: v }))}
              style={styles.input}
              placeholder="Enter your last name"
            />
          </ThemedView>
          <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Username</ThemedText>
            <ThemedInput
              value={editedProfile.username}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, username: v }))}
              style={styles.input}
              placeholder="Enter your username"
            />
          </ThemedView>
          <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Bio</ThemedText>
            <ThemedInput
              value={editedProfile.bio}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, bio: v }))}
              multiline
              style={styles.multilineInput}
              placeholder="Tell us about yourself"
            />
          </ThemedView>
        </ThemedView>

        {/* User Type selection */}
        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Account Type</ThemedText>
            <View style={styles.userTypeContainer}>
              {Object.values(UserType).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.userTypeButton,
                    { borderColor: borderColor },
                    editedProfile.user_type === type && {
                      backgroundColor: tintColor,
                      borderColor: tintColor
                    }
                  ]}
                  onPress={() => setEditedProfile(p => ({ ...p, user_type: type }))}
                >
                  <ThemedText style={[
                    styles.userTypeText,
                    { color: mutedTextColor },
                    editedProfile.user_type === type && { color: backgroundColor }
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>
        </ThemedView>

        {editedProfile.user_type === UserType.Professional && (
          <ThemedView style={styles.formContainer}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Profession</ThemedText>
              <ThemedInput
                value={editedProfile.profession}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, profession: v }))}
                style={styles.input}
                placeholder="Enter your profession"
              />
            </ThemedView>
            <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Experience Years</ThemedText>
              <ThemedInput
                value={editedProfile.experience_years}
                keyboardType="numeric"
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, experience_years: v }))}
                style={styles.input}
                placeholder="Enter years of experience"
              />
            </ThemedView>
            <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Education</ThemedText>
              <ThemedInput
                value={editedProfile.education}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, education: v }))}
                style={styles.input}
                placeholder="Enter your education"
              />
            </ThemedView>
            <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Skills</ThemedText>
              <ThemedInput
                value={editedProfile.skills}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, skills: v }))}
                style={styles.input}
                placeholder="Enter your skills"
              />
            </ThemedView>
          </ThemedView>
        )}

        {editedProfile.user_type === UserType.Company && (
          <ThemedView style={styles.formContainer}>
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Company Name</ThemedText>
              <ThemedInput
                value={editedProfile.profession}
                onChangeText={(v: string) => setEditedProfile(p => ({ ...p, profession: v }))}
                style={styles.input}
                placeholder="Enter company name"
              />
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.formContainer}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Website</ThemedText>
            <ThemedInput
              value={editedProfile.website}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, website: v }))}
              keyboardType="url"
              style={styles.input}
              placeholder="Enter your website"
            />
          </ThemedView>
          <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Phone</ThemedText>
            <ThemedInput
              value={editedProfile.phone}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="Enter your phone number"
            />
          </ThemedView>
          <ThemedView style={[styles.separator, { backgroundColor: borderColor }]} />

          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Location</ThemedText>
            <ThemedInput
              value={editedProfile.location}
              onChangeText={(v: string) => setEditedProfile(p => ({ ...p, location: v }))}
              style={styles.input}
              placeholder="Enter your location"
            />
          </ThemedView>
        </ThemedView>

        {error && <ThemedText style={{ color: '#ef4444', margin: 8 }}>{error}</ThemedText>}
      </ScrollView>
    </ScreenContainer>
  );
}



const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  input: {
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  multilineInput: {
    borderWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
    height: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  separator: {
    height: 0.5,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    borderRadius: 16, padding: 6,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  userTypeButtonSelected: {
    borderWidth: 1,
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userTypeTextSelected: {
    fontWeight: '500',
  },
});
