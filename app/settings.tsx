import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import SettingsList from '@/components/ui/SettingsList';

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
  iconColor?: string;
}

interface SettingsSection {
  title: string;
  data: SettingsItemProps[];
}

export default function Settings() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Not implemented', 'Account deletion will be implemented soon.');
          }
        }
      ]
    );
  };

  const settingsData: SettingsSection[] = [
    {
      title: 'Account',
      data: [
        {
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: 'user',
          onPress: () => router.push('/profile/edit-profile'),
        },
        {
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: 'lock',
          onPress: () => Alert.alert('Not implemented', 'Password change will be implemented soon.'),
        },
        {
          title: 'Privacy',
          subtitle: 'Manage your privacy settings',
          icon: 'shield',
          onPress: () => Alert.alert('Not implemented', 'Privacy settings will be implemented soon.'),
        },
      ]
    },
    {
      title: 'Documents & Media',
      data: [
        {
          title: 'Manage Documents',
          subtitle: 'CV, certificates, portfolio',
          icon: 'folder',
          onPress: () => router.push('/profile/documents'),
        },
        {
          title: 'Companies',
          subtitle: 'Manage followed companies',
          icon: 'briefcase',
          onPress: () => router.push('/profile/companies'),
        },
        {
          title: 'Media Outlets',
          subtitle: 'Podcasts, news, voice content',
          icon: 'radio',
          onPress: () => router.push('/profile/media'),
        },
      ]
    },
    {
      title: 'Preferences',
      data: [
        {
          title: 'Notifications',
          subtitle: 'Manage notification preferences',
          icon: 'bell',
          onPress: () => Alert.alert('Not implemented', 'Notification settings will be implemented soon.'),
        },
        {
          title: 'Dark Mode',
          subtitle: 'Toggle dark mode',
          icon: 'moon',
          showSwitch: true,
          switchValue: colorScheme === 'dark',
          onSwitchChange: () => Alert.alert('Not implemented', 'Dark mode toggle will be implemented soon.'),
        },
        {
          title: 'Language',
          subtitle: 'English',
          icon: 'globe',
          onPress: () => Alert.alert('Not implemented', 'Language settings will be implemented soon.'),
        },
      ]
    },
    {
      title: 'Support',
      data: [
        {
          title: 'Help Center',
          subtitle: 'Get help and support',
          icon: 'help-circle',
          onPress: () => Alert.alert('Not implemented', 'Help center will be implemented soon.'),
        },
        {
          title: 'Contact Us',
          subtitle: 'Reach out to our team',
          icon: 'mail',
          onPress: () => Alert.alert('Not implemented', 'Contact form will be implemented soon.'),
        },
        {
          title: 'About',
          subtitle: 'App version and information',
          icon: 'info',
          onPress: () => Alert.alert('About', 'Growork v1.0.0\n\nA modern job search and networking platform.'),
        },
      ]
    },
    {
      title: 'Danger Zone',
      data: [
        {
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: 'log-out',
          onPress: handleSignOut,
          destructive: true,
        },
        {
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          icon: 'trash-2',
          onPress: handleDeleteAccount,
          destructive: true,
        },
      ]
    }
  ];

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
          Settings
        </ThemedText>
        <View style={styles.headerSpacer} />
      </ThemedView>

      <SettingsList sections={settingsData} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
});