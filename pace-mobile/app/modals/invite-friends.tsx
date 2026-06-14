import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Mail, Link2, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { createInvite } from '@/lib/apis';

export default function InviteFriendsModal() {
  const router = useRouter();
  const { paceId } = useLocalSearchParams<{ paceId: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Input states
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  
  // Action states
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Private link will expire in 14 days.');

  const handleCreateLink = async () => {
    if (!paceId) {
      setStatusText('Pace ID is missing.');
      return;
    }

    setLoading(true);
    setStatusText('Generating secure token link...');

    try {
      const invite = await createInvite({
        paceId,
        email: email.trim() || null
      });

      if (invite && invite.url) {
        setInviteUrl(invite.url);
        setStatusText(email.trim() ? `Invite prepared for ${email.trim()}.` : 'Invite link created successfully.');
      } else {
        setStatusText('Failed to generate link.');
      }
    } catch (err: any) {
      setStatusText(err.message || 'Error generating link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    
    // Write link to standard native clipboard
    await Clipboard.setStringAsync(inviteUrl);
    setStatusText('Invite link copied to clipboard.');
    Alert.alert('Copied', 'The private invitation link has been copied to your clipboard.');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Invite Co-Authors</ThemedText>
        <View style={{ width: 36 }} />
      </SafeAreaView>
 
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding details */}
        <View style={styles.formSection}>
          <View style={styles.inputWrap}>
            <ThemedText style={styles.sectionLabel}>Friend{"'"}s Email (Optional)</ThemedText>
            <View style={[styles.inputBox, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: activeColors.backgroundElement }]}>
              <Mail size={16} color="#8f877e" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: activeColors.text }]}
                placeholder="friend@email.com"
                placeholderTextColor="#8f877e"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Informative Branding details card */}
        <View style={styles.infoCardWrap}>
          <View style={[styles.infoCard, { backgroundColor: activeColors.backgroundElement, borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.infoTitleRow}>
              <Link2 size={16} color="#cfc6ba" />
              <ThemedText style={styles.infoTitle}>Quiet Access Only</ThemedText>
            </View>
            <ThemedText style={styles.infoDesc}>
              Pace has no public search engine, feed algorithm, or follower counters. Invite links are unique tokens sent directly to friends you want in your circle.
            </ThemedText>

            {inviteUrl && (
              <View style={styles.inviteUrlBox}>
                <ThemedText style={styles.inviteUrlText}>{inviteUrl}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Pressable 
            onPress={handleCreateLink}
            disabled={loading}
            style={({ pressed }) => [
              styles.actionBtn, 
              { backgroundColor: '#f5f1ea', opacity: (pressed || loading) ? 0.9 : 1 }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Link2 size={14} color="#000000" />
                <ThemedText style={styles.actionBtnText}>Create Link</ThemedText>
              </>
            )}
          </Pressable>

          <Pressable 
            onPress={handleCopyLink}
            disabled={!inviteUrl}
            style={({ pressed }) => [
              styles.actionBtn, 
              styles.copyBtn,
              { opacity: pressed ? 0.9 : inviteUrl ? 1 : 0.5 }
            ]}
          >
            <Copy size={14} color="#f5f1ea" />
            <ThemedText style={[styles.actionBtnText, styles.copyBtnText]}>Copy</ThemedText>
          </Pressable>
        </View>

        {/* Status Text logs */}
        <ThemedText style={styles.statusLabel}>{statusText}</ThemedText>
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
  },
  formSection: {
    padding: 20,
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
  infoCardWrap: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  infoDesc: {
    fontSize: 12,
    color: '#cfc6ba',
    lineHeight: 18,
    opacity: 0.8,
  },
  inviteUrlBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  inviteUrlText: {
    fontSize: 11,
    color: '#cfc6ba',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  copyBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyBtnText: {
    color: '#f5f1ea',
  },
  statusLabel: {
    fontSize: 11,
    color: '#8f877e',
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
});
