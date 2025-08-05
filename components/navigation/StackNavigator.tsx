import React from 'react';
import { Stack } from 'expo-router';

interface StackNavigatorProps {
  screens: {
    name: string;
    options?: {
      headerShown?: boolean;
      title?: string;
      [key: string]: any;
    };
  }[];
  defaultOptions?: {
    headerShown?: boolean;
    [key: string]: any;
  };
}

/**
 * A reusable Stack Navigator component that follows the same pattern as the auth navigation
 * @param screens Array of screen configurations with name and options
 * @param defaultOptions Default options to apply to all screens
 */
export default function StackNavigator({ screens, defaultOptions = { headerShown: false } }: StackNavigatorProps) {
  return (
    <Stack screenOptions={defaultOptions}>
      {screens.map((screen) => (
        <Stack.Screen 
          key={screen.name} 
          name={screen.name} 
          options={screen.options} 
        />
      ))}
    </Stack>
  );
}