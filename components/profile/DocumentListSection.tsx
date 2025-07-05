import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DocumentListSectionProps {
  documents: Array<{ name: string }>;
  emptyText: string;
}

const DocumentListSection: React.FC<DocumentListSectionProps> = ({
  documents,
  emptyText,
}) => {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

  if (!documents || documents.length === 0) {
    return (
      <ThemedText style={{ color: borderColor, fontSize: 14, marginBottom: 8 }}>{emptyText}</ThemedText>
    );
  }
  return (
    <>
      {documents.map((doc, idx) => (
        <View
          key={doc.name + idx}
          style={{ marginBottom: 6, padding: 8, borderRadius: 6, backgroundColor: backgroundSecondary }}
        >
          <ThemedText style={{ fontWeight: 'bold', color: textColor }}>{doc.name}</ThemedText>
        </View>
      ))}
    </>
  );
};

export default DocumentListSection; 