import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, Image, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Layers, Heart, Image as ImageIcon, Mic, Video, MapPin } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import Avatar from '@/components/avatar';
import { fetchRelationship, fetchPaces } from '@/lib/apis';

export default function RelationshipProfileScreen() {
  const { id: targetUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [paces, setPaces] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');

  async function loadData() {
    if (!targetUserId) return;
    try {
      const [rData, pData] = await Promise.all([
        fetchRelationship(targetUserId),
        fetchPaces()
      ]);
      setProfileData(rData || null);
      setPaces(pData || []);
    } catch (err) {
      console.warn("Failed to load relationship stats details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !profileData) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  const iconMap: Record<string, React.ReactNode> = {
    Layers: <Layers size={14} color="#8f877e" />,
    Heart: <Heart size={14} color="#8f877e" />,
    Image: <ImageIcon size={14} color="#8f877e" />,
    Mic: <Mic size={14} color="#8f877e" />,
    Video: <Video size={14} color="#8f877e" />,
    MapPin: <MapPin size={14} color="#8f877e" />
  };

  const filteredMemories = profileData.sharedMemories ? profileData.sharedMemories.filter((mem: any) => {
    if (activeFilter === 'all') return true;
    return mem.type === activeFilter;
  }) : [];

  const sharedPaces = paces.filter(
    (p) => p.members.includes(profileData.name) || p.members.includes('Me')
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.circleBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <ChevronLeft size={20} color="#f5f1ea" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>RELATIONSHIP PROFILE</ThemedText>
          <View style={styles.circleBtnPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.tint} />
          }
        >
          {/* Overlapping Avatars Hero */}
          <View style={styles.heroSection}>
            <View style={styles.overlappingAvatars}>
              <View style={[styles.avatarFrameWrap, { borderColor: '#080807', zIndex: 2 }]}>
                <Avatar src={null} name="Me" size="xl" />
              </View>
              <View style={[styles.avatarFrameWrap, { borderColor: '#080807', zIndex: 1, marginLeft: -24 }]}>
                <Avatar src={profileData.avatarUrl} name={profileData.name} size="xl" />
              </View>
            </View>
            <ThemedText style={styles.namesTitle}>Me × {profileData.name}</ThemedText>
            <ThemedText style={styles.durationSubtitle}>{profileData.friendshipDuration}</ThemedText>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {profileData.stats && profileData.stats.map((stat: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.statBox,
                  {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  },
                ]}
              >
                <View style={styles.statIconWrap}>
                  {iconMap[stat.icon] || <Layers size={14} color="#8f877e" />}
                </View>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>

          {/* Friendship Recap card */}
          {profileData.aiRecap && (
            <View style={[styles.aiRecapCard, { borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
              <View style={styles.recapHeader}>
                <Sparkles size={14} color="#fbbf24" />
                <ThemedText style={styles.recapTitle}>FRIENDSHIP RECAP</ThemedText>
              </View>
              <ThemedText style={styles.recapText}>{profileData.aiRecap.text}</ThemedText>
            </View>
          )}

          {/* Timeline */}
          {profileData.timeline && profileData.timeline.length > 0 && (
            <View style={styles.timelineSection}>
              <ThemedText style={styles.sectionHeading}>Friendship Timeline</ThemedText>
              <View style={styles.timelineTrack}>
                <View style={styles.verticalLine} />
                
                {profileData.timeline.map((item: any, idx: number) => (
                  <View key={item.id} style={styles.timelineNode}>
                    {/* Node Dot */}
                    <View style={styles.nodeDot} />

                    <View style={[styles.nodeCard, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
                      <View style={styles.nodeHeader}>
                        <ThemedText style={styles.nodeDate}>{item.date}</ThemedText>
                        <View style={styles.nodeBadge}>
                          <ThemedText style={styles.nodeBadgeText}>{item.type}</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={styles.nodeTitle}>{item.label}</ThemedText>
                      <ThemedText style={styles.nodeDetail}>{item.detail}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Shared Paces list */}
          {sharedPaces.length > 0 && (
            <View style={styles.sharedPacesSection}>
              <ThemedText style={styles.sectionHeading}>Shared Paces</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pacesScroll}>
                {sharedPaces.map((pace) => (
                  <Pressable
                    key={pace.id}
                    onPress={() => router.push(`/pace/${pace.id}` as any)}
                    style={({ pressed }) => [
                      styles.sharedPaceItem,
                      {
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        opacity: pressed ? 0.95 : 1
                      }
                    ]}
                  >
                    <Image source={{ uri: pace.cover }} style={styles.paceCoverImage} />
                    <View style={styles.paceOverlay} />
                    <View style={styles.paceTextWrap}>
                      <ThemedText style={styles.paceMoodText}>{pace.mood}</ThemedText>
                      <ThemedText style={styles.paceTitleText} numberOfLines={1}>
                        {pace.title}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Shared Gallery Section */}
          <View style={styles.gallerySection}>
            <View style={styles.galleryHeaderRow}>
              <ThemedText style={styles.sectionHeading}>Shared Gallery</ThemedText>
              <View style={styles.galleryFilters}>
                {['all', 'photo', 'voice'].map((filter) => {
                  const active = activeFilter === filter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setActiveFilter(filter)}
                      style={[
                        styles.filterBtn,
                        {
                          backgroundColor: active ? '#f5f1ea' : 'rgba(255, 255, 255, 0.04)',
                        },
                      ]}
                    >
                      <ThemedText style={[styles.filterBtnText, { color: active ? '#080807' : '#8f877e' }]}>
                        {filter}s
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Grid display */}
            <View style={styles.galleryGrid}>
              {filteredMemories.length === 0 ? (
                <ThemedText style={styles.emptyGalleryText}>No items found matching filter.</ThemedText>
              ) : (
                filteredMemories.map((mem: any) => (
                  <View
                    key={mem.id}
                    style={[styles.galleryGridItem, { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}
                  >
                    {mem.image ? (
                      <Image source={{ uri: mem.image }} style={styles.galleryThumbImage} />
                    ) : (
                      <View style={styles.galleryThumbPlaceholder}>
                        <Mic size={20} color="#8f877e" />
                      </View>
                    )}
                    <View style={styles.galleryCardInfo}>
                      <ThemedText style={styles.galleryCardCaption} numberOfLines={2}>
                        "{mem.caption}"
                      </ThemedText>
                      <View style={styles.galleryCardFooter}>
                        <ThemedText style={styles.galleryCardAuthor} numberOfLines={1}>{mem.author}</ThemedText>
                        <ThemedText style={styles.galleryCardDate}>{mem.date}</ThemedText>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
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
    paddingBottom: 80,
    gap: 28,
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
  headerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 2,
  },
  circleBtnPlaceholder: {
    width: 36,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  overlappingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrameWrap: {
    borderWidth: 4,
    borderRadius: 50,
  },
  namesTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  durationSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statBox: {
    width: '31.5%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statIconWrap: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f5f1ea',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiRecapCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recapTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 1.5,
  },
  recapText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#cfc6ba',
  },
  timelineSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  timelineTrack: {
    position: 'relative',
    paddingLeft: 24,
  },
  verticalLine: {
    position: 'absolute',
    left: 4,
    top: 6,
    bottom: 6,
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timelineNode: {
    position: 'relative',
    marginBottom: 16,
  },
  nodeDot: {
    position: 'absolute',
    left: -24.5,
    top: 14,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#f5f1ea',
    borderWidth: 1.5,
    borderColor: '#080807',
  },
  nodeCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeDate: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
  },
  nodeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  nodeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#cfc6ba',
    textTransform: 'uppercase',
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
    marginTop: 4,
  },
  nodeDetail: {
    fontSize: 12,
    color: '#cfc6ba',
  },
  sharedPacesSection: {
    gap: 12,
  },
  pacesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sharedPaceItem: {
    width: 160,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  paceCoverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  paceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 7, 0.55)',
  },
  paceTextWrap: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 2,
  },
  paceMoodText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#8f877e',
    textTransform: 'uppercase',
  },
  paceTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  gallerySection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryFilters: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  filterBtnText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  emptyGalleryText: {
    fontSize: 12,
    color: '#8f877e',
    fontStyle: 'italic',
    paddingVertical: 12,
    width: '100%',
    textAlign: 'center',
  },
  galleryGridItem: {
    width: '48.2%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  galleryThumbImage: {
    width: '100%',
    aspectRatio: 1,
  },
  galleryThumbPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCardInfo: {
    padding: 10,
    gap: 8,
  },
  galleryCardCaption: {
    fontSize: 12,
    lineHeight: 16,
    color: '#f5f1ea',
  },
  galleryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  galleryCardAuthor: {
    fontSize: 9,
    color: '#8f877e',
    fontWeight: '600',
    flex: 1,
  },
  galleryCardDate: {
    fontSize: 9,
    color: '#8f877e',
    marginLeft: 6,
  },
});
