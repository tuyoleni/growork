import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="email" />
      <Stack.Screen name="username" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="success" />
    </Stack>
  );
} 