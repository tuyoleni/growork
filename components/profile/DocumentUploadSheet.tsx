import { BottomSheetView } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DocumentUploadSheetProps {
  pendingDocs: any[];
  setPendingDocs: (fn: (prev: any[]) => any[]) => void;
  handleContinue: () => void;
  closeModal: () => void;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  MODAL_CATEGORIES: string[];
}

const DocumentUploadSheet: React.FC<DocumentUploadSheetProps> = ({
  pendingDocs,
  setPendingDocs,
  handleContinue,
  closeModal,
  borderColor,
  backgroundColor,
  textColor,
  MODAL_CATEGORIES,
}) => {
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
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' }}>
            Upload Your Documents
          </ThemedText>
          {MODAL_CATEGORIES.map((docType) => {
            const docsOfType = pendingDocs.filter(doc => doc.category === docType);
            return (
              <View key={docType} style={{ marginBottom: 32 }}>
                <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>{docType}</ThemedText>
                {/* Uploaded docs for this type */}
                {docsOfType.length === 0 ? (
                  <ThemedText style={{ color: borderColor, fontSize: 14, marginBottom: 8 }}>
                    No {docType} uploaded yet.
                  </ThemedText>
                ) : (
                  docsOfType.map((doc, idx) => (
                    <View key={doc.name + idx} style={{ marginBottom: 6, padding: 8, borderRadius: 6, backgroundColor: borderColor + '11' }}>
                      <ThemedText style={{ fontWeight: 'bold' }}>{doc.name}</ThemedText>
                    </View>
                  ))
                )}
                <TouchableOpacity
                  style={{ backgroundColor: textColor, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 4 }}
                  onPress={() => handlePickPdfForType(docType)}
                >
                  <ThemedText style={{ fontSize: 15, color: backgroundColor, fontWeight: 'bold' }}>Upload {docType}</ThemedText>
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity
            style={{ backgroundColor: textColor, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
            onPress={handleContinue}
            disabled={pendingDocs.length === 0}
          >
            <ThemedText style={{ fontSize: 16, color: backgroundColor, fontWeight: 'bold' }}>Continue</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </KeyboardAvoidingView>
  );
};

export default DocumentUploadSheet; 