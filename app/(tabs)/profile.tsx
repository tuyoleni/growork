import CompaniesList from '@/components/profile/CompaniesList';
import DocumentsList from '@/components/profile/DocumentsList';
import FollowingGrid from '@/components/profile/FollowingGrid';
import ProfileHeader from '@/components/profile/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import CategorySelector from '@/components/ui/CategorySelector';
import IndustrySelector from '@/components/ui/IndustrySelector';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const CATEGORY_OPTIONS = ['Documents', 'Companies', 'Media'];

const DOCUMENT_FILTERS = [
  { icon: 'file-text', label: 'All' },
  { icon: 'briefcase', label: 'CV' },
  { icon: 'mail', label: 'Cover Letter' },
  { icon: 'award', label: 'Certificate' },
  { icon: 'folder', label: 'Portfolio' },
  { icon: 'clipboard', label: 'Other' },
];

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedDocumentFilter, setSelectedDocumentFilter] = useState(0);
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  
  // Demo data for header
  const headerProps = {
    name: 'Simeon Tuyoleni',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    status: 'Available',
    subtitle: 'Senior Product Designer • Windhoek, Namibiar',
    profileStrength: 'Profile Strength: Excellent',
    profileStrengthDescription: 'Your profile is optimized for job searching',
    stats: [
      { label: 'Following', value: 10 },
      { label: 'Channels', value: 8 },
    ],
    onEdit: () => {},
  };

  const handleDocumentFilterChange = (index: number) => {
    setSelectedDocumentFilter(index);
    // Here you would typically filter documents based on the selected filter
    console.log('Document filter changed to:', DOCUMENT_FILTERS[index]?.label);
  };

  const handleMoreDocumentFilters = () => {
    console.log('Show more document filters');
  };

  const getSelectedDocumentFilterLabel = () => {
    return DOCUMENT_FILTERS[selectedDocumentFilter]?.label || 'All';
  };

  return (
    <ScreenContainer>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ThemedView>
          <ProfileHeader {...headerProps} />
          
          <CategorySelector
            options={CATEGORY_OPTIONS}
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            style={{ marginTop: 8 }}
          />

          {/* Document Filter - Only show when Documents tab is selected */}
          {selectedIndex === 0 && (
            <View style={styles.documentFilterSection}>
              <IndustrySelector
                options={DOCUMENT_FILTERS}
                selectedIndex={selectedDocumentFilter}
                onChange={handleDocumentFilterChange}
                onMorePress={handleMoreDocumentFilters}
                style={styles.documentFilterSelector}
              />
            </View>
          )}

          {selectedIndex === 0 && (
            <DocumentsList selectedDocumentFilter={getSelectedDocumentFilterLabel()} />
          )}
          {selectedIndex === 1 && <CompaniesList />}
          {selectedIndex === 2 && <FollowingGrid />}
        </ThemedView>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  documentFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  documentFilterSelector: {
    paddingHorizontal: 0,
  },
});