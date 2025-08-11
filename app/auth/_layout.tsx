import React from 'react';
import StackNavigator from '@/components/navigation/StackNavigator';
import ScreenContainer from '@/components/ScreenContainer';

export default function AuthLayout() {
  return (
    <ScreenContainer>
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
    </ScreenContainer>
  );
}