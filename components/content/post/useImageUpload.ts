import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase, uploadImage as supabaseUploadImage, STORAGE_BUCKETS } from '@/utils/superbase';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (imageFile: any, userId: string) => {
    if (!imageFile || !userId) return null;
    
    try {
      setUploading(true);
      
      // Use the shared uploadImage function from superbase.ts
      return await supabaseUploadImage({
        bucket: STORAGE_BUCKETS.POSTS,
        userId,
        uri: imageFile.uri,
        fileNamePrefix: 'post'
      });
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Error', 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploading
  };
}