import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedInput } from '@/components/ThemedInput';
import JobTypeSelector from './JobTypeSelector';
import DeadlineSelector from './DeadlineSelector';
import SalarySelector from './SalarySelector';
import LocationSelector from './LocationSelector';
import IndustrySelector from './IndustrySelector';

export interface JobFieldsData {
  company: string;
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
      <ThemedInput
        placeholder="Company"
        value={values.company}
        onChangeText={(v) => handleChange('company', v)}
      />
      <LocationSelector
        selectedLocation={values.location}
        onLocationChange={(v) => handleChange('location', v)}
      />
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
        onIndustryChange={(v) => handleChange('industry', v)}
      />
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