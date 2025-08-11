import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  POSTS: 'posts',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
} as const;

export const FILE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  AVATAR: 5 * 1024 * 1024, // 5MB
};

const validateFile = async (uri: string, type: 'IMAGE' | 'DOCUMENT' | 'AVATAR') => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const sizeLimit = FILE_LIMITS[type];
    if (fileInfo.size && fileInfo.size > sizeLimit) {
      throw new Error(`File size exceeds ${sizeLimit / (1024 * 1024)}MB limit`);
    }

    // Get file extension
    const fileExt = uri.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      throw new Error('Invalid file extension');
    }

    return { fileInfo, fileExt };
  } catch (error) {
    console.error('File validation error:', error);
    throw error;
  }
};

// Enhanced image upload function
export const uploadImage = async ({
  bucket = STORAGE_BUCKETS.POSTS,
  userId,
  uri,
  fileNamePrefix = 'image',
  onProgress
}: {
  bucket: string,
  userId: string,
  uri: string,
  fileNamePrefix?: string,
  onProgress?: (progress: number) => void
}) => {
  try {
    // Validate file
    const { fileExt } = await validateFile(uri, 'IMAGE');

    // Generate unique filename
    const fileName = `${fileNamePrefix}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Read file as base64 for React Native
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // For React Native, we'll use the base64 string directly
    // Convert base64 to Uint8Array for React Native compatibility
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase using Uint8Array instead of Blob
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, byteArray, {
        contentType: `image/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Return public URL
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Document upload function
export const uploadDocument = async ({
  bucket = STORAGE_BUCKETS.DOCUMENTS,
  userId,
  uri,
  fileNamePrefix = 'document',
  documentType = 'other',
  onProgress
}: {
  bucket: string,
  userId: string,
  uri: string,
  fileNamePrefix?: string,
  documentType?: string,
  onProgress?: (progress: number) => void
}) => {
  try {
    // Validate file
    const { fileInfo, fileExt } = await validateFile(uri, 'DOCUMENT');

    // Generate unique filename
    const fileName = `${fileNamePrefix}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for React Native compatibility
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase using Uint8Array instead of Blob
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, byteArray, {
        contentType: `application/${fileExt}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Document upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Return upload result
    const result = {
      url: supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl,
      path: filePath,
      size: fileInfo.size,
      type: documentType,
      name: fileName
    };

    console.log('Document uploaded successfully:', result);
    return result;

  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

// Delete file from storage
export const deleteFile = async (bucket: string, filePath: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete file error:', error);
      throw error;
    }

    console.log('File deleted successfully:', filePath);
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}; 