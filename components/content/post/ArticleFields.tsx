import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import IndustrySelector from './IndustrySelector';
import { INDUSTRIES } from '@/dataset/industries';

export interface ArticleFieldsData {
  source: string;
  industry: string;
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
      <IndustrySelector
        selectedIndustry={values.industry}
        onIndustryChange={(v) => handleChange('industry', v)}
        industries={INDUSTRIES}
      />
      <ThemedInput
        placeholder="Source (e.g., website, publication)"
        value={values.source}
        onChangeText={(v) => handleChange('source', v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
});