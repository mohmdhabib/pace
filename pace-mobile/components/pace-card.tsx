import React from 'react';
import { StyleSheet, View, Image, Pressable, Dimensions } from 'react-native';
import { Users } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { themeByMood } from '@/lib/apis';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface PaceCardProps {
  pace: {
    id: string;
    title: string;
    mood: string;
    members: string[];
    last: string;
    snippet: string;
    cover: string;
    collage: string[];
    archivedAt?: string | null;
  };
  onOpen: () => void;
  isArchived?: boolean;
}

export default function PaceCard({ pace, onOpen, isArchived = false }: PaceCardProps) {
  // Extract up to 3 photos from the pace's collage array (excluding the primary cover image at index 0)
  const memoriesPhotos = pace.collage ? pace.collage.slice(1, 4) : [];
  
  // Get mood color palette
  const moodMood = (pace.mood || 'soft') as keyof typeof themeByMood;
  const moodColors = themeByMood[moodMood] || themeByMood.soft;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: isArchived ? 'rgba(143, 107, 103, 0.2)' : 'rgba(255, 255, 255, 0.08)',
          backgroundColor: isArchived ? 'rgba(18, 10, 9, 0.55)' : 'rgba(255, 255, 255, 0.04)',
          opacity: pressed ? 0.95 : isArchived ? 0.75 : 1,
        },
      ]}
    >
      {/* Background Image */}
      <Image source={{ uri: pace.cover }} style={styles.backgroundImage} />

      {/* Mood Overlay Color layers */}
      <View style={[styles.moodOverlay, { backgroundColor: moodColors[0] }]} />
      <View style={[styles.moodOverlay, { backgroundColor: moodColors[1] }]} />

      {/* Contrast Overlay Gradient */}
      <View style={styles.darkBottomOverlay} />

      {/* Polaroid Collage Stack */}
      {memoriesPhotos.length > 0 && (
        <View style={styles.polaroidStack}>
          {memoriesPhotos.map((imgUrl, i) => {
            const rot = i === 0 ? '-8deg' : i === 1 ? '6deg' : '-2deg';
            const transX = i === 0 ? -24 : i === 1 ? 24 : 0;
            const transY = i === 2 ? 8 : 0;
            const scale = i === 0 ? 0.9 : i === 1 ? 0.95 : 0.8;
            const zIndex = i === 0 ? 10 : i === 1 ? 20 : 0;
            const opacity = i === 2 ? 0.45 : 1;

            return (
              <View
                key={imgUrl}
                style={[
                  styles.polaroidFrame,
                  {
                    transform: [
                      { rotate: rot },
                      { translateX: transX },
                      { translateY: transY },
                      { scale: scale },
                    ],
                    zIndex,
                    opacity,
                  },
                ]}
              >
                <Image source={{ uri: imgUrl }} style={styles.polaroidImage} />
              </View>
            );
          })}
        </View>
      )}

      {/* Header Badges */}
      {isArchived && (
        <View style={styles.archivedBadge}>
          <ThemedText style={styles.archivedBadgeText}>Archived Era</ThemedText>
        </View>
      )}

      <View style={styles.lastUpdatedBadge}>
        <ThemedText style={styles.lastUpdatedText}>{pace.last}</ThemedText>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Members Initials Row */}
        <View style={styles.membersRow}>
          {pace.members.slice(0, 4).map((member, index) => {
            const char = member ? member[0] : 'F';
            const offset = index % 2 ? 4 : 0;
            return (
              <View
                key={`${member}-${index}`}
                style={[
                  styles.memberAvatarCircle,
                  {
                    transform: [{ translateY: offset }],
                  },
                ]}
              >
                <ThemedText style={styles.memberChar}>{char}</ThemedText>
              </View>
            );
          })}
        </View>

        {/* Title */}
        <ThemedText style={styles.title} numberOfLines={1}>
          {pace.title}
        </ThemedText>

        {/* Snippet */}
        <ThemedText style={styles.snippet} numberOfLines={2}>
          {pace.snippet}
        </ThemedText>

        {/* Footer */}
        <View style={styles.footerRow}>
          {/* Mood Badge */}
          <View style={styles.moodBadge}>
            <ThemedText style={styles.moodText}>{pace.mood}</ThemedText>
          </View>

          {/* Members count */}
          <View style={styles.membersCountRow}>
            <Users size={12} color="#cfc6ba" />
            <ThemedText style={styles.membersCountText}>{pace.members.length}</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 480,
    width: CARD_WIDTH,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  moodOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Simulated dark gradient using opacity
  },
  polaroidStack: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  polaroidFrame: {
    position: 'absolute',
    width: 104,
    height: 104,
    backgroundColor: '#ffffff',
    padding: 4,
    paddingBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  archivedBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: 'rgba(143, 107, 103, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(143, 107, 103, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  archivedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#8f6b67', // pace-wine color
    letterSpacing: 1,
  },
  lastUpdatedBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: '#cfc6ba',
  },
  contentArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    gap: 12,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    marginBottom: 4,
  },
  memberAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f1ea', // pace-pearl
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  memberChar: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10100f',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f5f1ea',
    letterSpacing: -0.5,
  },
  snippet: {
    fontSize: 13,
    color: '#cfc6ba',
    lineHeight: 18,
    opacity: 0.85,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  moodBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 11,
    color: '#cfc6ba',
    textTransform: 'lowercase',
  },
  membersCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersCountText: {
    fontSize: 12,
    color: '#cfc6ba',
  },
});
