import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable, StatusBar, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
// import { ThemedInput } from '@/components/ThemedInput';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
import SettingsList from '@/components/ui/SettingsList';
import ScreenContainer from '@/components/ScreenContainer';
import { UserType } from '@/types/enums';
import { supabase } from '@/utils/supabase';
import { STORAGE_BUCKETS , uploadImage } from '@/utils/uploadUtils';
import { Feather } from '@expo/vector-icons';

import { ProfileFormData } from '@/types';
import { checkProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { useFlashToast } from '@/components/ui/Flash';

export default function EditProfileNative() {
  const router = useRouter();
  const { user, profile, refresh } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  // const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');
  // const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
  const [error, setError] = useState<string | null>(null);
  const toast = useFlashToast();

  const [editedProfile, setEditedProfile] = useState<ProfileFormData>({
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
          subtitle: 'Enter your first name',
          icon: 'user',
          showTextInput: true,
          textInputValue: editedProfile.name,
          textInputPlaceholder: 'Enter your first name',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, name: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 50,
          },
        },
        {
          title: 'Last Name',
          subtitle: 'Enter your last name',
          icon: 'user',
          showTextInput: true,
          textInputValue: editedProfile.surname,
          textInputPlaceholder: 'Enter your last name',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, surname: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 50,
          },
        },
        {
          title: 'Username',
          subtitle: 'Enter your username',
          icon: 'at-sign',
          showTextInput: true,
          textInputValue: editedProfile.username,
          textInputPlaceholder: 'Enter your username',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, username: text })),
          textInputProps: {
            autoCapitalize: 'none',
            maxLength: 30,
          },
        },
        {
          title: 'Bio',
          subtitle: 'Tell us about yourself',
          icon: 'file-text',
          showTextInput: true,
          textInputValue: editedProfile.bio,
          textInputPlaceholder: 'Write a short bio about yourself...',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, bio: text })),
          textInputProps: {
            multiline: true,
            numberOfLines: 2,
            maxLength: 200,
          },
        },
      ]
    },

    {
      title: 'Professional Information',
      data: [
        {
          title: 'Profession',
          subtitle: 'Enter your profession',
          icon: 'briefcase',
          showTextInput: true,
          textInputValue: editedProfile.profession,
          textInputPlaceholder: 'e.g., Software Engineer',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, profession: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 100,
          },
        },
        {
          title: 'Experience Years',
          subtitle: 'Enter years of experience',
          icon: 'clock',
          showTextInput: true,
          textInputValue: editedProfile.experience_years,
          textInputPlaceholder: 'e.g., 5',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, experience_years: text })),
          textInputProps: {
            keyboardType: 'numeric',
            maxLength: 2,
          },
        },
        {
          title: 'Education',
          subtitle: 'Enter your education',
          icon: 'book',
          showTextInput: true,
          textInputValue: editedProfile.education,
          textInputPlaceholder: 'e.g., Bachelor of Computer Science',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, education: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 200,
          },
        },
        {
          title: 'Skills',
          subtitle: 'Enter your skills',
          icon: 'award',
          showTextInput: true,
          textInputValue: editedProfile.skills,
          textInputPlaceholder: 'e.g., JavaScript, React, Node.js',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, skills: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 300,
          },
        },
      ]
    },
    {
      title: 'Contact Information',
      data: [
        {
          title: 'Website',
          subtitle: 'Enter your website',
          icon: 'globe',
          showTextInput: true,
          textInputValue: editedProfile.website,
          textInputPlaceholder: 'https://yourwebsite.com',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, website: text })),
          textInputProps: {
            autoCapitalize: 'none',
            keyboardType: 'url',
            maxLength: 100,
          },
        },
        {
          title: 'Phone',
          subtitle: 'Enter your phone number',
          icon: 'phone',
          showTextInput: true,
          textInputValue: editedProfile.phone,
          textInputPlaceholder: '+1 (555) 123-4567',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, phone: text })),
          textInputProps: {
            keyboardType: 'phone-pad',
            maxLength: 20,
          },
        },
        {
          title: 'Location',
          subtitle: 'Enter your location',
          icon: 'map-pin',
          showTextInput: true,
          textInputValue: editedProfile.location,
          textInputPlaceholder: 'City, Country',
          onTextInputChange: (text: string) => setEditedProfile(prev => ({ ...prev, location: text })),
          textInputProps: {
            autoCapitalize: 'words',
            maxLength: 100,
          },
        },
      ]
    },
    {
      title: 'Account Settings',
      data: [
        {
          title: 'Switch to Business Account',
          subtitle: editedProfile.user_type === UserType.Business ? 'Currently a business account' : 'Convert to business account',
          icon: 'briefcase',
          showSwitch: true,
          switchValue: editedProfile.user_type === UserType.Business,
          onSwitchChange: async (value: boolean) => {
            const newUserType = value ? UserType.Business : UserType.User;

            // Update local state
            setEditedProfile(prev => ({
              ...prev,
              user_type: newUserType
            }));

            // Auto-update the profile in database
            if (profile) {
              try {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ user_type: newUserType })
                  .eq('id', profile.id);

                if (updateError) {
                  console.error('Error updating user type:', updateError);
                  // Revert local state if database update fails
                  setEditedProfile(prev => ({
                    ...prev,
                    user_type: value ? UserType.User : UserType.Business
                  }));
                } else {
                  console.log('User type updated successfully');
                }
              } catch (e) {
                console.error('Error updating user type:', e);
                // Revert local state if database update fails
                setEditedProfile(prev => ({
                  ...prev,
                  user_type: value ? UserType.User : UserType.Business
                }));
              }
            }
          },
        },
      ]
    },

  ];





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

      // Notify about completeness when opening edit screen
      const completeness = checkProfileCompleteness(profile);
      if (!completeness.isComplete) {
        const required = completeness.missingRequired.map((k) => String(k)).join(', ');
        toast.show({
          type: 'info',
          title: 'Complete your profile',
          message: required ? `Missing required: ${required}` : 'Add more details to improve your profile.',
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    if (!editedProfile.name?.trim() || !editedProfile.surname?.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }
    setError(null);

    try {
      // First, let's see what's actually in the database
      const { data: existingProfiles, error: queryError } = await supabase
        .from('profiles')
        .select('user_type')
        .limit(3);

      if (queryError) {
        console.log('Query error:', queryError);
      } else {
        console.log('Existing user_type values:', existingProfiles?.map(p => p.user_type));
      }

      const updateData = {
        name: editedProfile.name.trim(),
        surname: editedProfile.surname.trim(),
        username: editedProfile.username.trim(),
        bio: editedProfile.bio.trim(),
        user_type: editedProfile.user_type,
        website: editedProfile.website.trim(),
        phone: editedProfile.phone.trim(),
        location: editedProfile.location.trim(),
        profession: editedProfile.profession.trim(),
        experience_years: editedProfile.experience_years
          ? parseInt(editedProfile.experience_years)
          : null,
        education: editedProfile.education.trim(),
        skills: editedProfile.skills
          ? editedProfile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : null,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      // Profile will be updated automatically via cache refresh
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
      // Profile will be updated automatically via cache refresh
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
      <View style={{ flex: 1 }}>
        {/* Avatar */}
        <Pressable onPress={pickAvatar} style={styles.avatarPreview}>
          <ThemedAvatar
            image={
              (profile?.avatar_url as string) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                editedProfile.name || 'User'
              )}&size=80`
            }
            size={80}
          >
            <View style={[styles.avatarOverlay, { backgroundColor: tintColor }]}>
              <Feather name="camera" size={16} color={backgroundColor} />
            </View>
          </ThemedAvatar>
        </Pressable>

        <SettingsList sections={settingsData} />

        {error && <ThemedText style={{ color: '#ef4444', margin: 8 }}>{error}</ThemedText>}
      </View>
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

  avatarPreview: {
    alignSelf: 'center',
    marginVertical: 24,
  },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    borderRadius: 16, padding: 6,
  },

});
