'use client';

import React from 'react';
import { INDUSTRIES } from '@/dataset/industries';
import BadgeSelector from '@/components/ui/BadgeSelector';

interface IndustryFilterProps {
  selectedIndustry: string | null;
  setSelectedIndustry: (industry: string) => void;
}

export default function IndustryFilter({
  selectedIndustry,
  setSelectedIndustry
}: IndustryFilterProps) {
  // Transform the INDUSTRIES array to include 'All' option
  const badgeOptions = [
    { label: 'All', value: 'All', icon: 'grid' },
    ...INDUSTRIES.map(industry => ({
      label: industry.label,
      value: industry.label,
      icon: industry.icon
    }))
  ];

  return (
    <div className="py-2">
      <BadgeSelector
        options={badgeOptions}
        selectedValue={selectedIndustry ?? 'All'}
        onValueChange={setSelectedIndustry}
        title="Industries"
      />
    </div>
  );
}
