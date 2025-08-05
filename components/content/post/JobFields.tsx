import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import JobTypeSelector from './JobTypeSelector';
import DeadlineSelector from './DeadlineSelector';
import SalarySelector from './SalarySelector';
import IndustrySelector from './IndustrySelector';
import { INDUSTRIES } from '@/dataset/industries';

export interface JobFieldsData {
  location: string;
  salary: string;
  jobType: string;
  industry: string;
  requirements: string;
  benefits: string;
  deadline: string;
}

interface JobFieldsProps {
  values: JobFieldsData;
  onChange: (values: JobFieldsData) => void;
  style?: ViewStyle;
}

export default function JobFields({ values, onChange, style }: JobFieldsProps) {


  const handleChange = (field: keyof JobFieldsData, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <View style={[styles.container, style]}>
      <SalarySelector
        selectedSalary={values.salary}
        onSalaryChange={(v) => handleChange('salary', v)}
      />
      <JobTypeSelector
        selectedJobType={values.jobType}
        onJobTypeChange={(v: string) => handleChange('jobType', v)}
      />
      <IndustrySelector
        selectedIndustry={values.industry}
        onIndustryChange={(v) => handleChange('industry', v)} industries={INDUSTRIES}      />
      <ThemedInput
        placeholder="Requirements (comma separated)"
        value={values.requirements}
        onChangeText={(v) => handleChange('requirements', v)}
      />
      <ThemedInput
        placeholder="Benefits (comma separated)"
        value={values.benefits}
        onChangeText={(v) => handleChange('benefits', v)}
      />
      <DeadlineSelector
        selectedDeadline={values.deadline}
        onDeadlineChange={(v) => handleChange('deadline', v)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});