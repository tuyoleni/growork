import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LOCATIONS } from '@/dataset/locations';
import FilterSelector from '@/components/ui/FilterSelector';

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  style?: ViewStyle;
}

export default function LocationSelector({
  selectedLocation,
  onLocationChange,
  style,
}: LocationSelectorProps) {
  // No need to map options anymore as FilterSelector handles this internally

  return (
    <View style={[styles.container, style]}>
      <FilterSelector
        options={LOCATIONS}
        selectedValue={selectedLocation}
        onValueChange={onLocationChange}
        title="Location Type"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});