import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface DocumentNoteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const DocumentNoteInput: React.FC<DocumentNoteInputProps> = ({ value, onChangeText, placeholder }) => {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Document Note</ThemedText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'e.g. For job applications'}
        placeholderTextColor="#888"
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
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#222',
    minHeight: 40,
  },
});

export default DocumentNoteInput; 