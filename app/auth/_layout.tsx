import React from 'react';
import StackNavigator from '@/components/navigation/StackNavigator';

export default function AuthLayout() {
  return (
    <StackNavigator 
      screens={[
        { name: "login" },
        { name: "email" },
        { name: "username" },
        { name: "verify" },
        { name: "success" }
      ]}
      defaultOptions={{ headerShown: false }}
    />
  );
}