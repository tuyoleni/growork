import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Post, PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedInput } from '../ThemedInput';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { supabase } from '@/utils/superbase';
import * as Haptics from 'expo-haptics';

type JobPostFormProps = {
  existingPost?: Post;
  onSuccess?: (post: Post) => void;
  onCancel?: () => void;
};

export default function JobPostForm({
  existingPost,
  onSuccess,
  onCancel,
}: JobPostFormProps) {
  const { user } = useAuth();
  const { addPost } = usePosts();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(existingPost?.title || '');
  const [content, setContent] = useState(existingPost?.content || '');
  const [imageUrl, setImageUrl] = useState(existingPost?.image_url || null);
  const [criteria, setCriteria] = useState<any>(existingPost?.criteria || {
    location: '',
    experience: '',
    jobType: 'Full-time',
    salary: '',
  });
  
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
      const filePath = `job_posts/${user.id}_${new Date().getTime()}.${fileExt}`;
      
      setLoading(true);
      
      const fileData = new FormData();
      fileData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);
      
      const { error: uploadError } = await supabase.storage
        .from('job_posts')
        .upload(filePath, fileData, {
          contentType: `image/${fileExt}`,
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job_posts')
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
      Alert.alert('Error', 'Please enter a job title');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter job details');
      return;
    }
    
    try {
      setLoading(true);
      
      const postData: Partial<Post> = {
        user_id: user.id,
        type: PostType.Job,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        criteria: criteria,
        is_sponsored: false,
      };
      
      if (existingPost) {
        // Update existing post
        const { data, error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', existingPost.id)
          .select();
        
        if (error) {
          throw error;
        }
        
        if (process.env.EXPO_OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (onSuccess && data?.[0]) {
          onSuccess(data[0] as Post);
        }
      } else {
        // Create new post
        const { data, error } = await addPost(postData);
        
        if (error) {
          throw error;
        }
        
        if (process.env.EXPO_OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (onSuccess && data?.[0]) {
          onSuccess(data[0] as Post);
        }
      }
    } catch (error: any) {
      console.error('Error saving job post:', error);
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
        {existingPost ? 'Edit Job Posting' : 'Create Job Posting'}
      </ThemedText>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Job Title</ThemedText>
        <ThemedInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter job title"
          style={styles.input}
        />
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Job Description</ThemedText>
        <ThemedInput
          value={content}
          onChangeText={setContent}
          placeholder="Enter job description"
          multiline
          numberOfLines={6}
          style={styles.textArea}
        />
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Job Details</ThemedText>
        
        <ThemedView style={styles.criteriaSection}>
          <ThemedText style={styles.criteriaLabel}>Location</ThemedText>
          <ThemedInput
            value={criteria.location}
            onChangeText={(text) => setCriteria({ ...criteria, location: text })}
            placeholder="e.g., Remote, New York, etc."
            style={styles.input}
          />
        </ThemedView>
        
        <ThemedView style={styles.criteriaSection}>
          <ThemedText style={styles.criteriaLabel}>Experience Required</ThemedText>
          <ThemedInput
            value={criteria.experience}
            onChangeText={(text) => setCriteria({ ...criteria, experience: text })}
            placeholder="e.g., 2+ years, Entry level, etc."
            style={styles.input}
          />
        </ThemedView>
        
        <ThemedView style={styles.criteriaSection}>
          <ThemedText style={styles.criteriaLabel}>Job Type</ThemedText>
          <ThemedInput
            value={criteria.jobType}
            onChangeText={(text) => setCriteria({ ...criteria, jobType: text })}
            placeholder="e.g., Full-time, Part-time, Contract"
            style={styles.input}
          />
        </ThemedView>
        
        <ThemedView style={styles.criteriaSection}>
          <ThemedText style={styles.criteriaLabel}>Salary Range</ThemedText>
          <ThemedInput
            value={criteria.salary}
            onChangeText={(text) => setCriteria({ ...criteria, salary: text })}
            placeholder="e.g., $60K-$80K, Competitive, etc."
            style={styles.input}
          />
        </ThemedView>
      </ThemedView>
      
      <ThemedView style={styles.formSection}>
        <ThemedText style={styles.label}>Featured Image</ThemedText>
        
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
              {existingPost ? 'Update Job' : 'Post Job'}
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
  criteriaSection: {
    marginBottom: 12,
  },
  criteriaLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
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