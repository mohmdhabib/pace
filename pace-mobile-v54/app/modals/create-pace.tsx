import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Image, ActivityIndicator, useColorScheme, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { X, Sparkles, Image as ImageIcon, Check, Users, ShieldAlert } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { createPace } from '@/lib/apis';
import * as mock from '@/constants/mockData';

const { width } = Dimensions.get('window');

export default function CreatePaceModal() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMood, setSelectedMood] = useState('nostalgic');
  const [selectedCover, setSelectedCover] = useState(mock.covers[0]);
  const [customCoverUri, setCustomCoverUri] = useState<string | null>(null);

  // Invite states (mocked/UI select)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const moodsList = ['chaotic', 'peaceful', 'late-night', 'nostalgic', 'soft', 'adventure', 'core-memory'];

  // Load some mock friends to show in the invite section
  useEffect(() => {
    setFriendsList([
      { id: 'riya', name: 'Riya', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
      { id: 'arjun', name: 'Arjun', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' },
      { id: 'aadhi', name: 'Aadhi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
      { id: 'noor', name: 'Noor', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    ]);
  }, []);

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

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setErrorMsg('Please name this Era / Space.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const coverUrlToSave = customCoverUri || selectedCover;

      const newPace = await createPace({
        title: title.trim(),
        description: description.trim() || null,
        mood: selectedMood,
        coverUrl: coverUrlToSave,
      });

      // Navigate straight to the newly created Space timeline
      if (newPace && newPace.id) {
        router.replace({
          pathname: '/pace/[id]',
          params: { id: newPace.id },
        } as any);
      } else {
        router.back();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Pace space. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Custom Modal Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>New Scrapbook Era</ThemedText>
        <Pressable onPress={handleCreate} disabled={submitting} style={styles.createBtn}>
          {submitting ? (
            <ActivityIndicator size="small" color={activeColors.tint} />
          ) : (
            <ThemedText style={styles.createBtnText}>Create</ThemedText>
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

        {/* Space Title and Quote */}
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
              autoFocus
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
          
          {/* Main selected cover display */}
          <View style={styles.mainCoverDisplay}>
            <Image source={{ uri: selectedCover }} style={styles.mainCoverImage} />
            <Pressable onPress={handlePickCustomCover} style={styles.customCoverBtn}>
              <ImageIcon size={14} color="#080807" />
              <ThemedText style={styles.customCoverBtnText}>Upload Custom</ThemedText>
            </Pressable>
          </View>

          {/* Curated list selection */}
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
                      <Check size={12} color="#080807" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Invite friends */}
        <View style={styles.section}>
          <View style={styles.inviteHeader}>
            <ThemedText style={styles.sectionLabel}>Add Co-Authors</ThemedText>
            <View style={styles.badgeRow}>
              <Users size={12} color="#8f877e" />
              <ThemedText style={styles.badgeText}>{selectedFriends.length} selected</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.sectionSublabel}>Co-authors can post polaroids and voice notes to this scrapbook.</ThemedText>

          <View style={styles.friendsGrid}>
            {friendsList.map((friend) => {
              const isSelected = selectedFriends.includes(friend.id);
              return (
                <Pressable
                  key={friend.id}
                  onPress={() => toggleFriend(friend.id)}
                  style={[
                    styles.friendRow,
                    { backgroundColor: activeColors.backgroundElement, borderColor: 'rgba(255, 255, 255, 0.05)' },
                    isSelected && { backgroundColor: 'rgba(245, 241, 234, 0.05)', borderColor: '#f5f1ea' },
                  ]}
                >
                  <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
                  <ThemedText style={[styles.friendName, isSelected && styles.friendNameActive]}>
                    {friend.name}
                  </ThemedText>
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                    {isSelected && <Check size={10} color="#080807" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  createBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f5f1ea',
    borderRadius: 12,
  },
  createBtnText: {
    color: '#080807',
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
  sectionSublabel: {
    fontSize: 11,
    color: '#8f877e',
    marginTop: 4,
    marginBottom: 12,
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
    color: '#080807',
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
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#8f877e',
    fontWeight: '500',
  },
  friendsGrid: {
    gap: 10,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  friendName: {
    flex: 1,
    fontSize: 13,
    color: '#8f877e',
  },
  friendNameActive: {
    color: '#f5f1ea',
    fontWeight: '600',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#f5f1ea',
    borderColor: '#f5f1ea',
  },
});
