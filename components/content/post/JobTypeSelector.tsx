import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import FilterSelector from '@/components/ui/FilterSelector';
import { JOB_TYPES } from '@/dataset/postTypes';

interface JobTypeSelectorProps {
  selectedJobType: string;
  onJobTypeChange: (jobType: string) => void;
  style?: ViewStyle;
}

export default function JobTypeSelector({
  selectedJobType,
  onJobTypeChange,
  style,
}: JobTypeSelectorProps) {
  const jobTypeOptions = JOB_TYPES.map(type => type.value);

  return (
    <View style={[styles.container, style]}>
      <FilterSelector
        options={jobTypeOptions}
        selectedValue={selectedJobType}
        onValueChange={onJobTypeChange}
        title="Job Type"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});