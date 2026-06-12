import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Image, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Info, Send, Paperclip, Image as ImageIcon, Mic, Layers, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import MessageBubble from '@/components/message-bubble';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchConversations,
  fetchPaces,
  fetchMemories,
  subscribeToMessages,
  sendMessage
} from '@/lib/apis';
import * as mock from '@/constants/mockData';

export default function ChatThreadScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<any>(null);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('me');

  // Picker drawers toggles
  const [showAttachments, setShowAttachments] = useState(false);
  const [showMemoryPicker, setShowMemoryPicker] = useState(false);
  const [showPacePicker, setShowPacePicker] = useState(false);
  
  // Scaffolding attachables list
  const [allPaces, setAllPaces] = useState<any[]>([]);
  const [allMemories, setAllMemories] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  async function loadData() {
    if (!convId) return;
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
      }

      // Load conversation meta
      const conversations = await fetchConversations();
      const matchedConv = conversations.find((c: any) => c.id === convId);
      setConversation(matchedConv || null);

      if (matchedConv) {
        // Load messages from local mock or database
        if (!isSupabaseConfigured || !supabase) {
          setMessagesList(mock.mockMessages[matchedConv.id] || []);
        } else {
          // Live fetches are handled by subscribeToMessages or initial table fetch.
          // Since apis.ts fetchConversations loads everything, we can populate initial messages
          // by querying conversation messages
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id, conversation_id, sender_id, type, content, media_url, created_at,
              profiles:sender_id(display_name, avatar_url)
            `)
            .eq('conversation_id', matchedConv.id)
            .order('created_at', { ascending: true });

          if (!error && data) {
            setMessagesList(data.map((msg: any) => ({
              id: msg.id,
              type: msg.type,
              sender_id: msg.sender_id,
              sender_name: msg.profiles?.display_name || 'Friend',
              sender_avatar: msg.profiles?.avatar_url,
              content: msg.content,
              media_url: msg.media_url,
              created_at: msg.created_at
            })));
          }
        }

        // Pre-fetch attaching lists
        const pData = await fetchPaces();
        setAllPaces(pData || []);
        
        // Grab recent memories
        if (pData && pData.length > 0) {
          const mData = await fetchMemories(pData[0].id);
          setAllMemories(mData || []);
        }
      }
    } catch (err) {
      console.warn("Failed to load conversation messages list:", err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  useEffect(() => {
    loadData();

    if (isSupabaseConfigured && supabase && convId) {
      // Connect real-time socket
      const unsubscribe = subscribeToMessages(convId, (newMsg: any) => {
        setMessagesList((prev) => {
          // Avoid duplicating inserts
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return updated;
        });
      });

      return () => unsubscribe();
    }
  }, [convId]);

  const handleSend = async (contentText: string, msgType = 'text', extra = {}) => {
    const txt = contentText.trim();
    if (!txt && msgType === 'text') return;

    try {
      if (!isSupabaseConfigured || !supabase || !convId) {
        // Fallback local messaging
        const mockNew = {
          id: `local-msg-${Date.now()}`,
          sender_id: 'me',
          sender_name: 'Me',
          type: msgType,
          content: msgType === 'text' ? txt : (msgType === 'voice' ? 'Voice note' : txt),
          created_at: new Date().toISOString(),
          ...extra
        };
        setMessagesList((prev) => [...prev, mockNew]);
        setInputText('');
        setShowAttachments(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
        return;
      }

      await sendMessage({
        conversationId: convId,
        type: msgType,
        content: msgType === 'text' ? txt : (msgType === 'voice' ? 'Sent a voice note' : txt),
        ...extra
      });

      setInputText('');
      setShowAttachments(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err) {
      console.warn("Failed to send message:", err);
    }
  };

  const handleAttachMemory = (memory: any) => {
    handleSend(memory.caption, 'memory_card', {
      reference_memory_id: memory.id,
      reference_memory: {
        id: memory.id,
        type: memory.type || 'photo',
        author: memory.author,
        date: memory.date,
        caption: memory.caption,
        image: memory.image,
        pace_title: memory.pace_title || 'Pace Moment'
      }
    });
    setShowMemoryPicker(false);
  };

  const handleAttachPace = (paceItem: any) => {
    handleSend(paceItem.title, 'pace_card', {
      reference_pace_id: paceItem.id,
      reference_pace: {
        id: paceItem.id,
        title: paceItem.title,
        members: paceItem.members,
        memoriesCount: 12,
        cover: paceItem.cover
      }
    });
    setShowPacePicker(false);
  };

  const handleSimulateVoiceNote = () => {
    handleSend('Voice note', 'voice', {
      media_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    });
    setShowAttachments(false);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  if (!conversation) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ThemedText style={styles.errorText}>Conversation room not found.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <ThemedText style={styles.backLinkText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.circleBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <ChevronLeft size={20} color="#f5f1ea" />
              </Pressable>

              <Pressable
                onPress={() => conversation.userId && router.push(`/relationship/${conversation.userId}` as any)}
                style={styles.convHeaderTrigger}
              >
                <Avatar src={conversation.avatar} name={conversation.title} size="sm" />
                <View style={styles.convInfo}>
                  <ThemedText style={styles.convTitle}>{conversation.title}</ThemedText>
                  <ThemedText style={styles.convStats}>{conversation.stats}</ThemedText>
                </View>
              </Pressable>
            </View>

            <Pressable
              onPress={() => conversation.userId && router.push(`/relationship/${conversation.userId}` as any)}
              style={({ pressed }) => [styles.circleBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Info size={16} color="#f5f1ea" />
            </Pressable>
          </View>

          {/* Messages scroll list */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messagesList.length === 0 ? (
              <ThemedText style={styles.emptyText}>
                No messages yet. Send a note or attach memories below.
              </ThemedText>
            ) : (
              messagesList.map((msg, index) => {
                const isMe = msg.sender_id === currentUserId || msg.sender_id === 'me';
                const prev = messagesList[index - 1];
                const next = messagesList[index + 1];

                const firstInGroup = !prev || prev.sender_id !== msg.sender_id;
                const lastInGroup = !next || next.sender_id !== msg.sender_id;

                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.messageRow,
                      isMe ? styles.rowMe : styles.rowThem,
                      firstInGroup ? styles.mtGroupFirst : styles.mtGroupInner,
                    ]}
                  >
                    {/* Other user avatar columns */}
                    {!isMe && (
                      <View style={styles.avatarCol}>
                        {lastInGroup ? (
                          <Avatar src={msg.sender_avatar} name={msg.sender_name} size="sm" />
                        ) : (
                          <View style={styles.avatarSpacer} />
                        )}
                      </View>
                    )}

                    <View style={styles.bubbleCol}>
                      {!isMe && firstInGroup && conversation.type === 'pace_group' && (
                        <ThemedText style={styles.senderNameLabel}>{msg.sender_name}</ThemedText>
                      )}

                      <MessageBubble message={msg} isMe={isMe} />

                      {lastInGroup && (
                        <ThemedText style={[styles.timeLabel, isMe ? styles.textAlignRight : styles.textAlignLeft]}>
                          {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Composer Box */}
          <View style={[styles.composerContainer, { borderTopColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(8, 8, 7, 0.95)' }]}>
            <View style={styles.composerRow}>
              {/* Attachment link trigger */}
              <Pressable
                onPress={() => setShowAttachments(!showAttachments)}
                style={[
                  styles.attachTriggerBtn,
                  {
                    backgroundColor: showAttachments ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.08)'
                  }
                ]}
              >
                <Paperclip size={18} color="#f5f1ea" />
              </Pressable>

              {/* Text input composer */}
              <View style={styles.inputComposerWrap}>
                <TextInput
                  style={[styles.composerInput, { color: activeColors.text }]}
                  placeholder="Send a memory-aware note..."
                  placeholderTextColor="#8f877e"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                
                <Pressable
                  onPress={() => handleSend(inputText)}
                  disabled={!inputText.trim()}
                  style={[styles.sendSubmitBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
                >
                  <Send size={14} color="#080807" />
                </Pressable>
              </View>
            </View>

            {/* Attachments drawer */}
            {showAttachments && (
              <View style={[styles.attachmentsDrawer, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: '#121110' }]}>
                <Pressable onPress={() => { setShowMemoryPicker(true); setShowAttachments(false); }} style={styles.drawerItem}>
                  <View style={[styles.drawerIconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.25)' }]}>
                    <ImageIcon size={18} color="#fbbf24" />
                  </View>
                  <ThemedText style={styles.drawerItemText}>Share Memory</ThemedText>
                </Pressable>

                <Pressable onPress={() => { setShowPacePicker(true); setShowAttachments(false); }} style={styles.drawerItem}>
                  <View style={[styles.drawerIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
                    <Layers size={18} color="#3b82f6" />
                  </View>
                  <ThemedText style={styles.drawerItemText}>Share Pace</ThemedText>
                </Pressable>

                <Pressable onPress={handleSimulateVoiceNote} style={styles.drawerItem}>
                  <View style={[styles.drawerIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                    <Mic size={18} color="#ef4444" />
                  </View>
                  <ThemedText style={styles.drawerItemText}>Voice Note</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Modal select portals */}
          {showMemoryPicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerPanel}>
                <View style={styles.pickerHeader}>
                  <ThemedText style={styles.pickerTitle}>Share a Memory</ThemedText>
                  <Pressable onPress={() => setShowMemoryPicker(false)} style={styles.pickerClose}>
                    <X size={16} color="#8f877e" />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.pickerScroll}>
                  {allMemories.map((mem) => (
                    <Pressable
                      key={mem.id}
                      onPress={() => handleAttachMemory(mem)}
                      style={styles.pickerCardItem}
                    >
                      {mem.image ? (
                        <Image source={{ uri: mem.image }} style={styles.pickerCardThumb} />
                      ) : (
                        <View style={styles.pickerCardPlaceholder}>
                          <Mic size={14} color="#8f877e" />
                        </View>
                      )}
                      <View style={styles.pickerCardInfo}>
                        <ThemedText style={styles.pickerCardCaption} numberOfLines={1}>
                          "{mem.caption}"
                        </ThemedText>
                        <ThemedText style={styles.pickerCardAuthor}>
                          {mem.author} • {mem.date}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {showPacePicker && (
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerPanel}>
                <View style={styles.pickerHeader}>
                  <ThemedText style={styles.pickerTitle}>Share a Pace</ThemedText>
                  <Pressable onPress={() => setShowPacePicker(false)} style={styles.pickerClose}>
                    <X size={16} color="#8f877e" />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.pickerScroll}>
                  {allPaces.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => handleAttachPace(p)}
                      style={styles.pickerCardItem}
                    >
                      <Image source={{ uri: p.cover }} style={styles.pickerPaceCover} />
                      <View style={styles.pickerCardInfo}>
                        <ThemedText style={styles.pickerCardTitleText} numberOfLines={1}>
                          {p.title}
                        </ThemedText>
                        <ThemedText style={styles.pickerCardAuthor}>
                          {p.members?.length || 2} members • {p.mood}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convHeaderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  convInfo: {
    gap: 2,
  },
  convTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  convStats: {
    fontSize: 10,
    color: '#8f877e',
  },
  messagesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyText: {
    fontSize: 13,
    color: '#8f877e',
    textAlign: 'center',
    marginTop: 48,
    fontStyle: 'italic',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowThem: {
    justifyContent: 'flex-start',
  },
  mtGroupFirst: {
    marginTop: 16,
  },
  mtGroupInner: {
    marginTop: 4,
  },
  avatarCol: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarSpacer: {
    width: 28,
  },
  bubbleCol: {
    maxWidth: '78%',
    gap: 4,
  },
  senderNameLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(207, 198, 186, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    paddingLeft: 4,
  },
  timeLabel: {
    fontSize: 8,
    color: 'rgba(143, 135, 126, 0.4)',
    marginTop: 2,
    paddingHorizontal: 6,
  },
  textAlignRight: {
    textAlign: 'right',
  },
  textAlignLeft: {
    textAlign: 'left',
  },
  composerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputComposerWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendSubmitBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  attachmentsDrawer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 12,
    marginTop: 12,
  },
  drawerItem: {
    alignItems: 'center',
    gap: 6,
  },
  drawerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cfc6ba',
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 7, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  pickerPanel: {
    backgroundColor: '#121110',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    padding: 20,
    gap: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  pickerClose: {
    padding: 4,
  },
  pickerScroll: {
    gap: 10,
    paddingBottom: 24,
  },
  pickerCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 8,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  pickerCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  pickerPaceCover: {
    width: 64,
    height: 44,
    borderRadius: 8,
  },
  pickerCardPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCardInfo: {
    flex: 1,
    gap: 2,
  },
  pickerCardCaption: {
    fontSize: 14,
    color: '#f5f1ea',
  },
  pickerCardTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  pickerCardAuthor: {
    fontSize: 10,
    color: '#8f877e',
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
