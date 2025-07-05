import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import DocumentListSection from './DocumentListSection';

interface DocumentUploadSheetProps {
  pendingDocs: any[];
  setPendingDocs: (fn: (prev: any[]) => any[]) => void;
  handleContinue: () => void;
  closeModal: () => void;
  MODAL_CATEGORIES: string[];
}

const DocumentUploadSheet: React.FC<DocumentUploadSheetProps> = ({
  pendingDocs,
  setPendingDocs,
  handleContinue,
  closeModal,
  MODAL_CATEGORIES,
}) => {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <BottomSheetView style={{ flex: 1, padding: 0 }}>
        <View style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={{ 
              padding: 24, 
              paddingBottom: 120 // Extra padding to account for fixed button
            }}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' }}>
              Upload Your Documents
            </ThemedText>
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
                  <DocumentListSection
                    documents={docsOfType}
                    emptyText={`No ${docType} uploaded yet.`}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={{ 
            position: 'absolute', 
            left: 0, 
            right: 0, 
            bottom: 0, 
            padding: 24, 
            backgroundColor: backgroundColor, 
            borderTopWidth: 1, 
            borderTopColor: borderColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          }}>
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
          </View>
        </View>
      </BottomSheetView>
    </KeyboardAvoidingView>
  );
};

export default DocumentUploadSheet; 