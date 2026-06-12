import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Pressable, ScrollView, Image, ActivityIndicator, useColorScheme, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { X, Type, Image as ImageIcon, Mic, Sparkles, Send, Trash2, Play, Pause, AlertCircle } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchPaces, createMemory, uploadMemoryFile } from '@/lib/apis';

const { width } = Dimensions.get('window');

type MemoryType = 'text' | 'photo' | 'voice';

export default function AddMemoryModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paceId?: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Tab state: 'text', 'photo', 'voice'
  const [activeTab, setActiveTab] = useState<MemoryType>('text');

  // Spaces list and selected space
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('soft');

  // Input states
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Custom text card colors (for Quote cards)
  const quoteBgColors = [
    { name: 'ink', bg: '#10100f', text: '#f5f1ea' },
    { name: 'sand', bg: '#f4eee3', text: '#10100f' },
    { name: 'moss', bg: '#2b3026', text: '#f5f1ea' },
    { name: 'rust', bg: '#3b2522', text: '#f5f1ea' },
  ];
  const [selectedQuoteBg, setSelectedQuoteBg] = useState(quoteBgColors[0]);

  // Voice recording states
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<any>(null);

  // Voice preview playback state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // App & submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const moodsList = ['chaotic', 'peaceful', 'late-night', 'nostalgic', 'soft', 'adventure', 'core-memory'];

  // Cleanup sound and recording on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [sound]);

  // Load spaces on mount
  useEffect(() => {
    async function loadSpaces() {
      try {
        const activeSpaces = await fetchPaces();
        setSpaces(activeSpaces || []);

        if (params.paceId) {
          setSelectedSpaceId(params.paceId);
        } else if (activeSpaces && activeSpaces.length > 0) {
          setSelectedSpaceId(activeSpaces[0].id);
        }
      } catch (err) {
        console.warn("Failed to load spaces in memory modal:", err);
      }
    }
    loadSpaces();
  }, [params.paceId]);

  // Handle Photo Picker
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Library permission is required to choose a photo.');
        return;
      }
      setErrorMsg(null);

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      setErrorMsg('Failed to open library.');
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Microphone access is required to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      setErrorMsg('Could not initialize recording device.');
    }
  };

  // Stop Voice Recording
  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (err) {
      console.error('Failed to stop recording', err);
      setErrorMsg('Error finalizing recording file.');
    }
  };

  // Preview Recording Audio
  const handlePlayPausePreview = async () => {
    if (!recordedUri) return;

    if (sound) {
      if (isPlayingPreview) {
        await sound.pauseAsync();
        setIsPlayingPreview(false);
      } else {
        await sound.playAsync();
        setIsPlayingPreview(true);
      }
    } else {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true },
          (status: any) => {
            if (status.didJustFinish) {
              setIsPlayingPreview(false);
            }
          }
        );
        setSound(newSound);
        setIsPlayingPreview(true);
      } catch (err) {
        console.warn("Failed to preview sound:", err);
      }
    }
  };

  const deleteRecording = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setIsPlayingPreview(false);
    setRecordingDuration(0);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedSpaceId) {
      setErrorMsg('Please select a space.');
      return;
    }

    // Validation per type
    if (activeTab === 'text' && !caption.trim()) {
      setErrorMsg('Please enter a quote or thought.');
      return;
    }
    if (activeTab === 'photo' && !imageUri) {
      setErrorMsg('Please attach a photo.');
      return;
    }
    if (activeTab === 'voice' && !recordedUri) {
      setErrorMsg('Please record a voice note first.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let finalMediaUrl = '';

      if (activeTab === 'photo' && imageUri) {
        // Upload photo
        try {
          const uploadedUrl = await uploadMemoryFile({
            paceId: selectedSpaceId,
            uri: imageUri,
            fileExtension: 'jpg',
          });
          finalMediaUrl = uploadedUrl || imageUri;
        } catch {
          finalMediaUrl = imageUri; // fallback local
        }
      } else if (activeTab === 'voice' && recordedUri) {
        // Upload voice note
        try {
          const uploadedUrl = await uploadMemoryFile({
            paceId: selectedSpaceId,
            uri: recordedUri,
            fileExtension: 'm4a',
          });
          finalMediaUrl = uploadedUrl || recordedUri;
        } catch {
          finalMediaUrl = recordedUri; // fallback local
        }
      }

      const postCaption = activeTab === 'text' 
        ? caption.trim() 
        : (caption.trim() || (activeTab === 'voice' ? 'Voice Memo' : 'Photo Memory'));

      // Create Memory
      await createMemory({
        paceId: selectedSpaceId,
        type: activeTab,
        caption: postCaption,
        mood: selectedMood,
        mediaUrl: finalMediaUrl || null,
        locationName: activeTab === 'photo' ? 'Photo Vault' : activeTab === 'voice' ? 'Studio' : 'Notes',
      });

      // Navigate straight to the updated space timeline
      router.replace({
        pathname: '/pace/[id]',
        params: { id: selectedSpaceId },
      } as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit scrapbook memory.');
      setSubmitting(false);
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Add Scrapbook Memory</ThemedText>
        <Pressable onPress={handleSubmit} disabled={submitting} style={styles.submitBtn}>
          {submitting ? (
            <ActivityIndicator size="small" color="#080807" />
          ) : (
            <Send size={14} color="#080807" />
          )}
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#ef4444" />
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* Space Selector */}
        <View style={styles.spaceSection}>
          <ThemedText style={styles.sectionLabel}>Post into Space</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spacesScroll}>
            {spaces.map((space) => {
              const isSelected = space.id === selectedSpaceId;
              return (
                <Pressable
                  key={space.id}
                  onPress={() => setSelectedSpaceId(space.id)}
                  style={[
                    styles.spacePill,
                    { backgroundColor: activeColors.backgroundElement, borderColor: 'rgba(255, 255, 255, 0.05)' },
                    isSelected && { borderColor: '#f5f1ea', backgroundColor: '#191816' },
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: isSelected ? '#f5f1ea' : '#8f877e' }]} />
                  <ThemedText style={[styles.spaceText, isSelected && styles.spaceTextActive]}>
                    {space.title}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Selector: Text, Photo, Voice */}
        <View style={styles.tabContainer}>
          {(['text', 'photo', 'voice'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  setErrorMsg(null);
                }}
                style={[
                  styles.tabItem,
                  { backgroundColor: activeColors.backgroundElement },
                  isSelected && styles.tabItemActive,
                ]}
              >
                {tab === 'text' && <Type size={16} color={isSelected ? '#080807' : '#8f877e'} />}
                {tab === 'photo' && <ImageIcon size={16} color={isSelected ? '#080807' : '#8f877e'} />}
                {tab === 'voice' && <Mic size={16} color={isSelected ? '#080807' : '#8f877e'} />}
                <ThemedText style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.toUpperCase()}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Core Attachment Panels */}
        <View style={styles.panelContainer}>
          {activeTab === 'text' && (
            /* TAB 1: Quote Editor */
            <View style={styles.quoteEditorWrap}>
              <View style={[styles.quoteCard, { backgroundColor: selectedQuoteBg.bg }]}>
                <TextInput
                  style={[styles.quoteTextInput, { color: selectedQuoteBg.text }]}
                  placeholder="Type a nostalgic quote, thought, or lyric..."
                  placeholderTextColor={selectedQuoteBg.name === 'sand' ? 'rgba(16, 16, 15, 0.5)' : 'rgba(245, 241, 234, 0.5)'}
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={180}
                  multiline
                />
              </View>

              {/* Background Color Switcher */}
              <View style={styles.colorSelectorRow}>
                {quoteBgColors.map((color) => {
                  const isSelected = selectedQuoteBg.name === color.name;
                  return (
                    <Pressable
                      key={color.name}
                      onPress={() => setSelectedQuoteBg(color)}
                      style={[
                        styles.colorBubble,
                        { backgroundColor: color.bg, borderColor: 'rgba(255, 255, 255, 0.1)' },
                        isSelected && { borderColor: '#f5f1ea', borderWidth: 2 },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'photo' && (
            /* TAB 2: Polaroid Image Picker */
            <View style={styles.photoPickerWrap}>
              {imageUri ? (
                <View style={styles.polaroidWrap}>
                  <View style={styles.polaroidCard}>
                    <Image source={{ uri: imageUri }} style={styles.polaroidImage} />
                    <TextInput
                      style={styles.polaroidCaptionInput}
                      placeholder="Add a handwritten quote..."
                      placeholderTextColor="#8f877e"
                      value={caption}
                      onChangeText={setCaption}
                      maxLength={80}
                    />
                  </View>
                  <Pressable onPress={() => setImageUri(null)} style={styles.removeMediaBtn}>
                    <Trash2 size={14} color="#ef4444" />
                    <ThemedText style={styles.removeMediaText}>Remove Photo</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={handlePickPhoto} style={styles.uploadPlaceholder}>
                  <ImageIcon size={32} color="#8f877e" style={styles.placeholderIcon} />
                  <ThemedText style={styles.placeholderTitle}>Choose Polaroid Image</ThemedText>
                  <ThemedText style={styles.placeholderDesc}>Tap to pick a photo from your library.</ThemedText>
                </Pressable>
              )}
            </View>
          )}

          {activeTab === 'voice' && (
            /* TAB 3: Voice Note Recording */
            <View style={styles.voiceRecorderWrap}>
              {recordedUri ? (
                /* Player Preview Mode */
                <View style={styles.voicePreviewWrap}>
                  <ThemedText style={styles.previewTitle}>Recorded Voice Memo</ThemedText>
                  
                  <View style={styles.playerBar}>
                    <Pressable onPress={handlePlayPausePreview} style={styles.playPreviewBtn}>
                      {isPlayingPreview ? (
                        <Pause size={16} color="#080807" fill="#080807" />
                      ) : (
                        <Play size={16} color="#080807" fill="#080807" />
                      )}
                    </Pressable>
                    <View style={styles.playerWaveMock}>
                      {/* Fake active wavebars */}
                      {[12, 24, 18, 28, 14, 20, 26, 12, 10, 16, 22].map((height, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.waveMockBar,
                            { height, backgroundColor: isPlayingPreview ? '#f5f1ea' : 'rgba(245, 241, 234, 0.3)' },
                          ]}
                        />
                      ))}
                    </View>
                    <ThemedText style={styles.durationLabel}>{formatDuration(recordingDuration)}</ThemedText>
                  </View>

                  <TextInput
                    style={[styles.captionInputSec, { color: activeColors.text, backgroundColor: activeColors.backgroundElement, borderColor: 'rgba(255, 255, 255, 0.08)' }]}
                    placeholder="Provide a caption / context (optional)..."
                    placeholderTextColor="#8f877e"
                    value={caption}
                    onChangeText={setCaption}
                  />

                  <Pressable onPress={deleteRecording} style={styles.removeMediaBtn}>
                    <Trash2 size={14} color="#ef4444" />
                    <ThemedText style={styles.removeMediaText}>Delete & Re-record</ThemedText>
                  </Pressable>
                </View>
              ) : (
                /* Recorder Console Mode */
                <View style={styles.recorderConsole}>
                  {isRecording ? (
                    <View style={styles.recordingStatusWrap}>
                      <View style={styles.recordingPulseDot} />
                      <ThemedText style={styles.recordingTimer}>{formatDuration(recordingDuration)}</ThemedText>
                      <ThemedText style={styles.recordingInstruction}>Recording... Tap to stop.</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={styles.recordingInstruction}>Tap to record a voice scrap.</ThemedText>
                  )}

                  <Pressable
                    onPress={isRecording ? stopRecording : startRecording}
                    style={[
                      styles.recordBtn,
                      isRecording && styles.recordBtnRecording,
                    ]}
                  >
                    <Mic size={32} color={isRecording ? '#f5f1ea' : '#080807'} />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Vibe Selector */}
        <View style={styles.vibeSection}>
          <ThemedText style={styles.sectionLabel}>Vibe / Mood Tag</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodsScroll}>
            {moodsList.map((mood) => {
              const isSelected = mood === selectedMood;
              return (
                <Pressable
                  key={mood}
                  onPress={() => setSelectedMood(mood)}
                  style={[
                    styles.moodPill,
                    { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.05)' },
                    isSelected && { backgroundColor: 'rgba(244, 238, 227, 0.1)', borderColor: '#cfc6ba' },
                  ]}
                >
                  <Sparkles size={10} color={isSelected ? '#f5f1ea' : '#8f877e'} style={styles.moodIcon} />
                  <ThemedText style={[styles.moodText, isSelected && styles.moodTextActive]}>
                    {mood}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
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
  submitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  spaceSection: {
    padding: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cfc6ba',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  spacesScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  spacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  spaceText: {
    fontSize: 13,
    color: '#8f877e',
  },
  spaceTextActive: {
    color: '#f5f1ea',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 10,
    gap: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#f5f1ea',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8f877e',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#080807',
  },
  panelContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  quoteEditorWrap: {
    gap: 16,
  },
  quoteCard: {
    width: '100%',
    minHeight: 180,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  quoteTextInput: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    lineHeight: 24,
  },
  colorSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 8,
  },
  colorBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  photoPickerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  polaroidWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  polaroidCard: {
    width: '100%',
    backgroundColor: '#f4eee3',
    borderRadius: 20,
    padding: 12,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  polaroidCaptionInput: {
    color: '#10100f',
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  removeMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  removeMediaText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f1ea',
    marginBottom: 4,
  },
  placeholderDesc: {
    fontSize: 11,
    color: '#8f877e',
    textAlign: 'center',
  },
  voiceRecorderWrap: {
    width: '100%',
  },
  voicePreviewWrap: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8f877e',
    alignSelf: 'flex-start',
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 24, 22, 0.95)',
    padding: 12,
    borderRadius: 18,
    width: '100%',
    gap: 12,
  },
  playPreviewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerWaveMock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },
  waveMockBar: {
    width: 2.5,
    borderRadius: 1,
  },
  durationLabel: {
    fontSize: 11,
    color: '#8f877e',
    fontWeight: '600',
  },
  captionInputSec: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
  },
  recorderConsole: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 20,
  },
  recordingStatusWrap: {
    alignItems: 'center',
    gap: 8,
  },
  recordingPulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingTimer: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f5f1ea',
  },
  recordingInstruction: {
    fontSize: 13,
    color: '#8f877e',
    fontWeight: '500',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f5f1ea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  recordBtnRecording: {
    backgroundColor: '#ef4444',
  },
  vibeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    marginTop: 10,
  },
  moodsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  moodIcon: {
    marginRight: 4,
  },
  moodText: {
    fontSize: 12,
    color: '#8f877e',
  },
  moodTextActive: {
    color: '#f5f1ea',
    fontWeight: '600',
  },
});
