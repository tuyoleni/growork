import { HapticTab } from '@/components/HapticTab';
import { Colors } from '@/constants/Colors';
import { usePermissions } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const tabBarBackground = Colors[colorScheme].background;
  const { isBusinessUser } = usePermissions();
  const applicationTabOptions = isBusinessUser
    ? {
      title: 'Jobs',
      tabBarIcon: ({ color }: { color: string }) => (
        <Feather name="briefcase" size={20} color={color} />
      ),
      tabBarButton: (props: any) => <HapticTab {...props} />,
      headerShown: false,
    }
    : {
      href: null as any,
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: tabBarBackground },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
          tabBarButton: (props) => <HapticTab {...props} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen 
        name="applications" 
        options={applicationTabOptions as any} 
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Feather name="search" size={20} color={color} />,
          tabBarButton: (props) => <HapticTab {...props} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Feather name="bookmark" size={20} color={color} />,
          tabBarButton: (props) => <HapticTab {...props} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color} />,
          tabBarButton: (props) => <HapticTab {...props} />,
        }}
      />
    </Tabs>
  );
}
