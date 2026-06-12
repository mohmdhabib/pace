import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Image, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Camera, Settings, Users, Lock, Sparkles, ImagePlus, Play, Bot } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchPaces, fetchMemories, themeByMood } from '@/lib/apis';
import VoicePlayer from '@/components/voice-player';
import * as mock from '@/constants/mockData';

export default function PaceTimelineScreen() {
  const { id: paceId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pace, setPace] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, any[]>>({});

  async function loadData() {
    if (!paceId) return;
    try {
      const allPaces = await fetchPaces();
      const selectedPace = allPaces.find((p: any) => p.id === paceId);
      setPace(selectedPace || null);

      if (selectedPace) {
        const mData = await fetchMemories(selectedPace.id);
        setMemories(mData || []);
        
        // Merge mock reactions if offline
        const mockReacts = mock.mockReactions || {};
        setReactions(mockReacts);
      }
    } catch (err) {
      console.warn("Failed to load pace timeline details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [paceId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleReaction = (memoryId: string, emoji: string) => {
    setReactions((prev) => {
      const current = prev[memoryId] || [];
      const hasReacted = current.some((r) => r.user_id === 'me' && r.emoji === emoji);

      let next;
      if (hasReacted) {
        next = current.filter((r) => !(r.user_id === 'me' && r.emoji === emoji));
      } else {
        next = [...current, { user_id: 'me', user_name: 'Me', emoji }];
      }
      return {
        ...prev,
        [memoryId]: next
      };
    });
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  if (!pace) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ThemedText style={styles.errorText}>Pace not found.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <ThemedText style={styles.backLinkText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const moodMood = (pace.mood || 'soft') as keyof typeof themeByMood;
  const moodColors = themeByMood[moodMood] || themeByMood.soft;

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f5f1ea" />
        }
      >
        {/* Parallax / Hero Cover */}
        <View style={styles.coverSection}>
          <Image source={{ uri: pace.cover }} style={styles.coverImage} />
          <View style={[styles.coverOverlayColor, { backgroundColor: moodColors[0] }]} />
          <View style={styles.darkBottomOverlay} />

          {/* Navigation Controls */}
          <SafeAreaView style={styles.navRow} edges={['top']}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navCircleBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <ChevronLeft size={20} color="#f5f1ea" />
            </Pressable>

            <View style={styles.navRight}>
              <Pressable
                onPress={() => router.push('/camera' as any)}
                style={({ pressed }) => [styles.navCircleBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Camera size={16} color="#f5f1ea" />
              </Pressable>

              <Pressable
                onPress={() => router.push('/modals/create-pace' as any)} // For settings triggers
                style={({ pressed }) => [styles.navCircleBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Settings size={16} color="#f5f1ea" />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.navCircleBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Lock size={16} color="#f5f1ea" />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Space metadata pinned to cover bottom */}
          <View style={styles.metadataPanel}>
            <ThemedText style={styles.moodLabel}>{pace.mood}</ThemedText>
            <ThemedText style={styles.paceTitle}>{pace.title}</ThemedText>
            <View style={styles.membersSummaryRow}>
              <Users size={12} color="#cfc6ba" style={styles.usersIcon} />
              <ThemedText style={styles.membersSummaryText}>
                {Array.isArray(pace.members) ? pace.members.join(', ') : pace.members}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Timeline Timeline body */}
        <View style={styles.timelineBody}>
          {/* AI Recap Card */}
          {memories.length > 0 && (
            <View style={[styles.aiRecapCard, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
              <View style={styles.aiRecapHeader}>
                <Bot size={14} color="#f5f1ea" />
                <ThemedText style={styles.aiRecapTitle}>AI RECAP</ThemedText>
              </View>
              <ThemedText style={styles.aiRecapText}>
                This era felt chaotic, nostalgic, and beautiful. Your most active month was April.
              </ThemedText>
            </View>
          )}

          {/* Memories Stream */}
          {memories.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <ImagePlus size={24} color="#8f877e" />
              </View>
              <ThemedText style={styles.emptyTitle}>No memories yet</ThemedText>
              <ThemedText style={styles.emptyDesc}>
                Be the first to capture this era. Drop a photo, voice note, or text quote.
              </ThemedText>

              <Pressable
                onPress={() => router.push('/modals/add-memory' as any)}
                style={({ pressed }) => [
                  styles.emptyAddBtn,
                  {
                    backgroundColor: '#f5f1ea',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <ImagePlus size={14} color="#080807" style={styles.btnIcon} />
                <ThemedText style={styles.emptyAddBtnText}>Add Memory</ThemedText>
              </Pressable>
            </View>
          ) : (
            /* Vertical List of Polaroids and Note cards */
            <View style={styles.memoriesFeed}>
              {memories.map((mem, index) => {
                const alignLeft = index % 2 === 0;
                const memReacts = reactions[mem.id] || [];

                return (
                  <View
                    key={mem.id}
                    style={[
                      styles.memoryContainer,
                      alignLeft ? styles.memoryAlignLeft : styles.memoryAlignRight,
                    ]}
                  >
                    {/* Timestamp banner */}
                    <View style={styles.memoryTimestampRow}>
                      <ThemedText style={styles.memoryDate}>{mem.date}</ThemedText>
                      <ThemedText style={styles.memoryTime}>{mem.time}</ThemedText>
                    </View>

                    {/* Polaroid body */}
                    <View style={[styles.polaroidCard, { backgroundColor: '#f4eee3' }]}>
                      {mem.type === 'photo' && (
                        <Image source={{ uri: mem.image }} style={styles.polaroidPhoto} />
                      )}

                      {mem.type === 'voice' && (
                        <View style={styles.audioWrapper}>
                          <VoicePlayer url={mem.mediaUrl} />
                        </View>
                      )}

                      {mem.type === 'text' && (
                        <View style={styles.textQuoteBox}>
                          <ThemedText style={styles.quoteText}>"{mem.caption}"</ThemedText>
                        </View>
                      )}

                      {/* Caption for files */}
                      {mem.type !== 'text' && mem.caption ? (
                        <ThemedText style={styles.polaroidCaption}>{mem.caption}</ThemedText>
                      ) : null}
                    </View>

                    {/* Reactions Pill box */}
                    <View style={styles.reactionsBox}>
                      <View style={styles.reactionsRow}>
                        {['❤️‍🔥', '🥹', '🫂', '✨', '🔥'].map((emoji) => {
                          const userHasReacted = memReacts.some((r) => r.user_id === 'me' && r.emoji === emoji);
                          return (
                            <Pressable
                              key={emoji}
                              onPress={() => handleToggleReaction(mem.id, emoji)}
                              style={[
                                styles.reactEmojiBtn,
                                userHasReacted && styles.reactEmojiBtnActive,
                              ]}
                            >
                              <ThemedText style={styles.reactEmojiChar}>{emoji}</ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>
                      
                      {memReacts.length > 0 && (
                        <ThemedText style={styles.reactedSummary}>
                          {memReacts.map((r) => (r.user_id === 'me' ? 'You' : r.user_name)).join(', ')} reacted
                        </ThemedText>
                      )}
                    </View>

                    {/* Author block */}
                    <ThemedText style={styles.memoryAuthor}>
                      {mem.author} • {mem.mood}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Memory Trigger */}
      {memories.length > 0 && (
        <View style={styles.floatingContainer}>
          <Pressable
            onPress={() => router.push('/modals/add-memory' as any)}
            style={({ pressed }) => [
              styles.floatingBtn,
              {
                backgroundColor: '#f5f1ea',
                opacity: pressed ? 0.9 : 1
              }
            ]}
          >
            <ImagePlus size={16} color="#080807" style={styles.btnIcon} />
            <ThemedText style={styles.floatingBtnText}>Add Memory</ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  coverSection: {
    height: 300,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlayColor: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  darkBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(8, 8, 7, 0.9)', // simulated bottom dark blur gradient
  },
  navRow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 99,
  },
  navCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 8, 7, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 8,
  },
  metadataPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 6,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cfc6ba',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  paceTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f5f1ea',
  },
  membersSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  usersIcon: {
    marginTop: -1,
  },
  membersSummaryText: {
    fontSize: 12,
    color: '#cfc6ba',
  },
  timelineBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  aiRecapCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  aiRecapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiRecapTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 1.5,
  },
  aiRecapText: {
    fontSize: 14,
    color: '#cfc6ba',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#8f877e',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080807',
  },
  btnIcon: {
    marginRight: 6,
  },
  memoriesFeed: {
    gap: 32,
  },
  memoryContainer: {
    width: '88%',
    gap: 8,
  },
  memoryAlignLeft: {
    alignSelf: 'flex-start',
  },
  memoryAlignRight: {
    alignSelf: 'flex-end',
  },
  memoryTimestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  memoryDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
  },
  memoryTime: {
    fontSize: 10,
    color: '#8f877e',
  },
  polaroidCard: {
    borderRadius: 20,
    padding: 10,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  polaroidPhoto: {
    width: '100%',
    aspectRatio: 0.9,
    borderRadius: 12,
  },
  audioWrapper: {
    width: '100%',
  },
  textQuoteBox: {
    width: '100%',
    minHeight: 140,
    backgroundColor: '#191816',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f5f1ea',
    textAlign: 'center',
    lineHeight: 22,
  },
  polaroidCaption: {
    fontSize: 14,
    color: '#10100f', // ink color matching polaroids
    fontWeight: '500',
    marginTop: 10,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  reactionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactEmojiBtn: {
    padding: 4,
    borderRadius: 8,
  },
  reactEmojiBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reactEmojiChar: {
    fontSize: 14,
  },
  reactedSummary: {
    fontSize: 9,
    color: '#8f877e',
    paddingLeft: 4,
  },
  memoryAuthor: {
    fontSize: 11,
    color: '#8f877e',
    fontWeight: '600',
    paddingLeft: 4,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#080807',
  },
  errorText: {
    fontSize: 16,
    color: '#8f877e',
    marginBottom: 8,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    color: '#f5f1ea',
    textDecorationLine: 'underline',
  },
});
