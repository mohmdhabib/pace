import React, { useState, useEffect } from 'react';
import { StyleSheet, Pressable, ScrollView, View, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Archive, Sparkles, Layers } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import PaceCard from '@/components/pace-card';
import { fetchPaces } from '@/lib/apis';

export default function PacesScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  const [paces, setPaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  async function loadData() {
    try {
      const data = await fetchPaces();
      setPaces(data || []);
    } catch (err) {
      console.warn("Failed to load paces:", err);
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

  const activePaces = paces.filter((p) => !p.archivedAt);
  const archivedPaces = paces.filter((p) => p.archivedAt);

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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerLabelRow}>
              <Layers size={14} color={activeColors.textSecondary} />
              <ThemedText style={styles.headerLabel}>ACTIVE ERAS</ThemedText>
            </View>
            <ThemedText style={styles.title}>Your Paces</ThemedText>
            <ThemedText style={styles.subtitle}>
              Private rooms holding the memories of the phases that shaped you.
            </ThemedText>
          </View>

          {/* Horizontal Scroll View for Active Paces */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={styles.cardContainer.marginRight + styles.cardContainer.width}
            decelerationRate="fast"
            contentContainerStyle={styles.pacesScroll}
          >
            {activePaces.length > 0 ? (
              activePaces.map((pace) => (
                <View style={styles.cardContainer} key={pace.id}>
                  <PaceCard
                    pace={pace}
                    onOpen={() => router.push(`/pace/${pace.id}` as any)}
                  />
                </View>
              ))
            ) : (
              /* Empty State Onboarding Card */
              <View style={[styles.emptyCard, { backgroundColor: activeColors.backgroundElement }]}>
                <View style={[styles.sparkleWrap, { backgroundColor: 'rgba(245, 241, 234, 0.05)' }]}>
                  <Sparkles size={24} color="#f5f1ea" />
                </View>
                <ThemedText style={styles.emptyTitle}>Create your first Pace</ThemedText>
                <ThemedText style={styles.emptyDesc}>
                  Whether a weekend trip, a college year, or a late-night chatroom. Shared only with those there.
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/modals/create-pace' as any)}
                  style={({ pressed }) => [
                    styles.emptyBtn,
                    {
                      backgroundColor: '#f5f1ea',
                      opacity: pressed ? 0.9 : 1
                    }
                  ]}
                >
                  <Plus size={16} color="#080807" style={styles.btnIcon} />
                  <ThemedText style={styles.emptyBtnText}>Create Pace</ThemedText>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Archived Drawer Segment */}
          {archivedPaces.length > 0 && (
            <View style={styles.archiveSection}>
              <Pressable
                onPress={() => setShowArchived(!showArchived)}
                style={({ pressed }) => [
                  styles.archiveToggle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    opacity: pressed ? 0.9 : 1
                  }
                ]}
              >
                <Archive size={14} color={activeColors.textSecondary} />
                <ThemedText style={styles.archiveToggleText}>
                  {showArchived ? "Hide Archived Eras" : `Show Archived Eras (${archivedPaces.length})`}
                </ThemedText>
              </Pressable>

              {showArchived && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.archivedScroll}
                >
                  {archivedPaces.map((pace) => (
                    <View style={styles.cardContainer} key={pace.id}>
                      <PaceCard
                        pace={pace}
                        isArchived={true}
                        onOpen={() => router.push(`/pace/${pace.id}` as any)}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </ScrollView>

        {/* Floating Create Button */}
        {activePaces.length > 0 && (
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
              <Plus size={18} color="#080807" style={styles.btnIcon} />
              <ThemedText style={styles.floatingBtnText}>Create Pace</ThemedText>
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
  scrollContent: {
    paddingBottom: 160,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
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
  subtitle: {
    fontSize: 14,
    color: '#8f877e',
    lineHeight: 20,
  },
  pacesScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cardContainer: {
    width: 320,
    marginRight: 16,
  },
  emptyCard: {
    width: 320,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 420,
  },
  sparkleWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    paddingHorizontal: 16,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080807',
  },
  btnIcon: {
    marginRight: 6,
  },
  archiveSection: {
    marginTop: 28,
    paddingHorizontal: 24,
    gap: 16,
  },
  archiveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 8,
  },
  archiveToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8f877e',
  },
  archivedScroll: {
    paddingVertical: 12,
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
