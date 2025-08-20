import { useAuth } from '@/hooks';
import { useThemeColor } from '@/hooks';
import { DocumentType, Document } from '@/types';
import { supabase } from '@/utils/supabase';
import { STORAGE_BUCKETS } from '@/utils/uploadUtils';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import BadgeSelector, { BadgeOption } from '../ui/BadgeSelector';
import DocumentCard from './DocumentCard';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

type DocumentManagerProps = {
  userId?: string;
  documentType?: DocumentType;
  onSuccess?: () => void;
  selectable?: boolean;
  onSelect?: (document: Document) => void;
  disableScrolling?: boolean;
};

const DOCUMENT_TYPE_OPTIONS: BadgeOption[] = [
  { label: 'CV/Resume', value: DocumentType.CV },
  { label: 'Cover Letter', value: DocumentType.CoverLetter },
  { label: 'Certificate', value: DocumentType.Certificate },
  { label: 'Other', value: DocumentType.Other },
];

export default function DocumentManager({
  userId,
  documentType,
  onSuccess,
  selectable = false,
  onSelect,
  disableScrolling = false,
}: DocumentManagerProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(documentType || DocumentType.CV);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  // Fetch documents function
  const fetchDocuments = useCallback(async () => {
    if (!userId || !documentType) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('type', documentType)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, documentType]);

  // Fetch documents when component mounts or documentType changes
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentSelect = (document: Document) => {
    if (selectable && onSelect) {
      onSelect(document);
    }
  };

  const handleUploadDocument = async () => {
    if (!user) return;

    try {
      setUploading(true);

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const file = result.assets[0];

      // Validate file exists
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        throw new Error('Document file does not exist');
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (fileInfo.size && fileInfo.size > maxSize) {
        throw new Error('Document file is too large (max 50MB)');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const uniqueFileName = `document_${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${uniqueFileName}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for React Native compatibility
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(filePath, byteArray, {
          contentType: `application/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const publicUrl = supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .getPublicUrl(filePath).data.publicUrl;

      // Add document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          type: selectedDocumentType,
          name: file.name,
          file_url: publicUrl,
        });

      if (dbError) {
        throw dbError;
      }

      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Document uploaded successfully!');
      
      // Refresh the documents list
      await fetchDocuments();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload document');
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {selectable ? (
        // Selection mode
        <>
          <View style={styles.header}>
            <ThemedText style={styles.title} type="defaultSemiBold">
              Select Document
            </ThemedText>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={textColor} />
              <ThemedText style={[styles.loadingText, { color: textColor }]}>
                Loading documents...
              </ThemedText>
            </View>
          ) : documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: textColor }]}>
                No documents found
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: textColor }]}>
                Upload a document to continue
              </ThemedText>
              <Pressable
                style={[styles.uploadButton, { borderColor }, uploading && styles.uploadButtonDisabled]}
                onPress={handleUploadDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <>
                    <Feather name="upload" size={20} color={textColor} />
                    <ThemedText style={styles.uploadButtonText}>Upload Document</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={styles.documentsList}
              showsVerticalScrollIndicator={!disableScrolling}
              scrollEnabled={!disableScrolling}
            >
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onPress={() => handleDocumentSelect(document)}
                  showMenu={false}
                  selectable={true}
                />
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        // Upload mode
        <>
          <View style={styles.header}>
            <ThemedText style={styles.title} type="defaultSemiBold">
              Upload Document
            </ThemedText>
          </View>

          {/* Document Type Selector */}
          {!documentType && (
            <View style={styles.selectorContainer}>
              <BadgeSelector
                options={DOCUMENT_TYPE_OPTIONS}
                selectedValue={selectedDocumentType}
                onValueChange={(value) => setSelectedDocumentType(value as DocumentType)}
                title="Select Document Type"
              />
            </View>
          )}

          {/* Upload Button */}
          <View style={styles.uploadContainer}>
            <Pressable
              style={[styles.uploadButton, { borderColor }, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <>
                  <Feather name="upload" size={20} color={textColor} />
                  <ThemedText style={styles.uploadButtonText}>Choose Document</ThemedText>
                </>
              )}
            </Pressable>
            {uploading && (
              <ThemedText style={[styles.uploadingText, { color: textColor }]}>
                Uploading document...
              </ThemedText>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  selectorContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  uploadContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    minWidth: 200,
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  uploadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  documentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
});