import React from 'react';
import { ViewStyle } from 'react-native';
import { DEADLINE_OPTIONS } from '@/dataset/deadlineOptions';
import BadgeSelector, { BadgeOption } from '@/components/ui/BadgeSelector';

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
  // If DEADLINE_OPTIONS is a string array, map to BadgeOption
  const deadlineOptions: BadgeOption[] = DEADLINE_OPTIONS.map(option => ({
    label: option,
    value: option,
    // icon: "calendar", // Optionally add an icon if desired
  }));

  return (
    <BadgeSelector
      options={deadlineOptions}
      selectedValue={selectedDeadline}
      onValueChange={onDeadlineChange}
      style={style}
      title="Application Deadline"
    />
  );
}
