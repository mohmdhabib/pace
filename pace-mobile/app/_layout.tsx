import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { onAuthChange, getSession, isSupabaseConfigured } from '@/lib/supabase';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';

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

  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      try {
        const parsed = Linking.parse(url);
        const token = parsed.queryParams?.token || parsed.queryParams?.invite;
        if (typeof token === 'string' && token) {
          router.push({ pathname: '/modals/join-pace', params: { token } } as any);
        }
      } catch (err) {
        console.warn('Failed to parse incoming deep link url:', err);
      }
    }
  }, [url]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { safeStorage } = require('@/lib/supabase');
        const bypass = await safeStorage.getItem('pace_sandbox_bypassed');
        if (bypass === 'true' && mounted) {
          setHasBypassed(true);
        }
      } catch {}

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
        if (newSession) {
          const { safeStorage } = require('@/lib/supabase');
          safeStorage.setItem('pace_sandbox_bypassed', 'false').catch(() => {});
          setHasBypassed(false);
        }
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

    const checkRedirect = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const hasSession = !!session;
      
      let bypassed = hasBypassed;
      try {
        const { safeStorage } = require('@/lib/supabase');
        const bypassVal = await safeStorage.getItem('pace_sandbox_bypassed');
        if (bypassVal === 'true') {
          bypassed = true;
          if (!hasBypassed) setHasBypassed(true);
        }
      } catch {}

      if (!hasSession && !inAuthGroup && isSupabaseConfigured && !bypassed) {
        // Redirect to login screen if not logged in
        router.replace('/(auth)/login');
      } else if (hasSession && inAuthGroup) {
        // Redirect to home if logged in and trying to access login
        router.replace('/(tabs)');
      }
    };

    checkRedirect();
  }, [session, segments, loading, hasBypassed]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#f5f1ea" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="pace/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="relationship/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="modals/create-pace" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modals/edit-pace" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modals/invite-friends" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modals/join-pace" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modals/add-memory" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
