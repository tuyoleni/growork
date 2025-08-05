import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';

export interface ArticleFieldsData {
  source: string;
  summary: string;
  tags: string;
}

interface ArticleFieldsProps {
  values: ArticleFieldsData;
  onChange: (values: ArticleFieldsData) => void;
  style?: ViewStyle;
}

export default function ArticleFields({ values, onChange, style }: ArticleFieldsProps) {


  const handleChange = (field: keyof ArticleFieldsData, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <View style={[styles.container, style]}>
      <ThemedInput
        placeholder="Source (optional)"
        value={values.source}
        onChangeText={(v) => handleChange('source', v)}
      />
      <ThemedInput
        placeholder="Summary (optional)"
        value={values.summary}
        onChangeText={(v) => handleChange('summary', v)}
      />
      <ThemedInput
        placeholder="Tags (comma separated, optional)"
        value={values.tags}
        onChangeText={(v) => handleChange('tags', v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});