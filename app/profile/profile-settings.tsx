import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/superbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function ProfileSettings() {
  const { user, profile, refresh, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await uploadImage(asset.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      await refresh();
      Alert.alert('Success', 'Profile picture updated!');
    } catch (e: any) {
      setError(e.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // First, sign out from Supabase
      await signOut();
      
      // Clear all Supabase-related keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter((key) => 
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.startsWith('supabase.')
      );
      
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
      }
      
      // Force clear any remaining session data
      await supabase.auth.signOut();
      
      // Navigate to login screen
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, try to navigate to login
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Settings</Text>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={{ color: '#888' }}>No Photo</Text></View>
      )}
      {uploading ? <ActivityIndicator size="large" color="#2563eb" /> : (
        <Button title="Change Profile Picture" onPress={pickImage} />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ marginTop: 24 }}>
        <Button
          title="Sign Out"
          color="#e53935"
          onPress={handleSignOut}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: 'red',
    marginTop: 16,
  },
}); 