import { useDocuments } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Document, DocumentType } from '@/types';
import { supabase, STORAGE_BUCKETS } from '@/utils/superbase';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import DocumentCard from './DocumentCard';
import * as Haptics from 'expo-haptics';

type DocumentManagerProps = {
  userId?: string;
  documentType?: DocumentType;
  selectable?: boolean;
  onSelect?: (document: Document) => void;
  disableScrolling?: boolean; // Add this prop to disable FlatList when inside a ScrollView
};

export default function DocumentManager({
  userId,
  documentType,
  selectable = false,
  onSelect,
  disableScrolling = false,
}: DocumentManagerProps) {
  const { user } = useAuth();
  const { documents, loading, error, fetchDocuments, addDocument, deleteDocument } = useDocuments(userId || user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    if (user?.id || userId) {
      fetchDocuments(documentType);
    }
  }, [fetchDocuments, user?.id, userId, documentType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments(documentType);
    setRefreshing(false);
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
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${user.id}_${new Date().getTime()}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      // Upload to Supabase Storage
      // Fetch the file and convert to blob
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/octet-stream',
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL using the shared function
      const publicUrl = supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .getPublicUrl(filePath).data.publicUrl;
      
      // Prompt for document type
      const docType = documentType || DocumentType.CV; 
      
      // Add document record
      await addDocument({
        user_id: user.id,
        type: docType,
        name: file.name,
        file_url: publicUrl,
      });
      
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Error', error.message);
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      Alert.alert(
        'Delete Document',
        'Are you sure you want to delete this document?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              await deleteDocument(documentId);
              if (process.env.EXPO_OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting document:', error);
      Alert.alert('Delete Error', error.message);
    }
  };

  const handleSelectDocument = (document: Document) => {
    if (selectable && onSelect) {
      onSelect(document);
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const renderDocument = ({ item }: { item: Document }) => {
    return (
      <DocumentCard
        document={item}
        onPress={() => handleSelectDocument(item)}
        onDelete={() => handleDeleteDocument(item.id)}
        selectable={selectable}
      />
    );
  };

  if (loading && !refreshing && !uploading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor }]}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title} type="defaultSemiBold">
          {documentType ? `${documentType.replace('_', ' ')}s` : 'Documents'}
        </ThemedText>
        <Pressable
          style={[styles.uploadButton, { borderColor }]}
          onPress={handleUploadDocument}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <>
              <Feather name="upload" size={16} color={textColor} />
              <ThemedText style={styles.uploadButtonText}>Upload</ThemedText>
            </>
          )}
        </Pressable>
      </View>
      
      {disableScrolling ? (
        <View style={styles.listContent}>
          {documents.length > 0 ? (
            documents.map(item => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                {renderDocument({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText>No documents found</ThemedText>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={textColor}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText>No documents found</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});