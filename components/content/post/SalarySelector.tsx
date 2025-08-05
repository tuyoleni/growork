import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SALARY_RANGES } from '@/dataset/salaryRanges';
import FilterSelector from '@/components/ui/FilterSelector';

interface SalarySelectorProps {
  selectedSalary: string;
  onSalaryChange: (salary: string) => void;
  style?: ViewStyle;
}

export default function SalarySelector({
  selectedSalary,
  onSalaryChange,
  style,
}: SalarySelectorProps) {
  // No need to map options anymore as FilterSelector handles this internally

  return (
    <View style={[styles.container, style]}>
      <FilterSelector
        options={SALARY_RANGES}
        selectedValue={selectedSalary}
        onValueChange={onSalaryChange}
        title="Salary Range"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});