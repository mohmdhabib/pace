import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Image, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquarePlus, Users, MessageCircle, Layers, ArrowRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import { fetchConversations } from '@/lib/apis';

export default function ChatsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const data = await fetchConversations();
      setConversations(data || []);
    } catch (err) {
      console.warn("Failed to load conversations:", err);
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

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  const directChats = conversations.filter((c) => c.type === 'direct');
  const groupChats = conversations.filter((c) => c.type === 'pace_group');
  const isEmpty = conversations.length === 0;

  const renderChatCard = (chat: any) => {
    return (
      <Pressable
        key={chat.id}
        onPress={() => router.push(`/chat/${chat.id}` as any)}
        style={({ pressed }) => [
          styles.chatCard,
          {
            borderBottomColor: 'rgba(255, 255, 255, 0.05)',
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          },
        ]}
      >
        <View style={styles.chatCardContent}>
          {/* Avatar / Status */}
          <Avatar src={chat.avatar} name={chat.title} online={chat.online} size="md" />

          {/* Details */}
          <div style={styles.chatDetails}>
            <div style={styles.chatMetaHeader}>
              <ThemedText style={styles.chatTitle} numberOfLines={1}>
                {chat.title}
              </ThemedText>
              <ThemedText style={styles.chatTimestamp}>{chat.timestamp}</ThemedText>
            </div>
            
            <ThemedText style={styles.chatLastMessage} numberOfLines={1}>
              {chat.lastMessage}
            </ThemedText>
            
            <ThemedText style={styles.chatStats}>{chat.stats}</ThemedText>
          </div>
        </View>

        {/* Action / Badges */}
        <View style={styles.chatRightSection}>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadBadgeText}>{chat.unreadCount}</ThemedText>
            </View>
          )}

          {chat.recentMemoryImage ? (
            <Image source={{ uri: chat.recentMemoryImage }} style={styles.thumbImage} />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)' }]}>
              {chat.type === 'pace_group' ? (
                <Users size={12} color="#8f877e" />
              ) : (
                <MessageCircle size={12} color="#8f877e" />
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLabelRow}>
            <View style={styles.headerDot} />
            <ThemedText style={styles.headerLabel}>INBOX</ThemedText>
          </View>
          <ThemedText style={styles.title}>Chats</ThemedText>
        </View>

        {isEmpty ? (
          /* Premium Empty State */
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
            }
          >
            <View style={styles.emptyIconCluster}>
              <View style={[styles.glowRing, { backgroundColor: 'rgba(210, 197, 177, 0.04)' }]} />
              <View style={[styles.innerRing, { backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }]} />
              
              <View style={[styles.floatIconLeft, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Users size={12} color="#8f877e" />
              </View>
              <View style={[styles.floatIconRight, { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <MessageCircle size={10} color="#8f877e" />
              </View>
              
              <View style={styles.centerIconWrap}>
                <MessageSquarePlus size={20} color="#f5f1ea" />
              </View>
            </View>

            <ThemedText style={styles.emptyTitle}>Your first conversation starts with a Pace</ThemedText>
            <ThemedText style={styles.emptyDesc}>
              Create a Pace and invite a friend — your group chat appears here automatically.
            </ThemedText>

            <View style={styles.emptyActions}>
              <Pressable
                onPress={() => router.push('/modals/create-pace' as any)}
                style={({ pressed }) => [
                  styles.emptyPrimaryBtn,
                  {
                    backgroundColor: '#f5f1ea',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <Layers size={14} color="#080807" style={styles.btnIcon} />
                <ThemedText style={styles.emptyPrimaryBtnText}>Create a Pace</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => router.push('/modals/create-pace' as any)}
                style={({ pressed }) => [
                  styles.emptySecondaryBtn,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <MessageSquarePlus size={14} color="#f5f1ea" style={styles.btnIcon} />
                <ThemedText style={styles.emptySecondaryBtnText}>Start a Chat</ThemedText>
              </Pressable>
            </View>

            <View style={styles.emptyHintRow}>
              <ArrowRight size={10} color="#8f877e" style={styles.hintArrow} />
              <ThemedText style={styles.emptyHintText}>
                Group chats are created automatically when you invite someone
              </ThemedText>
            </View>
          </ScrollView>
        ) : (
          /* Chats List */
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
            }
          >
            {/* Direct Messages Section */}
            {directChats.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionHeader}>Direct Messages</ThemedText>
                <View style={styles.cardList}>{directChats.map(renderChatCard)}</View>
              </View>
            )}

            {/* Pace Groups Section */}
            {groupChats.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionHeader}>Pace Groups</ThemedText>
                <View style={styles.cardList}>{groupChats.map(renderChatCard)}</View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating Create Chat Button */}
        {!isEmpty && (
          <View style={styles.floatingContainer}>
            <Pressable
              onPress={() => router.push('/modals/create-pace' as any)}
              style={({ pressed }) => [
                styles.floatingBtn,
                {
                  backgroundColor: '#f5f1ea',
                  opacity: pressed ? 0.9 : 1
                }
              ]}
            >
              <MessageSquarePlus size={16} color="#080807" style={styles.btnIcon} />
              <ThemedText style={styles.floatingBtnText}>New Chat</ThemedText>
            </Pressable>
          </View>
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
  headerDot: {
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
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIconCluster: {
    width: 96,
    height: 96,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
  },
  innerRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  floatIconLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatIconRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f1ea',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#8f877e',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
  },
  emptyActions: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  emptyPrimaryBtn: {
    width: '100%',
    maxWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080807',
  },
  emptySecondaryBtn: {
    width: '100%',
    maxWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 20,
  },
  emptySecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  btnIcon: {
    marginRight: 6,
  },
  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
    paddingHorizontal: 8,
  },
  hintArrow: {
    marginTop: 1,
  },
  emptyHintText: {
    fontSize: 10,
    color: '#8f877e',
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
    marginBottom: 4,
  },
  cardList: {
    flexDirection: 'column',
  },
  chatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },
  chatCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  chatDetails: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chatMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    width: '100%',
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5f1ea',
    flex: 1,
  },
  chatTimestamp: {
    fontSize: 10,
    color: '#8f877e',
    marginLeft: 8,
  },
  chatLastMessage: {
    fontSize: 13,
    color: '#8f877e',
    marginTop: 2,
    width: '100%',
  },
  chatStats: {
    fontSize: 10,
    color: 'rgba(207, 198, 186, 0.5)',
    marginTop: 4,
  },
  chatRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#080807',
  },
  thumbImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
