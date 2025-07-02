import { Colors } from '@/constants/Colors';
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, useColorScheme, ViewStyle } from 'react-native';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, style }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}> 
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});

export default ScreenContainer; 