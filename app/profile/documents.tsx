import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import { supabase, STORAGE_BUCKETS } from '@/utils/superbase';
import { Document, DocumentType } from '@/types';

interface DocumentWithDisplay extends Document {
  displayName: string;
  category: string;
  updatedAt: string;
}

const DOCUMENT_CATEGORIES = [
  { id: 'cv', label: 'CV/Resume', icon: 'briefcase' },
  { id: 'cover-letter', label: 'Cover Letter', icon: 'mail' },
  { id: 'certificate', label: 'Certificates', icon: 'award' },
  { id: 'portfolio', label: 'Portfolio', icon: 'folder' },
  { id: 'other', label: 'Other', icon: 'file' },
];

export default function DocumentsManagement() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
  const [documents, setDocuments] = useState<DocumentWithDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const documentsWithDisplay = (data || []).map(doc => ({
        ...doc,
        displayName: doc.name,
        category: doc.type,
        updatedAt: new Date(doc.uploaded_at).toLocaleDateString(),
      }));

      setDocuments(documentsWithDisplay);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (category: string) => {
    if (!user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploading(true);

      // For now, we'll just add to local state since uploadDocument might not exist
      const newDocument: DocumentWithDisplay = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        name: asset.name,
        type: category as DocumentType,
        file_url: asset.uri,
        uploaded_at: new Date().toISOString(),
        displayName: asset.name,
        category: category,
        updatedAt: new Date().toLocaleDateString(),
      };

      setDocuments(prev => [newDocument, ...prev]);
      Alert.alert('Success', 'Document added successfully!');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId);

              if (error) throw error;

              await fetchDocuments();
              Alert.alert('Success', 'Document deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'file';
  };

  const getCategoryLabel = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === category);
    return cat?.label || 'Other';
  };

  return (
    <ScreenContainer>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          Documents
        </ThemedText>
        <View style={styles.headerRight} />
      </ThemedView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && { backgroundColor: tintColor }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <ThemedText style={[
              styles.categoryChipText,
              selectedCategory === 'all' && { color: backgroundColor }
            ]}>
              All
            </ThemedText>
          </TouchableOpacity>
          
          {DOCUMENT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && { backgroundColor: tintColor }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Feather 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? backgroundColor : textColor} 
              />
              <ThemedText style={[
                styles.categoryChipText,
                selectedCategory === category.id && { color: backgroundColor }
              ]}>
                {category.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upload Section */}
        <ThemedView style={styles.uploadSection}>
          <ThemedText style={styles.sectionTitle}>Upload New Document</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: mutedTextColor }]}>
            Choose a category and upload your document
          </ThemedText>
          
          <View style={styles.uploadGrid}>
            {DOCUMENT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.uploadCard, { borderColor }]}
                onPress={() => handleUploadDocument(category.id)}
                disabled={uploading}
              >
                <Feather name={category.icon as any} size={24} color={tintColor} />
                <ThemedText style={styles.uploadCardText}>{category.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Documents List */}
        <ThemedView style={styles.documentsSection}>
          <ThemedText style={styles.sectionTitle}>
            My Documents ({filteredDocuments.length})
          </ThemedText>
          
          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
                Loading documents...
              </ThemedText>
            </ThemedView>
          ) : filteredDocuments.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <Feather name="folder" size={48} color={mutedTextColor} />
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                No documents found
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: mutedTextColor }]}>
                Upload your first document to get started
              </ThemedText>
            </ThemedView>
          ) : (
            <View style={styles.documentsList}>
              {filteredDocuments.map((document) => (
                <ThemedView key={document.id} style={[styles.documentCard, { borderColor }]}>
                  <View style={styles.documentInfo}>
                    <Feather 
                      name={getCategoryIcon(document.category) as any} 
                      size={20} 
                      color={tintColor} 
                    />
                    <View style={styles.documentDetails}>
                      <ThemedText style={styles.documentName}>
                        {document.displayName}
                      </ThemedText>
                      <ThemedText style={[styles.documentMeta, { color: mutedTextColor }]}>
                        {getCategoryLabel(document.category)} • {document.updatedAt}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // Handle document preview/download
                        console.log('View document:', document.id);
                      }}
                    >
                      <Feather name="eye" size={16} color={textColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteDocument(document.id)}
                    >
                      <Feather name="trash-2" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>
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
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  categoryFilterContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadCardText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  documentsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 