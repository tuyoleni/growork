import { useThemeColor } from '@/hooks/useThemeColor';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

const DATA = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
    category: 'CV',
    note: '',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
    category: 'CV',
    note: '',
  },
  {
    name: 'CoverLetter_2024.pdf',
    updated: 'Updated 3 days ago',
    category: 'Cover Letter',
    note: '',
  },
  {
    name: 'Certificate_React.pdf',
    updated: 'Updated 2 months ago',
    category: 'Certificate',
    note: '',
  },
  {
    name: 'Certificate_AWS.pdf',
    updated: 'Updated 5 months ago',
    category: 'Certificate',
    note: '',
  },
];

export const CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

export function useDocumentUpload() {
  const [documents, setDocuments] = useState(DATA);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const { dismiss } = useBottomSheetModal();

  // Handler for picking a PDF file, now accepts note and setNote
  const handlePickPdf = async (note: string, setNote: (v: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setDocuments(prev => [
            {
              name: asset.name,
              updated: 'Just now',
              category: selectedCategory,
              note: note.trim(),
            },
            ...prev,
          ]);
          setNote('');
          dismiss();
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  return {
    documents,
    setDocuments,
    selectedCategory,
    setSelectedCategory,
    handlePickPdf,
    borderColor,
    backgroundColor,
    tintColor,
    textColor,
    dismiss,
    CATEGORIES,
  };
} 