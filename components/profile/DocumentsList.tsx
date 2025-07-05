import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import GlobalBottomSheet from '../GlobalBottomSheet';
import { ThemedText } from '../ThemedText';
import DocumentList, { Document } from '../content/DocumentList';
import DocumentUploadSheet from './DocumentUploadSheet';
import { useDocumentUpload } from './useDocumentUpload';

const MODAL_CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

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
      'certificate': ['certificate', 'cert'],
      'portfolio': ['portfolio'],
      'other': ['other', 'misc', 'document']
    };
    
    const mappedCategories = categoryMapping[filterCategory] || [filterCategory];
    return mappedCategories.some(cat => docCategory.includes(cat));
  });
}

function DocumentsListInner({ selectedDocumentFilter = 'All' }: DocumentsListProps) {
  const {
    documents,
    setDocuments,
    borderColor,
    backgroundColor,
    textColor,
    dismiss,
  } = useDocumentUpload();
  const [modalVisible, setModalVisible] = useState(false);
  const [file, setFile] = useState<{ name: string; uri: string; mimeType: string } | null>(null);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setFile({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType });
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  const handleAddDocument = () => {
    if (!file) {
      alert('Please select a PDF file.');
      return;
    }
    setPendingDocs(prev => [
      ...prev,
      {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        category: 'CV',
        updated: 'Just now',
      },
    ]);
    setFile(null);
  };

  const handleContinue = () => {
    setDocuments((prev: any[]) => [
      ...pendingDocs,
      ...prev,
    ]);
    setPendingDocs([]);
    setFile(null);
    setModalVisible(false);
    bottomSheetRef.current?.dismiss();
    dismiss();
  };

  const openModal = () => {
    setModalVisible(true);
    setTimeout(() => {
      bottomSheetRef.current?.present();
    }, 0);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFile(null);
    setPendingDocs([]);
    bottomSheetRef.current?.dismiss();
    dismiss();
  };

  const handlePickPdfForType = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setPendingDocs(prev => [
            ...prev,
            {
              name: asset.name,
              uri: asset.uri,
              mimeType: asset.mimeType,
              category: docType,
              updated: 'Just now',
            },
          ]);
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  // Filter documents by category, then convert to Document interface
  const categoryFilteredDocuments = filterDocumentsByCategory(documents, selectedDocumentFilter);
  const documentsForList: Document[] = categoryFilteredDocuments.map(doc => ({
    name: doc.name,
    updated: doc.updated,
    category: doc.category,
    note: doc.note,
  }));

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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Documents</ThemedText>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          onPress={openModal}
        >
          <Feather name="plus" size={20} color={tintColor} />
          <ThemedText style={{ fontSize: 15, fontWeight: '600', color: tintColor }}>Add Document</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      <DocumentList
        documents={documentsForList}
        groupedByCategory={true}
        onDocumentPress={handleDocumentPress}
        onDocumentDownload={handleDocumentDownload}
        onDocumentShare={handleDocumentShare}
        onDocumentDelete={handleDocumentDelete}
        emptyText={`No ${selectedDocumentFilter.toLowerCase()} documents found`}
      />

      {/* Upload Modal */}
      <GlobalBottomSheet
        ref={bottomSheetRef}
        onDismiss={closeModal}
        snapPoints={['80%']}
      >
        <DocumentUploadSheet
          pendingDocs={pendingDocs}
          setPendingDocs={setPendingDocs}
          handleContinue={handleContinue}
          closeModal={closeModal}
          MODAL_CATEGORIES={MODAL_CATEGORIES}
        />
      </GlobalBottomSheet>
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
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
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
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  uploadText: {
    fontWeight: 'bold',
    fontSize: 12,
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