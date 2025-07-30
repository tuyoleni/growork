import { useAds } from '@/hooks/useAds';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ad, AdStatus, Post, PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedInput } from '../ThemedInput';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { supabase } from '@/utils/superbase';
import * as Haptics from 'expo-haptics';

type SponsoredPostFormProps = {
  existingAd?: Ad;
  onSuccess?: (ad: Ad) => void;
  onCancel?: () => void;
};

export default function SponsoredPostForm({
  existingAd,
  onSuccess,
  onCancel,
}: SponsoredPostFormProps) {
  const { user } = useAuth();
  const { addPost } = usePosts();
  const { addAd } = useAds();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('7'); // Default 7 days
  const [priority, setPriority] = useState('1'); // Default priority 1
  
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const handleUploadImage = async () => {
    if (!user) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (result.canceled) {
        return;
      }
      
      const uri = result.assets[0].uri;
      const fileName = uri.split('/').pop() || '';
      const fileExt = fileName.split('.').pop() || '';
      const filePath = `sponsored_posts/${user.id}_${new Date().getTime()}.${fileExt}`;
      
      setLoading(true);
      
      // Upload to Supabase Storage
      // Create a proper FormData or Blob object for upload
      const fileData = new FormData();
      fileData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);
      
      const { error: uploadError } = await supabase.storage
        .from('sponsored_posts')
        .upload(filePath, fileData, {
          contentType: `image/${fileExt}`,
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sponsored_posts')
        .getPublicUrl(filePath);
      
      setImageUrl(publicUrl);
      
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your sponsored post');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content for your sponsored post');
      return;
    }
    
    if (!imageUrl) {
      Alert.alert('Error', 'Please upload an image for your sponsored post');
      return;
    }
    
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create post first
      const newPostData: Partial<Post> = {
        user_id: user.id,
        type: PostType.Ad,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        is_sponsored: true,
      };
      
      const { data: postResult, error: postError } = await addPost(newPostData);
      
      if (postError) {
        throw postError;
      }
      
      if (!postResult) {
        throw new Error('Failed to create post');
      }
      
      // Safely access the created post
      const post = (Array.isArray(postResult) && postResult[0]) 
        ? postResult[0] as unknown as Post
        : postResult as unknown as Post;
      
      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));
      
      // Create ad
      const newAdData: Partial<Ad> = {
        user_id: user.id,
        post_id: post.id,
        budget: Number(budget),
        spent: 0,
        priority: parseInt(priority),
        status: AdStatus.Active,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };
      
      const { data: adResult, error: adError } = await addAd(newAdData);
      
      if (adError) {
        // If ad creation fails, we should delete the post
        await supabase.from('posts').delete().eq('id', post.id);
        throw adError;
      }
      
      if (!adResult) {
        // If ad creation returns no data, we should delete the post
        await supabase.from('posts').delete().eq('id', post.id);
        throw new Error('Failed to create ad');
      }
      
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (onSuccess) {
        // Safely access the created ad
        const ad = (Array.isArray(adResult) && adResult[0]) 
          ? adResult[0] as unknown as Ad 
          : adResult as unknown as Ad;
        
        onSuccess(ad);
      }
    } catch (error: any) {
      console.error('Error creating sponsored post:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedText style={styles.title} type="defaultSemiBold">
        Create Sponsored Post
      </ThemedText>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Ad Title</ThemedText>
        <ThemedInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a catchy title"
          style={styles.input}
        />
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Ad Content</ThemedText>
        <ThemedInput
          value={content}
          onChangeText={setContent}
          placeholder="Describe what you're promoting"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Ad Image</ThemedText>
        
        {imageUrl ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            <Pressable
              style={[styles.changeImageButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={handleUploadImage}
              disabled={loading}
            >
              <Feather name="camera" size={18} color="#fff" />
              <ThemedText style={styles.changeImageText}>Change</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.uploadButton, { borderColor }]}
            onPress={handleUploadImage}
            disabled={loading}
          >
            <Feather name="upload" size={18} color={textColor} />
            <ThemedText style={styles.uploadButtonText}>Upload Image</ThemedText>
          </Pressable>
        )}
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Ad Budget</ThemedText>
        <ThemedInput
          value={budget}
          onChangeText={setBudget}
          placeholder="Enter amount in USD"
          keyboardType="numeric"
          style={styles.input}
        />
        <ThemedText style={styles.helperText}>
          This is the maximum amount you want to spend on this ad.
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Duration (Days)</ThemedText>
        <ThemedInput
          value={duration}
          onChangeText={setDuration}
          placeholder="Number of days"
          keyboardType="numeric"
          style={styles.input}
        />
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Priority Level (1-5)</ThemedText>
        <ThemedInput
          value={priority}
          onChangeText={(text) => {
            const num = parseInt(text);
            if (!isNaN(num) && num >= 1 && num <= 5) {
              setPriority(text);
            } else if (text === '') {
              setPriority('');
            }
          }}
          placeholder="1 (low) to 5 (high)"
          keyboardType="numeric"
          style={styles.input}
        />
        <ThemedText style={styles.helperText}>
          Higher priority ads are shown more frequently (costs more per impression).
        </ThemedText>
      </ThemedView>
      
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.cancelButton, { borderColor }]}
          onPress={onCancel}
          disabled={loading}
        >
          <ThemedText>Cancel</ThemedText>
        </Pressable>
        
        <Pressable
          style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              Create Sponsored Post
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  formSection: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    width: '100%',
  },
  textArea: {
    width: '100%',
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  changeImageText: {
    fontSize: 14,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});