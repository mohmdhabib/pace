import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, TextInput, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Camera, LogOut, Settings, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { updateProfile, uploadMemoryFile } from '@/lib/apis';

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.statCard, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [session, setSession] = useState<any>(null);
  
  // Profile state
  const [name, setName] = useState('Mohammed');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [stats, setStats] = useState({ active: 3, archived: 0, memories: 8 });
  const [recap, setRecap] = useState("Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.");

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [pickedImageUri, setPickedImageUri] = useState('');

  async function loadProfile() {
    try {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);

      if (s?.user) {
        setEmail(s.user.email || '');
        const meta = s.user.user_metadata;
        setName(meta?.full_name || meta?.name || s.user.email?.split('@')[0] || 'Pace User');
        setAvatarUrl(meta?.avatar_url || '');

        // Fetch counts from Supabase
        const [activeData, archivedData, memoriesData, recapsData] = await Promise.all([
          supabase.from('paces').select('id', { count: 'exact', head: true }).is('archived_at', null).eq('owner_id', s.user.id),
          supabase.from('paces').select('id', { count: 'exact', head: true }).not('archived_at', 'is', null).eq('owner_id', s.user.id),
          supabase.from('memories').select('id', { count: 'exact', head: true }).eq('author_id', s.user.id),
          supabase.from('ai_recaps').select('summary').order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        setStats({
          active: activeData.count || 0,
          archived: archivedData.count || 0,
          memories: memoriesData.count || 0
        });

        if (recapsData.data?.summary) {
          setRecap(recapsData.data.summary);
        }
      }
    } catch (err) {
      console.warn("Failed to load user profile details:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Media library access is required to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPickedImageUri(result.assets[0].uri);
    }
  };

  const handleStartEditing = () => {
    setEditName(name);
    setEditAvatarUrl(avatarUrl);
    setPickedImageUri('');
    setStatus('');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setStatus("Display name is required.");
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      let finalAvatarUrl = editAvatarUrl;

      if (pickedImageUri) {
        // Upload photo to storage under bucket path 'avatars'
        const uploadedUrl = await uploadMemoryFile({
          paceId: 'avatars',
          uri: pickedImageUri,
          fileExtension: 'jpg'
        });
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        }
      }

      await updateProfile({
        displayName: editName.trim(),
        avatarUrl: finalAvatarUrl
      });

      setName(editName.trim());
      setAvatarUrl(finalAvatarUrl);
      setIsEditing(false);
      setStatus("Profile updated successfully.");
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      setStatus(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/login');
    } catch (err: any) {
      setStatus(err.message || "Failed to sign out.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {isEditing ? (
          /* Profile customization subscreen */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>Edit Profile</ThemedText>
            </View>

            <View style={styles.avatarEditContainer}>
              <Pressable onPress={handlePickImage} style={styles.editAvatarFrame}>
                <Avatar src={pickedImageUri || editAvatarUrl} name={editName || name} size="xl" />
                <View style={styles.cameraOverlay}>
                  <Camera size={20} color="#f5f1ea" />
                </View>
              </Pressable>
              <ThemedText style={styles.avatarHelpText}>Tap to choose a photo</ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.inputLabel}>DISPLAY NAME</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: activeColors.text }]}
                placeholder="Your name"
                placeholderTextColor="#8f877e"
                value={editName}
                onChangeText={setEditName}
                maxLength={24}
              />
            </View>

            {status ? (
              <ThemedText style={[styles.statusMsg, { color: status.includes("successfully") ? '#7d8577' : '#8f6b67' }]}>
                {status}
              </ThemedText>
            ) : null}

            <View style={styles.formActions}>
              <Pressable
                onPress={handleSaveProfile}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: '#f5f1ea',
                    opacity: pressed || saving ? 0.9 : 1
                  }
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#080807" />
                ) : (
                  <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                )}
              </Pressable>

              <Pressable
                onPress={() => setIsEditing(false)}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          /* Profile view screen */
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLabelRow}>
                <Settings size={14} color={activeColors.textSecondary} />
                <ThemedText style={styles.headerLabel}>SETTINGS</ThemedText>
              </View>
              <ThemedText style={styles.title}>Profile</ThemedText>
            </View>

            {/* Profile Avatar and Name */}
            <View style={styles.profileHero}>
              <Avatar src={avatarUrl} name={name} size="xl" />
              <ThemedText style={styles.profileName}>{name}</ThemedText>
              <ThemedText style={styles.profileEmail}>{email || 'Offline Sandbox Mode'}</ThemedText>

              <Pressable
                onPress={handleStartEditing}
                style={({ pressed }) => [
                  styles.editProfileBtn,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <ThemedText style={styles.editProfileText}>Customize Profile</ThemedText>
              </Pressable>
            </View>

            <ThemedText style={styles.philosophy}>
              No followers. No performance. Just the rooms that still mean something.
            </ThemedText>

            {/* Stats */}
            <View style={styles.statsSection}>
              <StatCard value={stats.active.toString()} label="active" />
              <StatCard value={stats.archived.toString()} label="archived" />
              <StatCard value={stats.memories.toString()} label="memories" />
            </View>

            {/* AI Recap History Card */}
            <View style={[styles.recapCard, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
              <View style={styles.recapHeader}>
                <Sparkles size={14} color="#f5f1ea" />
                <ThemedText style={styles.recapHeading}>RECAP HISTORY</ThemedText>
              </View>
              <ThemedText style={styles.recapText}>"{recap}"</ThemedText>
            </View>

            {status ? (
              <ThemedText style={styles.statusMsg}>{status}</ThemedText>
            ) : null}

            {/* Sign Out Trigger */}
            <View style={styles.signOutWrapper}>
              {session ? (
                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [
                    styles.signOutBtn,
                    {
                      backgroundColor: 'rgba(143, 107, 103, 0.08)',
                      borderColor: 'rgba(143, 107, 103, 0.15)',
                      opacity: pressed ? 0.95 : 1
                    }
                  ]}
                >
                  <LogOut size={16} color="#8f6b67" style={styles.btnIcon} />
                  <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
                </Pressable>
              ) : (
                <View style={[styles.offlinePanel, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
                  <ThemedText style={styles.offlineText}>
                    You are currently running in Guest mode. Sign in to cloud-sync your friendship memories.
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 32,
  },
  header: {
    gap: 6,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f5f1ea',
  },
  profileHero: {
    alignItems: 'center',
    gap: 12,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f5f1ea',
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: '#8f877e',
  },
  editProfileBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 4,
  },
  editProfileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cfc6ba',
  },
  philosophy: {
    fontSize: 13,
    color: '#8f877e',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginVertical: 4,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f5f1ea',
  },
  statLabel: {
    fontSize: 9,
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  recapCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recapHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cfc6ba',
    letterSpacing: 1.5,
  },
  recapText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#f5f1ea',
  },
  signOutWrapper: {
    marginTop: 8,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    height: 50,
    borderRadius: 25,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8f6b67',
  },
  btnIcon: {
    marginRight: 6,
  },
  offlinePanel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  offlineText: {
    fontSize: 12,
    color: '#8f877e',
    lineHeight: 18,
    textAlign: 'center',
  },
  statusMsg: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: -8,
  },
  avatarEditContainer: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  editAvatarFrame: {
    position: 'relative',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10100f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#080807',
  },
  avatarHelpText: {
    fontSize: 11,
    color: '#8f877e',
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  formActions: {
    gap: 12,
    marginTop: 16,
  },
  saveBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080807',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
});
