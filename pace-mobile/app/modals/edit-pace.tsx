import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Image, ActivityIndicator, useColorScheme, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { X, Sparkles, Image as ImageIcon, Check, Archive, ShieldAlert } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchPaces, updatePace, archivePace, unarchivePace } from '@/lib/apis';
import * as mock from '@/constants/mockData';

const { width } = Dimensions.get('window');

export default function EditPaceModal() {
  const router = useRouter();
  const { paceId } = useLocalSearchParams<{ paceId: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Pace reference
  const [pace, setPace] = useState<any>(null);
  const [loadingPace, setLoadingPace] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMood, setSelectedMood] = useState('nostalgic');
  const [selectedCover, setSelectedCover] = useState(mock.covers[0]);
  const [customCoverUri, setCustomCoverUri] = useState<string | null>(null);

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const moodsList = ['chaotic', 'peaceful', 'late-night', 'nostalgic', 'soft', 'adventure', 'core-memory'];

  // Load existing pace details
  useEffect(() => {
    async function loadPaceData() {
      if (!paceId) {
        setErrorMsg('Pace ID is missing.');
        setLoadingPace(false);
        return;
      }
      try {
        const allPaces = await fetchPaces();
        const found = allPaces.find((p: any) => p.id === paceId);
        if (found) {
          setPace(found);
          setTitle(found.title);
          setDescription(found.snippet || found.description || '');
          setSelectedMood(found.mood || 'nostalgic');
          
          const isPreset = mock.covers.includes(found.cover);
          if (isPreset) {
            setSelectedCover(found.cover);
          } else {
            setCustomCoverUri(found.cover);
            setSelectedCover(found.cover);
          }
        } else {
          setErrorMsg('Scrapbook Era not found.');
        }
      } catch {
        setErrorMsg('Failed to load Era details.');
      } finally {
        setLoadingPace(false);
      }
    }
    loadPaceData();
  }, [paceId]);

  const handlePickCustomCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Library permission is required to upload custom covers.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setCustomCoverUri(uri);
        setSelectedCover(uri);
      }
    } catch {
      setErrorMsg('Failed to open library.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please name this Era / Space.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const coverUrlToSave = customCoverUri || selectedCover;

      await updatePace(paceId, {
        title: title.trim(),
        description: description.trim() || null,
        mood: selectedMood,
        cover_url: coverUrlToSave,
      });

      Alert.alert('Success', 'Era settings saved.', [
        { text: 'OK', onPress: () => router.replace({ pathname: '/pace/[id]', params: { id: paceId } } as any) }
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings. Please try again.');
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!pace) return;
    const isArchived = Boolean(pace.archivedAt);
    
    Alert.alert(
      isArchived ? 'Restore Era' : 'Archive Era',
      isArchived 
        ? 'Restore this era back to your active dashboard?'
        : 'Are you sure you want to archive this era? You can restore it anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isArchived ? 'Restore' : 'Archive', 
          style: isArchived ? 'default' : 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (isArchived) {
                await unarchivePace(paceId);
              } else {
                await archivePace(paceId);
              }
              router.replace('/(tabs)/paces');
            } catch (err: any) {
              setErrorMsg(err.message || 'Failed to update archiving state.');
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loadingPace) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Era Settings</ThemedText>
        <Pressable onPress={handleSave} disabled={submitting} style={styles.saveBtn}>
          {submitting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.saveBtnText}>Save</ThemedText>
          )}
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorContainer}>
            <ShieldAlert size={16} color="#ef4444" />
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* Form fields */}
        <View style={styles.formSection}>
          <View style={styles.inputWrap}>
            <ThemedText style={styles.sectionLabel}>Name this Era</ThemedText>
            <TextInput
              style={[styles.titleInput, { color: activeColors.text }]}
              placeholder="e.g. Chennai Nights, Semester 6..."
              placeholderTextColor="#8f877e"
              value={title}
              onChangeText={setTitle}
              maxLength={40}
            />
          </View>

          <View style={styles.inputWrap}>
            <ThemedText style={styles.sectionLabel}>Era Summary / Tagline</ThemedText>
            <TextInput
              style={[styles.descInput, { color: activeColors.text, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: activeColors.backgroundElement }]}
              placeholder="e.g. auto rides, bad karaoke, and the sea looking like a secret..."
              placeholderTextColor="#8f877e"
              value={description}
              onChangeText={setDescription}
              maxLength={100}
              multiline
            />
          </View>
        </View>

        {/* Vibe / Mood picker */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select the Vibe Colorway</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeScroll}>
            {moodsList.map((mood) => {
              const isSelected = mood === selectedMood;
              return (
                <Pressable
                  key={mood}
                  onPress={() => setSelectedMood(mood)}
                  style={[
                    styles.vibeCard,
                    { backgroundColor: activeColors.backgroundElement, borderColor: 'rgba(255, 255, 255, 0.05)' },
                    isSelected && { borderColor: '#f5f1ea', backgroundColor: '#191816' },
                  ]}
                >
                  <View style={styles.vibeVisual}>
                    <Sparkles size={16} color={isSelected ? '#f5f1ea' : '#8f877e'} />
                  </View>
                  <ThemedText style={[styles.vibeText, isSelected && styles.vibeTextActive]}>
                    {mood}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Cover Art selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Select Cover Image</ThemedText>
          
          <View style={styles.mainCoverDisplay}>
            <Image source={{ uri: selectedCover }} style={styles.mainCoverImage} />
            <Pressable onPress={handlePickCustomCover} style={styles.customCoverBtn}>
              <ImageIcon size={14} color="#000000" />
              <ThemedText style={styles.customCoverBtnText}>Upload Custom</ThemedText>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.curatedScroll}>
            {mock.covers.map((coverUrl, index) => {
              const isSelected = selectedCover === coverUrl && !customCoverUri;
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    setCustomCoverUri(null);
                    setSelectedCover(coverUrl);
                  }}
                  style={styles.coverThumbnailWrap}
                >
                  <Image source={{ uri: coverUrl }} style={[styles.coverThumbnail, isSelected && styles.coverThumbnailSelected]} />
                  {isSelected && (
                    <View style={styles.coverSelectedCheck}>
                      <Check size={12} color="#000000" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Archive / Restore Button */}
        {pace && (
          <View style={styles.dangerSection}>
            <Pressable 
              onPress={handleArchiveToggle}
              style={[
                styles.archiveBtn, 
                { 
                  backgroundColor: pace.archivedAt ? 'rgba(43, 48, 38, 0.15)' : 'rgba(59, 37, 34, 0.15)',
                  borderColor: pace.archivedAt ? 'rgba(125, 133, 119, 0.3)' : 'rgba(143, 107, 103, 0.3)'
                }
              ]}
            >
              <Archive size={16} color={pace.archivedAt ? '#7d8577' : '#8f6b67'} />
              <ThemedText style={[styles.archiveBtnText, { color: pace.archivedAt ? '#7d8577' : '#8f6b67' }]}>
                {pace.archivedAt ? 'Restore Era (Unarchive)' : 'Archive Scrapbook Era'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    backgroundColor: '#f5f1ea',
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  formSection: {
    padding: 20,
    gap: 20,
  },
  inputWrap: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cfc6ba',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  descInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  vibeScroll: {
    gap: 12,
    paddingVertical: 10,
  },
  vibeCard: {
    width: 110,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  vibeVisual: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeText: {
    fontSize: 12,
    color: '#8f877e',
    textTransform: 'capitalize',
  },
  vibeTextActive: {
    color: '#f5f1ea',
    fontWeight: '700',
  },
  mainCoverDisplay: {
    width: width - 40,
    height: 180,
    borderRadius: 20,
    position: 'relative',
    marginTop: 12,
    overflow: 'hidden',
  },
  mainCoverImage: {
    width: '100%',
    height: '100%',
  },
  customCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f1ea',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  customCoverBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  curatedScroll: {
    gap: 10,
    paddingVertical: 12,
  },
  coverThumbnailWrap: {
    width: 80,
    height: 50,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  coverThumbnail: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  coverThumbnailSelected: {
    borderColor: '#f5f1ea',
  },
  coverSelectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
    gap: 10,
  },
  archiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
