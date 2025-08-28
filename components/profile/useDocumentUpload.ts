import { useThemeColor , useAuth } from '@/hooks';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { STORAGE_BUCKETS } from '@/utils/uploadUtils';

export const CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { dismiss } = useBottomSheetModal();
  const { user } = useAuth();

  // Upload document to Supabase
  const uploadDocumentToSupabase = async (fileUri: string, fileName: string, documentType: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Document file does not exist');
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (fileInfo.size && fileInfo.size > maxSize) {
        throw new Error('Document file is too large (max 50MB)');
      }

      // Get file extension
      const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      const uniqueFileName = `document_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${uniqueFileName}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for React Native compatibility
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase storage using Uint8Array instead of Blob
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(filePath, byteArray, {
          contentType: `application/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Document upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const publicUrl = supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).getPublicUrl(filePath).data.publicUrl;

      // Save document record to database
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          type: documentType.toLowerCase().replace(' ', '_'),
          name: fileName,
          file_url: publicUrl,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save document: ${dbError.message}`);
      }

      return {
        id: docData.id,
        name: fileName,
        url: publicUrl,
        type: documentType,
        uploaded_at: docData.uploaded_at,
      };

    } catch (error: any) {
      console.error('Document upload error:', error);
      throw error;
    }
  };

  // Handler for picking a document file
  const handlePickDocument = async (note: string, setNote: (v: string) => void) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to upload documents');
      return;
    }

    try {
      setUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.mimeType === 'application/pdf') {
          // Upload to Supabase
          const uploadedDoc = await uploadDocumentToSupabase(
            asset.uri,
            asset.name,
            selectedCategory
          );

          // Update local state
          setDocuments(prev => [
            {
              id: uploadedDoc.id,
              name: uploadedDoc.name,
              updated: 'Just now',
              category: selectedCategory,
              note: note.trim(),
              url: uploadedDoc.url,
            },
            ...prev,
          ]);

          setNote('');
          dismiss();
          Alert.alert('Success', 'Document uploaded successfully!');
        } else {
          Alert.alert('Error', 'Please select a PDF file.');
        }
      }
    } catch (error: any) {
      console.error('Document pick error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Load user's documents from database
  const loadUserDocuments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      const formattedDocs = data.map(doc => ({
        id: doc.id,
        name: doc.name,
        updated: new Date(doc.uploaded_at).toLocaleDateString(),
        category: doc.type.replace('_', ' ').toUpperCase(),
        note: '',
        url: doc.file_url,
      }));

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  return {
    documents,
    setDocuments,
    selectedCategory,
    setSelectedCategory,
    handlePickDocument,
    loadUserDocuments,
    uploading,
    borderColor,
    backgroundColor,
    tintColor,
    textColor,
    dismiss,
    CATEGORIES,
  };
} 