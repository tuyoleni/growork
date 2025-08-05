import React from 'react';
import BadgeSelector, { BadgeOption } from '@/components/ui/BadgeSelector';
import { JOB_TYPES } from '@/dataset/postTypes';

interface JobTypeSelectorProps {
  selectedJobType: string;
  onJobTypeChange: (jobType: string) => void;
  style?: any;
}

const jobTypeOptions: BadgeOption[] = JOB_TYPES.map(type => ({
  label: type.value,
  value: type.value,
  // Optionally: icon: 'briefcase',
}));

export default function JobTypeSelector({
  selectedJobType,
  onJobTypeChange,
  style,
}: JobTypeSelectorProps) {
  return (
    <BadgeSelector
      options={jobTypeOptions}
      selectedValue={selectedJobType}
      onValueChange={onJobTypeChange}
      style={style}
      title="Job Type"
    />
  );
}
