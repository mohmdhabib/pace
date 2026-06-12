import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Image, RefreshControl, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Play, ArrowRight, Layers, UserPlus, ImagePlus, Compass, Moon } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import { fetchPaces, fetchRecentMemoriesAcrossPaces, fetchCloseConnections } from '@/lib/apis';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as mock from '@/constants/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [session, setSession] = useState<any>(null);
  const [paces, setPaces] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      }
      
      const [pData, mData, cData] = await Promise.all([
        fetchPaces(),
        fetchRecentMemoriesAcrossPaces(),
        fetchCloseConnections()
      ]);
      
      setPaces(pData || []);
      setMemories(mData || []);
      setConnections(cData || []);
    } catch (err) {
      console.warn("Failed to fetch home screen data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  // Determine if user has content (either live or from mocks)
  const hasContent = memories.length > 0 || paces.length > 0;
  // If authenticated but no content, render onboarding welcome layout
  const showWelcome = session && !hasContent;

  const featuredMemory = memories.find((m) => m.mood === 'core-memory') || memories[0];
  const recentPhotos = memories.filter((m) => m.type === 'photo' && m.image);

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
          }
        >
          {showWelcome ? (
            /* Cinematic Onboarding Welcome State */
            <View style={styles.welcomeContainer}>
              <View style={styles.header}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <ThemedText style={styles.badgeText}>WELCOME</ThemedText>
                </View>
                <ThemedText style={styles.brandTitle}>
                  Hey {session.user?.user_metadata?.full_name?.split(' ')[0] || session.user?.email?.split('@')[0] || 'friend'} 👋
                </ThemedText>
                <ThemedText style={styles.brandSubtitleLeft}>
                  Your first era is ready to be written. Start below.
                </ThemedText>
              </View>

              {/* Welcome Card Hero */}
              <View style={[styles.card, { backgroundColor: activeColors.backgroundElement }]}>
                <View style={styles.welcomeHeroOverlay}>
                  <Image source={{ uri: mock.covers[0] }} style={styles.welcomeHeroImage} />
                  <View style={styles.imageBottomOverlay} />
                </View>
                <View style={styles.welcomeHeroBody}>
                  <View style={styles.heroBadgeRow}>
                    <Moon size={12} color={activeColors.textSecondary} />
                    <ThemedText style={styles.heroBadgeText}>Pace · Private Memory Rooms</ThemedText>
                  </View>
                  <ThemedText style={styles.welcomeHeroTitle}>
                    Capture eras with the people who were there.
                  </ThemedText>
                  <ThemedText style={styles.welcomeHeroDesc}>
                    Photos, voice notes, quotes — all in one private, cinematic scrapbook.
                  </ThemedText>
                </View>
              </View>

              {/* Onboarding Action List */}
              <View style={styles.actionSection}>
                <ThemedText style={styles.sectionTitle}>GET STARTED</ThemedText>
                
                <Pressable
                  onPress={() => router.push('/modals/create-pace' as any)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      borderColor: 'rgba(210, 197, 177, 0.2)',
                      backgroundColor: 'rgba(210, 197, 177, 0.05)',
                      opacity: pressed ? 0.9 : 1
                    }
                  ]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(210, 197, 177, 0.1)' }]}>
                    <Layers size={18} color="#f5f1ea" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <ThemedText style={styles.actionLabel}>Create a Pace</ThemedText>
                    <ThemedText style={styles.actionSub}>Start a private room for your next era</ThemedText>
                  </View>
                  <ArrowRight size={14} color={activeColors.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/modals/create-pace' as any)} // Inviting happens during or after Pace creation
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      borderColor: 'rgba(125, 133, 119, 0.2)',
                      backgroundColor: 'rgba(125, 133, 119, 0.05)',
                      opacity: pressed ? 0.9 : 1
                    }
                  ]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(125, 133, 119, 0.1)' }]}>
                    <UserPlus size={18} color="#f5f1ea" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <ThemedText style={styles.actionLabel}>Invite a Friend</ThemedText>
                    <ThemedText style={styles.actionSub}>Share a link — they join your Pace instantly</ThemedText>
                  </View>
                  <ArrowRight size={14} color={activeColors.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => router.push('/modals/add-memory' as any)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      borderColor: 'rgba(143, 107, 103, 0.2)',
                      backgroundColor: 'rgba(143, 107, 103, 0.05)',
                      opacity: pressed ? 0.9 : 1
                    }
                  ]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(143, 107, 103, 0.1)' }]}>
                    <ImagePlus size={18} color="#f5f1ea" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <ThemedText style={styles.actionLabel}>Add a Memory</ThemedText>
                    <ThemedText style={styles.actionSub}>Drop a photo, voice note, or a text quote</ThemedText>
                  </View>
                  <ArrowRight size={14} color={activeColors.textSecondary} />
                </Pressable>
              </View>
            </View>
          ) : (
            /* Content Dashboard State */
            <View style={styles.dashboardContainer}>
              {/* Header */}
              <View style={styles.dashboardHeader}>
                <View style={styles.dashboardHeaderLabelRow}>
                  <Compass size={14} color={activeColors.textSecondary} />
                  <ThemedText style={styles.dashboardHeaderLabel}>DISCOVER</ThemedText>
                </View>
                <ThemedText style={styles.dashboardTitle}>pace</ThemedText>
              </View>

              {/* Featured Moment */}
              {featuredMemory && (
                <View style={[styles.featuredCard, { backgroundColor: activeColors.backgroundElement }]}>
                  <View style={styles.featuredImageContainer}>
                    <Image source={{ uri: featuredMemory.image || mock.covers[2] }} style={styles.featuredImage} />
                    <View style={styles.imageBottomOverlay} />
                    <View style={styles.featuredBadge}>
                      <Sparkles size={10} color="#fbbf24" style={styles.sparkleIcon} />
                      <ThemedText style={styles.featuredBadgeText}>FEATURED MOMENT</ThemedText>
                    </View>
                  </View>
                  <View style={styles.featuredBody}>
                    <ThemedText style={styles.featuredMeta}>
                      {featuredMemory.author} • {featuredMemory.date}
                    </ThemedText>
                    <ThemedText style={styles.featuredCaption}>
                      "{featuredMemory.caption}"
                    </ThemedText>
                    <View style={styles.featuredFooter}>
                      <View style={[styles.moodPill, { backgroundColor: activeColors.backgroundSelected }]}>
                        <ThemedText style={styles.moodText}>{featuredMemory.mood}</ThemedText>
                      </View>
                      {featuredMemory.type === 'voice' && (
                        <Pressable style={styles.listenBtn}>
                          <Play size={10} color="#080807" style={styles.playIcon} />
                          <ThemedText style={styles.listenBtnText}>Listen</ThemedText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Close Connections Horizontal Scroll */}
              <View style={styles.connectionsSection}>
                <ThemedText style={styles.sectionTitle}>CLOSE CONNECTIONS</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.connectionsScroll}>
                  {connections.length > 0 ? (
                    connections.map((conn) => (
                      <Pressable
                        key={conn.id}
                        onPress={() => router.push(`/relationship/${conn.id}` as any)}
                        style={({ pressed }) => [styles.connItem, { opacity: pressed ? 0.9 : 1 }]}
                      >
                        <View style={styles.avatarBorder}>
                          <Avatar src={conn.avatar_url} name={conn.name} online={true} size="lg" />
                        </View>
                        <ThemedText style={styles.connName}>{conn.name}</ThemedText>
                      </Pressable>
                    ))
                  ) : (
                    <ThemedText style={styles.emptyText}>Invite friends to share memories here.</ThemedText>
                  )}
                </ScrollView>
              </View>

              {/* Recent Moments Stream */}
              {recentPhotos.length > 0 && (
                <View style={styles.recentSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionTitle}>RECENT MOMENTS</ThemedText>
                    <Pressable onPress={() => router.push('/(tabs)/paces' as any)} style={styles.seeAllBtn}>
                      <ThemedText style={styles.seeAllText}>All Paces</ThemedText>
                      <ArrowRight size={12} color={activeColors.textSecondary} />
                    </Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentScroll}>
                    {recentPhotos.map((photo) => (
                      <Pressable
                        key={photo.id}
                        onPress={() => router.push('/(tabs)/paces' as any)}
                        style={({ pressed }) => [styles.photoItem, { opacity: pressed ? 0.95 : 1 }]}
                      >
                        <Image source={{ uri: photo.image }} style={styles.photoThumb} />
                        <View style={styles.photoInfoOverlay}>
                          <ThemedText style={styles.photoCaption} numberOfLines={1}>
                            {photo.caption}
                          </ThemedText>
                          <ThemedText style={styles.photoAuthor} numberOfLines={1}>
                            {photo.author}
                          </ThemedText>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 120,
  },
  welcomeContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  dashboardContainer: {
    paddingTop: 16,
    gap: 28,
  },
  header: {
    alignItems: 'flex-start',
    gap: 8,
  },
  dashboardHeader: {
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    gap: 4,
  },
  dashboardHeaderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dashboardHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
  },
  dashboardTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#f5f1ea',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 241, 234, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f5f1ea',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f5f1ea',
    letterSpacing: 1.5,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#f5f1ea',
    marginTop: 4,
  },
  brandSubtitleLeft: {
    fontSize: 14,
    color: '#8f877e',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  welcomeHeroOverlay: {
    height: 180,
    position: 'relative',
  },
  welcomeHeroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  imageBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  welcomeHeroBody: {
    padding: 20,
    gap: 8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8f877e',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  welcomeHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f1ea',
    lineHeight: 24,
  },
  welcomeHeroDesc: {
    fontSize: 12,
    color: '#cfc6ba',
    lineHeight: 18,
    opacity: 0.8,
  },
  actionSection: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  actionSub: {
    fontSize: 11,
    color: '#8f877e',
  },
  featuredCard: {
    marginHorizontal: 24,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featuredImageContainer: {
    height: 220,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  featuredBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sparkleIcon: {
    marginRight: 4,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f5f1ea',
    letterSpacing: 1,
  },
  featuredBody: {
    padding: 20,
    gap: 10,
  },
  featuredMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredCaption: {
    fontSize: 18,
    fontWeight: '500',
    color: '#f5f1ea',
    lineHeight: 26,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  moodPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 11,
    color: '#cfc6ba',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f1ea',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  playIcon: {
    marginRight: 2,
  },
  listenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#080807',
  },
  connectionsSection: {
    gap: 12,
  },
  connectionsScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  connItem: {
    alignItems: 'center',
    gap: 8,
  },
  avatarBorder: {
    padding: 2,
    borderRadius: 50,
  },
  connName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f5f1ea',
  },
  emptyText: {
    fontSize: 12,
    color: '#8f877e',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  recentSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cfc6ba',
  },
  recentScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  photoItem: {
    width: 140,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(8, 8, 7, 0.65)',
  },
  photoCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  photoAuthor: {
    fontSize: 8,
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
