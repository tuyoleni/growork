import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { ActionSheetIOS, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import GlobalBottomSheet from '../GlobalBottomSheet';
import { ThemedText } from '../ThemedText';
import DocumentCard from '../content/DocumentCard';
import DocumentList from '../content/DocumentList';
import { DocumentType } from '@/types';
import { Document } from '@/types';
import CustomOptionStrip from '../ui/CustomOptionStrip';
import { useDocumentUpload } from './useDocumentUpload';

const MODAL_CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

const DOCUMENT_FILTERS = [
  { icon: 'briefcase', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
  { icon: 'folder', label: 'Portfolio' },
  { icon: 'clipboard', label: 'Other' },
];

const ALL_DOCUMENT_OPTIONS = [
  { icon: 'briefcase', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
  { icon: 'folder', label: 'Portfolio' },
  { icon: 'clipboard', label: 'Other' },
  { icon: 'file-text', label: 'Resume' },
  { icon: 'book', label: 'Reference' },
  { icon: 'certificate', label: 'Diploma' },
  { icon: 'award', label: 'Achievement' },
  { icon: 'folder-open', label: 'Project' },
  { icon: 'file', label: 'Contract' },
  { icon: 'shield', label: 'License' },
  { icon: 'star', label: 'Award' },
  { icon: 'calendar', label: 'Schedule' },
  { icon: 'map', label: 'Blueprint' },
  { icon: 'code', label: 'Code Sample' },
  { icon: 'image', label: 'Design' },
  { icon: 'video', label: 'Presentation' },
  { icon: 'music', label: 'Audio' },
  { icon: 'database', label: 'Data' },
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
  const mutedText = useThemeColor({}, 'mutedText');
  const [selectedDocumentFilterIndex, setSelectedDocumentFilterIndex] = useState(-1);
  const [visibleDocumentFilters, setVisibleDocumentFilters] = useState(DOCUMENT_FILTERS);

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

  const handleReplaceDocument = async (docType: string, currentDoc: any) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setPendingDocs(prev => prev.map(doc => 
            doc.name === currentDoc.name && doc.category === currentDoc.category
              ? {
                  name: asset.name,
                  uri: asset.uri,
                  mimeType: asset.mimeType,
                  category: docType,
                  updated: 'Just now',
                }
              : doc
          ));
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  const handleRemoveDocument = (doc: any) => {
    setPendingDocs(prev => prev.filter(d => 
      !(d.name === doc.name && d.category === doc.category)
    ));
  };

  const handlePendingDocMenu = (docType: string, doc: any) => {
    const options = ['Cancel', 'Replace', 'Remove'];
    const actions = [
      () => {},
      () => handleReplaceDocument(docType, doc),
      () => handleRemoveDocument(doc),
    ];
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) actions[buttonIndex]();
        }
      );
    } else {
      Alert.alert(
        'Document',
        `What would you like to do with "${doc.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', onPress: () => handleReplaceDocument(docType, doc) },
          { text: 'Remove', style: 'destructive', onPress: () => handleRemoveDocument(doc) },
        ]
      );
    }
  };

  const handleDocumentFilterChange = (index: number) => {
    setSelectedDocumentFilterIndex(index);
    if (index >= 0) {
      console.log('Document filter changed to:', DOCUMENT_FILTERS[index]?.label);
    } else {
      console.log('Filter cleared');
    }
  };

  const handleMoreDocumentFilters = () => {
    console.log('Show more document filters');
  };

  const getSelectedDocumentFilterLabel = () => {
    return selectedDocumentFilterIndex >= 0 ? DOCUMENT_FILTERS[selectedDocumentFilterIndex]?.label : 'All';
  };

  const handleDocumentFiltersChange = (newFilters: any[]) => {
    setVisibleDocumentFilters(newFilters);
    // Reset selection if the currently selected filter is no longer visible
    if (selectedDocumentFilterIndex >= 0 && selectedDocumentFilterIndex >= newFilters.length) {
      setSelectedDocumentFilterIndex(-1);
    }
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
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: 'bold' }}>Documents</ThemedText>
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
      <DocumentList
        documents={documentsForList}
        groupedByCategory={true}
        onDocumentPress={handleDocumentPress}
        onDocumentDownload={handleDocumentDownload}
        onDocumentShare={handleDocumentShare}
        onDocumentDelete={handleDocumentDelete}
        emptyText={`No ${getSelectedDocumentFilterLabel().toLowerCase()} documents found`}
      />

      {/* Upload Modal */}
      <GlobalBottomSheet
        ref={bottomSheetRef}
        onDismiss={closeModal}
        snapPoints={['70%']}
        header={
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
            Upload Your Documents
          </ThemedText>
        }
        body={
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              contentContainerStyle={{ 
                padding: 24, 
                paddingBottom: 24 // Reduced padding since footer is fixed
              }}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              {MODAL_CATEGORIES.map((docType) => {
                const docsOfType = pendingDocs.filter(doc => doc.category === docType);
                return (
                  <View key={docType} style={{ marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>{docType}</ThemedText>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 }}
                        onPress={() => handlePickPdfForType(docType)}
                      >
                        <Feather name="plus" size={18} color={tintColor} style={{ marginRight: 4 }} />
                        <ThemedText style={{ fontSize: 15, color: tintColor, fontWeight: '600' }}>Add</ThemedText>
                      </TouchableOpacity>
                    </View>
                    
                    {docsOfType.length === 0 ? (
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 14, color: mutedText, fontStyle: 'italic' }}>
                          No {docType} uploaded yet.
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ gap: 0 }}>
                        {docsOfType.map((doc, index) => (
                          <React.Fragment key={`${doc.name}-${index}`}>
                            <DocumentCard
                              document={{
                                id: `temp-${index}-${Date.now()}`,
                                user_id: 'temp',
                                name: doc.name,
                                type: doc.category,
                                file_url: doc.uri,
                                uploaded_at: new Date().toISOString(),
                              }}
                              variant="compact"
                              showCategory={false}
                              onPress={() => console.log('Document pressed:', doc.name)}
                              showMenu={true}
                              onPressMenu={() => handlePendingDocMenu(docType, doc)}
                            />
                            {index < docsOfType.length - 1 && (
                              <View style={{ height: 1, backgroundColor: borderColor, opacity: 0.18, marginLeft: 52 }} />
                            )}
                          </React.Fragment>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </KeyboardAvoidingView>
        }
        footer={
          <TouchableOpacity
            style={{ 
              backgroundColor: textColor, 
              borderRadius: 8, 
              paddingVertical: 16, 
              alignItems: 'center',
              opacity: pendingDocs.length === 0 ? 0.5 : 1,
            }}
            onPress={handleContinue}
            disabled={pendingDocs.length === 0}
          >
            <ThemedText style={{ fontSize: 16, color: backgroundColor, fontWeight: 'bold' }}>
              Upload ({pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''})
            </ThemedText>
          </TouchableOpacity>
        }
      />
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