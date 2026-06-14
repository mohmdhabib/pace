import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Activity, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase, isSupabaseConfigured, safeStorage } from '@/lib/supabase';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import {
  getMyTodayDrop,
  dropTodaysPulse,
  fetchTodaysFriendPulses,
  fetchPulseHistory
} from '@/lib/apis';

const PULSE_EMOJIS = [
  { emoji: "🔥", label: "on fire" },
  { emoji: "🥹", label: "emotional" },
  { emoji: "⚡", label: "electric" },
  { emoji: "🌙", label: "low key" },
  { emoji: "💫", label: "dreamy" },
  { emoji: "😶‍🌫️", label: "zoning out" },
  { emoji: "🫂", label: "need a hug" },
  { emoji: "🌊", label: "going with it" },
  { emoji: "💀", label: "dead inside" },
  { emoji: "✨", label: "glowing" },
  { emoji: "😴", label: "exhausted" },
  { emoji: "🤯", label: "overwhelmed" },
];

const MOCK_FRIEND_DROPS = [
  {
    userId: "u1",
    name: "Riya",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    emoji: "🥹",
    note: "",
    droppedAt: new Date().toISOString(),
  },
  {
    userId: "u2",
    name: "Arjun",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    emoji: "⚡",
    note: "",
    droppedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    userId: "u3",
    name: "Aadhi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    emoji: "🌙",
    note: "",
    droppedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

const MOCK_HISTORY = [
  {
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "⚡", isMe: true },
      { name: "Riya", emoji: "🔥", isMe: false },
      { name: "Arjun", emoji: "💫", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "🥹", isMe: true },
      { name: "Riya", emoji: "🌙", isMe: false },
      { name: "Arjun", emoji: "😴", isMe: false },
      { name: "Aadhi", emoji: "✨", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "🌊", isMe: true },
      { name: "Riya", emoji: "🫂", isMe: false },
    ],
  },
];

function formatHistoryDate(dateStr: string) {
  try {
    const date = new Date(dateStr + "T12:00:00");
    const diff = Math.round((Date.now() - date.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function PulseScreen() {
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [myDrop, setMyDrop] = useState<any>(null);
  const [friendDrops, setFriendDrops] = useState<any[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>(MOCK_HISTORY);
  
  // Picker state
  const [selectedEmoji, setSelectedEmoji] = useState<any>(null);
  const [dropping, setDropping] = useState(false);

  async function loadData() {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      }

      const existing = await getMyTodayDrop();
      setMyDrop(existing);

      if (existing) {
        const friends = (isSupabaseConfigured && supabase)
          ? await fetchTodaysFriendPulses()
          : MOCK_FRIEND_DROPS;
        setFriendDrops(friends || []);
      } else {
        const friends = (isSupabaseConfigured && supabase)
          ? await fetchTodaysFriendPulses()
          : MOCK_FRIEND_DROPS;
        setFriendCount(friends ? friends.length : 0);
      }

      // Fetch history if logged in
      if (isSupabaseConfigured && supabase) {
        const h = await fetchPulseHistory();
        if (h && h.length > 0) setHistory(h);
      }
    } catch (err) {
      console.warn("Failed to load pulse data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDrop = async () => {
    if (!selectedEmoji || dropping) return;
    setDropping(true);
    try {
      const drop = await dropTodaysPulse(selectedEmoji.emoji);
      setMyDrop(drop);
      
      // Dramatic pause to simulate uploading
      setTimeout(async () => {
        const friends = (isSupabaseConfigured && supabase)
          ? await fetchTodaysFriendPulses()
          : MOCK_FRIEND_DROPS;
        setFriendDrops(friends || []);
        setDropping(false);
      }, 700);
    } catch (err) {
      console.warn("Failed to drop pulse:", err);
      setDropping(false);
    }
  };

  const handleReset = async () => {
    const TODAY = new Date();
    const dateStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;
    const LS_KEY = `pace_pulse_${dateStr}`;
    await safeStorage.removeItem(LS_KEY);
    setMyDrop(null);
    setSelectedEmoji(null);
    setFriendDrops([]);
    setFriendCount(MOCK_FRIEND_DROPS.length);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLabelRow}>
              <View style={styles.pulseDot} />
              <ThemedText style={styles.headerLabel}>DAILY RITUAL</ThemedText>
            </View>
            <ThemedText style={styles.title}>Pulse</ThemedText>
          </View>

          {!myDrop ? (
            /* Picker Screen: user hasn't posted yet */
            <View style={styles.pickerSection}>
              {/* Lock card overlay (BeReal feature) */}
              <View style={[styles.lockCard, { backgroundColor: activeColors.backgroundElement }]}>
                <Lock size={16} color={activeColors.textSecondary} style={styles.lockIcon} />
                <ThemedText style={styles.lockText}>
                  {friendCount > 0
                    ? `${friendCount} ${friendCount === 1 ? "friend has" : "friends have"} dropped today. Post yours to reveal theirs.`
                    : "Post today's mood drop first. Friends' pulses reveal once yours is shared."}
                </ThemedText>
              </View>

              <View style={styles.promptWrap}>
                <ThemedText style={styles.promptTitle}>How are you feeling today?</ThemedText>
                <ThemedText style={styles.promptSub}>Pick one emoji. That{"'"}s it.</ThemedText>
              </View>

              {/* Emoji Grid */}
              <View style={styles.emojiGrid}>
                {PULSE_EMOJIS.map((item) => {
                  const isSelected = selectedEmoji?.emoji === item.emoji;
                  return (
                    <Pressable
                      key={item.emoji}
                      onPress={() => setSelectedEmoji(item)}
                      style={[
                        styles.emojiBtn,
                        {
                          borderColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.03)',
                        },
                      ]}
                    >
                      <ThemedText style={styles.emojiChar}>{item.emoji}</ThemedText>
                      <ThemedText style={[styles.emojiLabel, { color: isSelected ? '#f5f1ea' : '#8f877e' }]}>
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Confirm Trigger */}
              {selectedEmoji && (
                <View style={styles.confirmSection}>
                  <Pressable
                    onPress={handleDrop}
                    disabled={dropping}
                    style={({ pressed }) => [
                      styles.dropBtn,
                      {
                        backgroundColor: '#f5f1ea',
                        opacity: pressed || dropping ? 0.85 : 1
                      }
                    ]}
                  >
                    {dropping ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <ThemedText style={styles.dropBtnEmoji}>{selectedEmoji.emoji}</ThemedText>
                        <ThemedText style={styles.dropBtnText}>Drop my pulse</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            /* Results Screen: user posted their emoji */
            <View style={styles.resultsSection}>
              {/* My Big Emoji Bubble */}
              <View style={styles.myDropBubbleWrap}>
                <View style={[styles.myDropBubble, { borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
                  <ThemedText style={styles.myDropEmojiChar}>{myDrop.emoji}</ThemedText>
                </View>
                <ThemedText style={styles.myDropLabel}>Your pulse today</ThemedText>
              </View>

              {/* Friends Drops Title */}
              <View style={styles.resultsHeadingRow}>
                <Activity size={14} color={activeColors.textSecondary} />
                <ThemedText style={styles.resultsHeadingText}>YOUR CREW TODAY</ThemedText>
              </View>

              {/* Friends Drops Cards */}
              <View style={styles.friendsDropsList}>
                {friendDrops.length === 0 ? (
                  <View style={[styles.emptyFriendsBox, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
                    <ThemedText style={styles.emptyFriendsText}>
                      No one else has dropped yet. Check back later 👀
                    </ThemedText>
                  </View>
                ) : (
                  friendDrops.map((friend) => (
                    <View
                      key={friend.userId}
                      style={[styles.friendCard, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}
                    >
                      <View style={styles.friendLeft}>
                        <Avatar src={friend.avatar} name={friend.name} size="sm" />
                        <View style={styles.friendMeta}>
                          <ThemedText style={styles.friendName}>{friend.name}</ThemedText>
                          <ThemedText style={styles.friendTime}>
                            {new Date(friend.droppedAt).toLocaleTimeString("en", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.friendEmoji}>{friend.emoji}</ThemedText>
                    </View>
                  ))
                )}
              </View>

              {/* Mood History Collapsible Drawer */}
              <View style={styles.historySection}>
                <Pressable
                  onPress={() => setShowHistory(!showHistory)}
                  style={styles.historyHeaderToggle}
                >
                  <View style={styles.historyHeaderLeft}>
                    <RotateCcw size={14} color={activeColors.textSecondary} />
                    <ThemedText style={styles.historyHeading}>MOOD HISTORY</ThemedText>
                  </View>
                  {showHistory ? (
                    <ChevronUp size={16} color={activeColors.textSecondary} />
                  ) : (
                    <ChevronDown size={16} color={activeColors.textSecondary} />
                  )}
                </Pressable>

                {showHistory && (
                  <View style={styles.historyList}>
                    {history.map((day) => (
                      <View
                        key={day.date}
                        style={[styles.historyRow, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}
                      >
                        <ThemedText style={styles.historyDateText}>
                          {formatHistoryDate(day.date)}
                        </ThemedText>
                        <View style={styles.historyDropsRow}>
                          {day.drops.map((d: any, idx: number) => (
                            <View key={idx} style={styles.historyDropPill}>
                              <ThemedText style={styles.historyDropEmoji}>{d.emoji}</ThemedText>
                              <ThemedText style={[styles.historyDropLabel, { color: d.isMe ? '#f5f1ea' : '#8f877e' }]}>
                                {d.isMe ? 'you' : d.name.toLowerCase()}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Dev reset link */}
              <Pressable onPress={handleReset} style={styles.resetBtn}>
                <RotateCcw size={10} color="rgba(143, 135, 126, 0.5)" />
                <ThemedText style={styles.resetText}>Change today{"'"}s drop</ThemedText>
              </Pressable>
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
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f5f1ea',
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
  pickerSection: {
    paddingHorizontal: 24,
    gap: 24,
    marginTop: 8,
  },
  lockCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  lockIcon: {
    marginTop: 2,
    flexShrink: 1,
  },
  lockText: {
    flex: 1,
    fontSize: 12,
    color: '#8f877e',
    lineHeight: 18,
  },
  promptWrap: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 8,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  promptSub: {
    fontSize: 12,
    color: '#8f877e',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  emojiBtn: {
    width: '22%',
    aspectRatio: 0.9,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emojiChar: {
    fontSize: 24,
  },
  emojiLabel: {
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  confirmSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  dropBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    gap: 8,
  },
  dropBtnEmoji: {
    fontSize: 18,
  },
  dropBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  resultsSection: {
    paddingHorizontal: 24,
    gap: 24,
    marginTop: 16,
  },
  myDropBubbleWrap: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  myDropBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myDropEmojiChar: {
    fontSize: 48,
  },
  myDropLabel: {
    fontSize: 12,
    color: '#8f877e',
    fontWeight: '600',
  },
  resultsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  resultsHeadingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
  },
  friendsDropsList: {
    gap: 10,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  friendMeta: {
    gap: 2,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  friendTime: {
    fontSize: 10,
    color: '#8f877e',
  },
  friendEmoji: {
    fontSize: 26,
  },
  emptyFriendsBox: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyFriendsText: {
    fontSize: 12,
    color: '#8f877e',
    textAlign: 'center',
  },
  historySection: {
    marginTop: 12,
    gap: 16,
  },
  historyHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
  },
  historyList: {
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  historyDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8f877e',
    width: 90,
  },
  historyDropsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 10,
  },
  historyDropPill: {
    alignItems: 'center',
    gap: 2,
  },
  historyDropEmoji: {
    fontSize: 20,
  },
  historyDropLabel: {
    fontSize: 8,
    fontWeight: '500',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    gap: 6,
    padding: 8,
  },
  resetText: {
    fontSize: 10,
    color: 'rgba(143, 135, 126, 0.5)',
  },
});
