import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DocumentNoteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const DocumentNoteInput: React.FC<DocumentNoteInputProps> = ({ value, onChangeText, placeholder }) => {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  const textColor = useThemeColor({}, 'text');
  const placeholderTextColor = useThemeColor({}, 'mutedText');
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Document Note</ThemedText>
      <TextInput
        style={[styles.input, { borderColor, backgroundColor, color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'e.g. For job applications'}
        placeholderTextColor={placeholderTextColor}
        multiline
        numberOfLines={2}
        maxLength={120}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 40,
  },
});

export default DocumentNoteInput; 