import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Image, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Sparkles, Link2, Users, ShieldAlert, Check } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchInviteDetails, acceptInvite } from '@/lib/apis';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function JoinPaceModal() {
  const router = useRouter();
  const { token: routeToken } = useLocalSearchParams<{ token?: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Token state
  const [tokenInput, setTokenInput] = useState('');
  const [activeToken, setActiveToken] = useState<string | null>(null);

  // Invite details state
  const [invite, setInvite] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Join process states
  const [joining, setJoining] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Resolve session on load
  useEffect(() => {
    async function checkSession() {
      if (isSupabaseConfigured && supabase) {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      }
    }
    checkSession();
  }, []);

  // Handle route token if present on load
  useEffect(() => {
    if (routeToken) {
      setActiveToken(routeToken);
      loadInviteDetails(routeToken);
    }
  }, [routeToken]);

  const loadInviteDetails = async (token: string) => {
    setLoadingInvite(true);
    setErrorMsg(null);
    setInvite(null);

    // Extract token if a full URL was pasted
    let cleanToken = token.trim();
    if (cleanToken.includes('token=')) {
      const parts = cleanToken.split('token=');
      cleanToken = parts[parts.length - 1];
    } else if (cleanToken.includes('invite=')) {
      const parts = cleanToken.split('invite=');
      cleanToken = parts[parts.length - 1];
    }

    try {
      const data = await fetchInviteDetails(cleanToken);
      if (data) {
        setInvite(data);
        setActiveToken(cleanToken);
      } else {
        setErrorMsg('Invalid or expired invitation token.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load invitation details.');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleManualSubmit = () => {
    if (!tokenInput.trim()) {
      setErrorMsg('Please paste a token or invite link first.');
      return;
    }
    loadInviteDetails(tokenInput);
  };

  const handleJoin = async () => {
    if (!activeToken || !invite) return;

    if (!session?.user) {
      Alert.alert(
        'Authentication Required',
        'You must sign in to join a private Scrapbook Era.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login' as any) }
        ]
      );
      return;
    }

    setJoining(true);
    setErrorMsg(null);

    try {
      const paceId = await acceptInvite(activeToken, invite.paceId, session.user.id);
      Alert.alert(
        'Welcome!',
        `You have successfully joined ${invite.pace.title || 'the Era'}.`,
        [
          {
            text: 'Enter Space',
            onPress: () => {
              router.replace({
                pathname: '/pace/[id]',
                params: { id: paceId }
              } as any);
            }
          }
        ]
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join space. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Join Shared Space</ThemedText>
        <View style={{ width: 36 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorContainer}>
            <ShieldAlert size={16} color="#ef4444" />
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* INPUT VIEW: If details aren't loaded yet */}
        {!invite && !loadingInvite && (
          <View style={styles.manualEntryWrap}>
            <ThemedText style={styles.helpText}>
              Pace rooms are private and accessible only via direct invitations. Paste your invite code or invitation link below.
            </ThemedText>

            <View style={styles.inputWrap}>
              <ThemedText style={styles.sectionLabel}>Invite Link or Token</ThemedText>
              <View style={[styles.inputBox, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: activeColors.backgroundElement }]}>
                <Link2 size={16} color="#8f877e" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: activeColors.text }]}
                  placeholder="Paste pacemobile://invite?token=..."
                  placeholderTextColor="#8f877e"
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <Pressable
              onPress={handleManualSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: '#f5f1ea', opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <Check size={14} color="#000000" />
              <ThemedText style={styles.submitBtnText}>Resolve Invite</ThemedText>
            </Pressable>
          </View>
        )}

        {/* LOADING STATE */}
        {loadingInvite && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={activeColors.tint} />
            <ThemedText style={styles.loadingText}>Loading invitation details...</ThemedText>
          </View>
        )}

        {/* PREVIEW DETAILS VIEW: When invite details are successfully loaded */}
        {invite && !loadingInvite && (
          <View style={styles.previewContainer}>
            <ThemedText style={styles.inviteContext}>
              You have been invited to join a private scrapbook circle:
            </ThemedText>

            {/* Space Visual Card Card */}
            <View style={[styles.paceCard, { borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
              {invite.pace.coverUrl && (
                <Image source={{ uri: invite.pace.coverUrl }} style={styles.cardImage} />
              )}
              <View style={styles.cardOverlay} />
              
              <View style={styles.cardInfo}>
                <View style={styles.moodPill}>
                  <ThemedText style={styles.moodText}>{invite.pace.mood || 'nostalgic'}</ThemedText>
                </View>
                <ThemedText style={styles.paceTitle}>{invite.pace.title}</ThemedText>
                {invite.pace.description && (
                  <ThemedText style={styles.paceDesc}>{invite.pace.description}</ThemedText>
                )}
              </View>
            </View>

            {/* Host info block */}
            <View style={styles.hostBox}>
              <Users size={16} color="#cfc6ba" />
              <ThemedText style={styles.hostText}>
                Invited by <ThemedText style={styles.hostName}>{invite.inviter?.displayName || 'A friend'}</ThemedText>
              </ThemedText>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {session?.user ? (
                <View style={styles.authBadge}>
                  <ThemedText style={styles.authBadgeText}>
                    Signed in as {session.user.email}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.warningBox}>
                  <ShieldAlert size={14} color="#cfc6ba" />
                  <ThemedText style={styles.warningText}>
                    You need to be authenticated. Tapping Join will take you to Login.
                  </ThemedText>
                </View>
              )}

              <Pressable
                onPress={handleJoin}
                disabled={joining}
                style={({ pressed }) => [
                  styles.joinBtn,
                  { backgroundColor: '#f5f1ea', opacity: (pressed || joining) ? 0.95 : 1 }
                ]}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Sparkles size={16} color="#000000" />
                    <ThemedText style={styles.joinBtnText}>
                      Join {invite.pace.title || 'Era'}
                    </ThemedText>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setInvite(null);
                  setActiveToken(null);
                }}
                style={styles.cancelLink}
              >
                <ThemedText style={styles.cancelLinkText}>Enter different token</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  manualEntryWrap: {
    gap: 20,
    paddingTop: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#cfc6ba',
    lineHeight: 20,
    opacity: 0.8,
  },
  inputWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cfc6ba',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  loadingCenter: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#8f877e',
  },
  previewContainer: {
    gap: 24,
  },
  inviteContext: {
    fontSize: 13,
    color: '#cfc6ba',
    lineHeight: 18,
  },
  paceCard: {
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  cardInfo: {
    gap: 6,
    zIndex: 10,
  },
  moodPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 10,
    color: '#cfc6ba',
    textTransform: 'uppercase',
  },
  paceTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f5f1ea',
  },
  paceDesc: {
    fontSize: 12,
    color: '#cfc6ba',
    lineHeight: 16,
    opacity: 0.9,
  },
  hostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  hostText: {
    fontSize: 13,
    color: '#cfc6ba',
  },
  hostName: {
    fontWeight: '700',
    color: '#f5f1ea',
  },
  actionSection: {
    gap: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  authBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  authBadgeText: {
    fontSize: 11,
    color: '#8f877e',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  warningText: {
    fontSize: 11,
    color: '#8f877e',
    textAlign: 'center',
  },
  joinBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  joinBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  cancelLink: {
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 12,
    color: '#8f877e',
    textDecorationLine: 'underline',
  },
});
