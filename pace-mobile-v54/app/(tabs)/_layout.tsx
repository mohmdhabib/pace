import { Tabs } from 'expo-router';
import React from 'react';
import { Compass, Layers, MessageCircle, HeartPulse, User } from 'lucide-react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme, View } from 'react-native';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColors.tint,
        tabBarInactiveTintColor: activeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: activeColors.background,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="paces"
        options={{
          title: 'Paces',
          tabBarIcon: ({ color }) => <Layers size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ color }) => <HeartPulse size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
      
      {/* Hide the default explore template page from tabs */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
