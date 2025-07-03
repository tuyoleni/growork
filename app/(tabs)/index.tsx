import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { ScrollView } from 'react-native';

export default function Home() {
  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <ThemedText>Home Screen</ThemedText>
        {/* Add more scrollable content here */}
      </ScrollView>
    </ScreenContainer>
  );
}