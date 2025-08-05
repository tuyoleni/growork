import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { DEADLINE_OPTIONS } from '@/dataset/deadlineOptions';
import FilterSelector from '@/components/ui/FilterSelector';

interface DeadlineSelectorProps {
  selectedDeadline: string;
  onDeadlineChange: (deadline: string) => void;
  style?: ViewStyle;
}

export default function DeadlineSelector({
  selectedDeadline,
  onDeadlineChange,
  style,
}: DeadlineSelectorProps) {
  // No need to map options anymore as FilterSelector handles this internally

  return (
    <View style={[styles.container, style]}>
      <FilterSelector
        options={DEADLINE_OPTIONS}
        selectedValue={selectedDeadline}
        onValueChange={onDeadlineChange}
        title="Application Deadline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});