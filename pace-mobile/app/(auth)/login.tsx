import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ImageBackground, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Moon, Mail, Lock, Users, Sparkles, Send } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import * as mock from '@/constants/mockData';
import { signInWithEmail, signInWithPassword, signUpWithEmail, supabase } from '@/lib/supabase';
import { ensureProfile } from '@/lib/apis';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  
  const slides = [
    {
      title: "Some moments deserve more than disappearing chats.",
      desc: "A private place for the small circles, the late nights, and the inside jokes that shaped who you are."
    },
    {
      title: "People come and go. Memories stay.",
      desc: "Keep the ticket stubs, the messy voice notes, and the blur of photos in a space that doesn't expire."
    },
    {
      title: "Create private spaces for the phases that mattered.",
      desc: "An archived era, a wild semester, or just a quiet evening by the sea. Shared only with those who were there."
    }
  ];

  const [index, setIndex] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState<'magic' | 'password' | 'signup'>('magic');
  const [authStatus, setAuthStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const progress = ((index + 1) / slides.length) * 100;

  async function handleEmailAuth() {
    if (!email.trim()) {
      setAuthStatus("Enter your email to get a private sign-in link.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await signInWithEmail(email.trim());
      setAuthStatus("Check your email for the Pace sign-in link.");
    } catch (error: any) {
      setAuthStatus(error.message || "Email sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!email.trim() || !password) {
      setAuthStatus("Provide email and password to create an account.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      const data = await signUpWithEmail(email.trim(), password, { displayName: name });
      if (data?.user) {
        await ensureProfile(data.user);
        setAuthStatus("Account created and signed in.");
        router.replace('/(tabs)');
      } else {
        setAuthStatus("Check your email to confirm registration.");
      }
    } catch (error: any) {
      setAuthStatus(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSigninPassword() {
    if (!email.trim() || !password) {
      setAuthStatus("Enter email and password to sign in.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      const data = await signInWithPassword(email.trim(), password);
      if (data?.user) {
        await ensureProfile(data.user);
        setAuthStatus("Signed in successfully.");
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setAuthStatus(error.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  const bypassOnboarding = async () => {
    try {
      const { safeStorage } = require('@/lib/supabase');
      await safeStorage.setItem('pace_sandbox_bypassed', 'true');
    } catch {}
    router.replace('/(tabs)');
  };

  return (
    <ImageBackground
      source={{ uri: mock.covers[index + 1] || mock.covers[0] }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.blurGradientOverlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconWrap}>
                <Moon size={14} color="#f5f1ea" />
              </View>
              <ThemedText style={styles.brandText}>pace</ThemedText>
            </View>
            <Pressable
              onPress={() => {
                setShowAuth(prev => !prev);
                setAuthStatus("");
              }}
              style={styles.toggleBtn}
            >
              <ThemedText style={styles.toggleBtnText}>
                {showAuth ? "Narrative" : "Sign In"}
              </ThemedText>
            </Pressable>
          </View>

          {/* Core Content */}
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!showAuth ? (
              /* Narrative Slides */
              <View style={styles.slideContainer}>
                {/* Progress Indicators */}
                <View style={styles.progressWrap}>
                  <View style={styles.progressTextRow}>
                    <ThemedText style={styles.progressTextLabel}>A Private Memory Network</ThemedText>
                    <ThemedText style={styles.progressTextLabel}>{index + 1} of 3</ThemedText>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                  </View>
                </View>

                {/* Narrative Text */}
                <View style={styles.slideTextWrap}>
                  <ThemedText style={styles.slideTitle}>{slides[index].title}</ThemedText>
                  <ThemedText style={styles.slideDesc}>{slides[index].desc}</ThemedText>
                </View>

                {/* Continue Buttons */}
                <Pressable
                  onPress={() => {
                    if (index < slides.length - 1) {
                      setIndex(index + 1);
                    } else {
                      setShowAuth(true);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { opacity: pressed ? 0.9 : 1, marginTop: 40 }
                  ]}
                >
                  <ThemedText style={styles.primaryBtnText}>
                    {index < slides.length - 1 ? "Continue" : "Begin Sharing"}
                  </ThemedText>
                  <Sparkles size={14} color="#10100f" />
                </Pressable>
              </View>
            ) : (
              /* Auth Form Portal */
              <View style={styles.authCard}>
                <View style={styles.authCardHeader}>
                  <ThemedText style={styles.authCardTitle}>Welcome to Pace</ThemedText>
                  <ThemedText style={styles.authCardSubtitle}>
                    Sign in privately to protect your era{"'"}s memory box.
                  </ThemedText>
                </View>

                {/* Custom Segmented Tabs */}
                <View style={styles.tabBar}>
                  {(['magic', 'password', 'signup'] as const).map((mode) => {
                    const active = authMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        onPress={() => {
                          setAuthMode(mode);
                          setAuthStatus("");
                        }}
                        style={[
                          styles.tabItem,
                          active && styles.tabItemActive
                        ]}
                      >
                        <ThemedText style={[
                          styles.tabText,
                          active && styles.tabTextActive
                        ]}>
                          {mode === 'magic' ? 'Magic Link' : mode === 'password' ? 'Sign In' : 'Register'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Text Inputs */}
                <View style={styles.formGroup}>
                  {authMode === 'signup' && (
                    <View style={styles.inputWrap}>
                      <Users size={16} color="#8f877e" style={styles.inputIcon} />
                      <TextInput
                        placeholder="Your display name"
                        placeholderTextColor="#8f877e"
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                      />
                    </View>
                  )}

                  <View style={styles.inputWrap}>
                    <Mail size={16} color="#8f877e" style={styles.inputIcon} />
                    <TextInput
                      placeholder="you@email.com"
                      placeholderTextColor="#8f877e"
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>

                  {authMode !== 'magic' && (
                    <View style={styles.inputWrap}>
                      <Lock size={16} color="#8f877e" style={styles.inputIcon} />
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#8f877e"
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>
                  )}
                </View>

                {/* Status Alerts */}
                {authStatus ? (
                  <View style={[
                    styles.statusBox,
                    (authStatus.includes("Check your email") || authStatus.includes("Signed in"))
                      ? styles.statusBoxSuccess
                      : styles.statusBoxError
                  ]}>
                    <ThemedText style={[
                      styles.statusBoxText,
                      (authStatus.includes("Check your email") || authStatus.includes("Signed in"))
                        ? { color: '#7d8577' }
                        : { color: '#8f6b67' }
                    ]}>
                      {authStatus}
                    </ThemedText>
                  </View>
                ) : null}

                {/* Submit Action */}
                <Pressable
                  onPress={
                    authMode === 'magic'
                      ? handleEmailAuth
                      : authMode === 'signup'
                        ? handleSignup
                        : handleSigninPassword
                  }
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { opacity: pressed || loading ? 0.8 : 1, marginTop: 24 }
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#10100f" />
                  ) : (
                    <View style={styles.submitBtnContent}>
                      {authMode === 'magic' && <Send size={14} color="#10100f" />}
                      {authMode === 'signup' && <Sparkles size={14} color="#10100f" />}
                      {authMode === 'password' && <Lock size={14} color="#10100f" />}
                      <ThemedText style={styles.primaryBtnText}>
                        {authMode === 'magic'
                          ? "Send Access Token"
                          : authMode === 'signup'
                            ? "Register Era Access"
                            : "Unlock Vault"}
                      </ThemedText>
                    </View>
                  )}
                </Pressable>

                {/* Local Sandbox Bypass */}
                <Pressable
                  onPress={bypassOnboarding}
                  style={styles.sandboxLink}
                >
                  <ThemedText style={styles.sandboxLinkText}>
                    Launch local Sandbox (Offline Mode)
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Footer Sync description */}
          <ThemedText style={styles.footerSyncText}>
            {supabase ? "Supabase Client Configured" : "Offline Sandbox mode active"}
          </ThemedText>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  blurGradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // pace-black tint
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5f1ea', // pace-pearl
    letterSpacing: 0.5,
  },
  toggleBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cfc6ba', // pace-bone
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  progressWrap: {
    marginBottom: 32,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTextLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8f877e', // pace-smoke
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
  },
  progressBarFill: {
    height: 2,
    backgroundColor: '#f5f1ea',
    borderRadius: 1,
  },
  slideTextWrap: {
    gap: 16,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    color: '#f5f1ea',
  },
  slideDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(207, 198, 186, 0.7)',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f5f1ea',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10100f', // pace-ink
  },
  authCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  authCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5f1ea',
  },
  authCardSubtitle: {
    fontSize: 12,
    color: '#8f877e',
    textAlign: 'center',
    marginTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 24,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#f5f1ea',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8f877e',
  },
  tabTextActive: {
    color: '#10100f',
  },
  formGroup: {
    gap: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#f5f1ea',
  },
  statusBox: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statusBoxSuccess: {
    borderColor: 'rgba(125, 133, 119, 0.2)',
    backgroundColor: 'rgba(125, 133, 119, 0.05)',
  },
  statusBoxError: {
    borderColor: 'rgba(143, 107, 103, 0.2)',
    backgroundColor: 'rgba(143, 107, 103, 0.05)',
  },
  statusBoxText: {
    fontSize: 12,
    lineHeight: 16,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sandboxLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  sandboxLinkText: {
    fontSize: 12,
    color: '#8f877e',
    textDecorationLine: 'underline',
  },
  footerSyncText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#8f877e',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
