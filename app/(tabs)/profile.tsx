import CompaniesList from '@/components/profile/CompaniesList';
import DocumentsList from '@/components/profile/DocumentsList';
import FollowingGrid from '@/components/profile/FollowingGrid';
import ProfileHeader from '@/components/profile/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedView } from '@/components/ThemedView';
import CategorySelector from '@/components/ui/CategorySelector';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

const CATEGORY_OPTIONS = ['Documents', 'Companies', 'Media'];

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);
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

          {selectedIndex === 0 && <DocumentsList />}
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