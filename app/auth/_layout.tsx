import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="email" />
      <Stack.Screen name="username" />
      <Stack.Screen name="name" />
      <Stack.Screen name="profile-picture" />
      <Stack.Screen name="overview" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="success" />
    </Stack>
  );
} 