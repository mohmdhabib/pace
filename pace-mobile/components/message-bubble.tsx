import React from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { Calendar, Users, Layers, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import VoicePlayer from '@/components/voice-player';

interface MessageBubbleProps {
  message: {
    id: string;
    type: string;
    content: string;
    media_url?: string | null;
    reference_memory?: {
      id: string;
      type: string;
      caption: string;
      image: string;
      date: string;
      author: string;
      pace_title: string;
    } | null;
    reference_pace?: {
      id: string;
      title: string;
      cover: string;
      mood: string;
      members: string[];
      memoriesCount: number;
    } | null;
  };
  isMe: boolean;
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const router = useRouter();
  const { type, content, reference_memory, reference_pace } = message;

  // Text Bubble
  if (type === 'text') {
    return (
      <View
        style={[
          styles.textBubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
          {
            borderColor: isMe ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            borderBottomRightRadius: isMe ? 4 : 20,
            borderBottomLeftRadius: isMe ? 20 : 4,
          },
        ]}
      >
        <ThemedText style={[styles.textBubbleContent, { color: isMe ? '#f5f1ea' : '#cfc6ba' }]}>
          {content}
        </ThemedText>
      </View>
    );
  }

  // Voice Bubble
  if (type === 'voice' && message.media_url) {
    return (
      <View style={[styles.voiceBubble, isMe ? styles.alignMe : styles.alignThem]}>
        <VoicePlayer url={message.media_url} />
      </View>
    );
  }

  // Memory Card Bubble
  if (type === 'memory_card' && reference_memory) {
    return (
      <View style={[styles.cardBubble, { borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: '#121110' }]}>
        {reference_memory.image && (
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: reference_memory.image }} style={styles.cardImage} />
            <View style={styles.cardImageOverlay} />
          </View>
        )}
        <View style={styles.cardBody}>
          <ThemedText style={styles.cardCaption}>"{reference_memory.caption}"</ThemedText>
          
          <View style={[styles.cardMetaRow, { borderTopColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.cardMetaItem}>
              <Layers size={10} color="#8f877e" />
              <ThemedText style={styles.cardMetaText}>{reference_memory.pace_title}</ThemedText>
            </View>
            <View style={styles.cardMetaItem}>
              <Calendar size={10} color="#8f877e" />
              <ThemedText style={styles.cardMetaText}>{reference_memory.date}</ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Pace Card Bubble
  if (type === 'pace_card' && reference_pace) {
    return (
      <Pressable
        onPress={() => router.push(`/pace/${reference_pace.id}` as any)}
        style={({ pressed }) => [
          styles.cardBubble,
          {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: '#121110',
            opacity: pressed ? 0.95 : 1,
          },
        ]}
      >
        <View style={styles.paceCardCover}>
          <Image source={{ uri: reference_pace.cover }} style={styles.cardImage} />
          <View style={styles.cardImageOverlay} />
          <View style={styles.paceCardTitleWrap}>
            <ThemedText style={styles.paceCardTitle} numberOfLines={1}>
              {reference_pace.title}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.paceCardBody}>
          <View style={styles.paceCardStats}>
            <View style={styles.cardMetaItem}>
              <Users size={12} color="#8f877e" />
              <ThemedText style={styles.cardMetaText}>
                {reference_pace.members?.length || 2} members
              </ThemedText>
            </View>
            <ThemedText style={styles.paceCardMemsText}>
              {reference_pace.memoriesCount || 0} memories
            </ThemedText>
          </View>

          <View style={styles.openPaceAction}>
            <ThemedText style={styles.openPaceText}>Open</ThemedText>
            <ExternalLink size={10} color="#f5f1ea" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.textBubble, styles.bubbleThem]}>
      <ThemedText style={styles.textBubbleContent}>Unsupported message format.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  textBubble: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: 'rgba(143, 107, 103, 0.15)', // transparent wine color matching isMe
  },
  bubbleThem: {
    backgroundColor: 'rgba(25, 24, 22, 0.85)',
  },
  textBubbleContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  voiceBubble: {
    width: 240,
  },
  alignMe: {
    alignSelf: 'flex-end',
  },
  alignThem: {
    alignSelf: 'flex-start',
  },
  cardBubble: {
    width: 250,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 140,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 7, 0.25)',
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },
  cardCaption: {
    fontSize: 14,
    lineHeight: 18,
    color: '#f5f1ea',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
  },
  paceCardCover: {
    height: 80,
    position: 'relative',
  },
  paceCardTitleWrap: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  paceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  paceCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  paceCardStats: {
    gap: 2,
  },
  paceCardMemsText: {
    fontSize: 10,
    color: 'rgba(207, 198, 186, 0.5)',
  },
  openPaceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openPaceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f5f1ea',
  },
});
