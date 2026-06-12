import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { onAuthChange, getSession, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityIndicator, View } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [hasBypassed, setHasBypassed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const initialSession = await getSession();
        if (mounted) {
          setSession(initialSession);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const unsubscribe = onAuthChange((newSession) => {
      if (mounted) {
        setSession(newSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    // Segment tracking
    const inAuthGroup = segments[0] === '(auth)';
    const hasSession = !!session;

    if (!hasSession && !inAuthGroup && isSupabaseConfigured && !hasBypassed) {
      // Redirect to login screen if not logged in
      router.replace('/(auth)/login');
    } else if (hasSession && inAuthGroup) {
      // Redirect to home if logged in and trying to access login
      router.replace('/(tabs)');
    }
  }, [session, segments, loading, hasBypassed]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080807' }}>
        <ActivityIndicator size="large" color="#f5f1ea" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="modals/create-pace" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modals/add-memory" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
