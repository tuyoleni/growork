import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import DocumentList from '../content/DocumentList';
import { DocumentType, Document } from '@/types';
import CustomOptionStrip from '../ui/CustomOptionStrip';
import { useDocumentUpload } from './useDocumentUpload';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';


const DOCUMENT_FILTERS = [
  { icon: 'briefcase', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
];

const ALL_DOCUMENT_OPTIONS = [
  { icon: 'briefcase', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
];

interface DocumentsListProps {
  selectedDocumentFilter?: string;
}

function filterDocumentsByCategory(documents: any[], categoryFilter: string) {
  if (!categoryFilter || categoryFilter === 'All') return documents;

  return documents.filter(doc => {
    const docCategory = doc.category?.toLowerCase() || '';
    const filterCategory = categoryFilter.toLowerCase();

    // Map filter labels to document categories
    const categoryMapping: Record<string, string[]> = {
      'cv': ['cv', 'resume'],
      'cover letter': ['cover letter', 'coverletter'],
      'certificate': ['certificate', 'cert', 'diploma', 'achievement']
    };

    const mappedCategories = categoryMapping[filterCategory] || [filterCategory];
    return mappedCategories.some(cat => docCategory.includes(cat));
  });
}

function DocumentsListInner({ selectedDocumentFilter = 'All' }: DocumentsListProps) {
  const {
    documents,
    textColor,
  } = useDocumentUpload();
  const [, setModalVisible] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({}, 'mutedText');
  const [selectedDocumentFilterIndex, setSelectedDocumentFilterIndex] = useState(-1);
  const [visibleDocumentFilters] = useState(DOCUMENT_FILTERS);
  const { openDocumentsSheet } = useBottomSheetManager();




  const openModal = () => {
    setModalVisible(true);
    // Use the centralized bottom sheet manager instead of direct ref manipulation
    openDocumentsSheet();
  };






  const handleDocumentFilterChange = (index: number) => {
    setSelectedDocumentFilterIndex(index);
    if (index >= 0) {
      console.log('Document filter changed to:', DOCUMENT_FILTERS[index]?.label);
    } else {
      console.log('Filter cleared');
    }
  };


  const getSelectedDocumentFilterLabel = () => {
    return selectedDocumentFilterIndex >= 0 ? DOCUMENT_FILTERS[selectedDocumentFilterIndex]?.label : 'All';
  };


  // Filter documents by category
  const categoryFilteredDocuments = filterDocumentsByCategory(documents, getSelectedDocumentFilterLabel());

  // Create properly typed document objects that are compatible with DocumentList component
  const documentsForList = categoryFilteredDocuments.map(doc => {
    // Create a valid Document object with required fields
    const document: Document = {
      id: doc.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
      user_id: doc.user_id || 'unknown',
      type: doc.category as DocumentType || DocumentType.Other,
      name: doc.name,
      file_url: doc.uri || '',
      uploaded_at: new Date().toISOString()
    };

    // Add display properties used by DocumentList
    return {
      ...document,
      updated: doc.updated || 'Recently',
      category: doc.category,
      note: doc.note
    };
  });

  const handleDocumentPress = (document: Document) => {
    console.log('Document pressed:', document.name);
    // Handle document press - could open preview, etc.
  };

  const handleDocumentDownload = (document: Document) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Download document:', document.name);
  };

  const handleDocumentShare = (document: Document) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Share document:', document.name);
  };

  const handleDocumentDelete = (document: Document) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Delete document:', document.name);
  };

  return (
    <>
      {/* Document Heading */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>Documents</ThemedText>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            openModal();
          }}
        >
          <ThemedText style={[styles.uploadText, { color: tintColor }]}>
            Upload
          </ThemedText>
        </Pressable>
      </View>

      {/* Document Filter */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 }}>
        <CustomOptionStrip
          visibleOptions={visibleDocumentFilters}
          selectedIndex={selectedDocumentFilterIndex}
          onChange={handleDocumentFilterChange}
          allOptions={ALL_DOCUMENT_OPTIONS}
          minVisibleOptions={2}
          maxVisibleOptions={6}
        />
      </View>

      {/* Documents List */}
      {documentsForList.length === 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.emptyState,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            openModal();
          }}
        >
          <Feather name="folder" size={48} color={mutedText} />
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
            No Documents Yet
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: mutedText }]}>
            Tap to upload your CV, cover letter, and certificates
          </ThemedText>
        </Pressable>
      ) : (
        <DocumentList
          documents={documentsForList}
          groupedByCategory={true}
          onDocumentPress={handleDocumentPress}
          onDocumentDownload={handleDocumentDownload}
          onDocumentShare={handleDocumentShare}
          onDocumentDelete={handleDocumentDelete}
          emptyText={`No ${getSelectedDocumentFilterLabel().toLowerCase()} documents found`}
        />
      )}

      {/* We're now using the centralized BottomSheetManager via openDocumentsSheet */}
    </>
  );
}

export default function DocumentsList(props: DocumentsListProps) {
  return <DocumentsListInner {...props} />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 15,
    marginRight: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  uploadText: {
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  cardTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  statLabel: {
    fontSize: 12,
  },
});