import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, ScrollView, TextInput, ActivityIndicator, useColorScheme, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Image as ImageIcon, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchPaces, createMemory, uploadMemoryFile } from '@/lib/apis';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paceId?: string }>();
  const scheme = useColorScheme();
  const colorScheme = scheme ?? 'dark';
  const activeColors = Colors[colorScheme];

  // Permissions & Capture States
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasLibraryPermission, setHasLibraryPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Form States
  const [caption, setCaption] = useState('');
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('nostalgic');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const moodsList = ['chaotic', 'peaceful', 'late-night', 'nostalgic', 'soft', 'adventure', 'core-memory'];

  // Request permissions and fetch Spaces
  useEffect(() => {
    async function setup() {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasLibraryPermission(libraryStatus.status === 'granted');

      try {
        const activeSpaces = await fetchPaces();
        setSpaces(activeSpaces || []);
        
        // Auto-select space if passed from params or select first available
        if (params.paceId) {
          setSelectedSpaceId(params.paceId);
        } else if (activeSpaces && activeSpaces.length > 0) {
          setSelectedSpaceId(activeSpaces[0].id);
        }
      } catch (err) {
        console.warn("Failed to load spaces in camera view:", err);
      }
    }

    setup();
  }, [params.paceId]);

  // Handle camera capture launch
  const launchCamera = async () => {
    if (!hasCameraPermission) {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        setErrorMsg('Camera access is required to take photos.');
        return;
      }
      setHasCameraPermission(true);
    }

    try {
      setErrorMsg(null);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to open camera.');
    }
  };

  // Handle library image picking
  const launchLibrary = async () => {
    if (!hasLibraryPermission) {
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libraryStatus.status !== 'granted') {
        setErrorMsg('Library access is required to select photos.');
        return;
      }
      setHasLibraryPermission(true);
    }

    try {
      setErrorMsg(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to pick an image.');
    }
  };

  // Upload and post memory
  const handlePost = async () => {
    if (!imageUri) {
      setErrorMsg('Please capture or select a photo first.');
      return;
    }
    if (!selectedSpaceId) {
      setErrorMsg('Please select a space to post this memory to.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      let finalMediaUrl = imageUri;

      // Upload to Supabase if configured
      try {
        const uploadedUrl = await uploadMemoryFile({
          paceId: selectedSpaceId,
          uri: imageUri,
          fileExtension: 'jpg',
        });
        if (uploadedUrl) {
          finalMediaUrl = uploadedUrl;
        }
      } catch (uploadErr) {
        console.warn("Storage upload failed, falling back to local/mock URI:", uploadErr);
      }

      // Create local or remote memory entry
      await createMemory({
        paceId: selectedSpaceId,
        type: 'photo',
        caption: caption.trim() || 'Captured moment',
        mood: selectedMood,
        mediaUrl: finalMediaUrl,
        locationName: 'Sunset Spot', // default tag
      });

      // Navigate back to the selected Space timeline
      router.replace({
        pathname: `/pace/[id]`,
        params: { id: selectedSpaceId },
      } as any);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post memory. Please try again.');
      setUploading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: activeColors.background }]}>
      {/* Top Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={activeColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Scrapbook Capture</ThemedText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#ef4444" />
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* Polaroid Card Area */}
        <View style={styles.previewContainer}>
          {imageUri ? (
            <View style={styles.polaroidContainer}>
              <View style={styles.polaroidCard}>
                <Image source={{ uri: imageUri }} style={styles.polaroidImage} />
                <View style={styles.polaroidBottom}>
                  <ThemedText style={styles.polaroidCaptionText}>
                    {caption.trim() ? `"${caption}"` : 'Write a caption below...'}
                  </ThemedText>
                  <ThemedText style={styles.polaroidMoodTag}>
                    • {selectedMood.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <Pressable onPress={() => setImageUri(null)} style={styles.retakeButton}>
                <RefreshCw size={14} color="#8f877e" />
                <ThemedText style={styles.retakeText}>Retake Photo</ThemedText>
              </Pressable>
            </View>
          ) : (
            /* Blank Camera Frame */
            <View style={styles.cameraFrame}>
              <View style={styles.cameraLens}>
                <Camera size={36} color="#8f877e" />
                <ThemedText style={styles.frameLabel}>Frame an Era</ThemedText>
              </View>
              <View style={styles.frameActions}>
                <Pressable onPress={launchCamera} style={styles.frameBtn}>
                  <Camera size={18} color="#080807" />
                  <ThemedText style={styles.frameBtnText}>Open Camera</ThemedText>
                </Pressable>
                <Pressable onPress={launchLibrary} style={[styles.frameBtn, styles.frameBtnSec]}>
                  <ImageIcon size={18} color="#f5f1ea" />
                  <ThemedText style={[styles.frameBtnText, styles.frameBtnTextSec]}>Photo Library</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Input Details Form */}
        {imageUri && (
          <View style={styles.formContainer}>
            {/* Caption Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Memory Quote / Caption</ThemedText>
              <TextInput
                style={[styles.textInput, { color: activeColors.text, borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: activeColors.backgroundElement }]}
                placeholder="Write a message, lyric, or quote for this moment..."
                placeholderTextColor="#8f877e"
                value={caption}
                onChangeText={setCaption}
                maxLength={120}
                multiline
              />
            </View>

            {/* Space Selector */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Select Pace Space</ThemedText>
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

            {/* Mood Selector */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Vibe / Mood Tag</ThemedText>
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

            {/* Submit Button */}
            <Pressable
              onPress={handlePost}
              disabled={uploading}
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: (pressed || uploading) ? 0.9 : 1 },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#080807" />
              ) : (
                <>
                  <Send size={16} color="#080807" style={styles.submitIcon} />
                  <ThemedText style={styles.submitBtnText}>Post to Pace Scrapbook</ThemedText>
                </>
              )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cameraFrame: {
    width: width - 40,
    height: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  cameraLens: {
    alignItems: 'center',
    gap: 12,
  },
  frameLabel: {
    fontSize: 14,
    color: '#8f877e',
    fontWeight: '500',
  },
  frameActions: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 12,
  },
  frameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f1ea',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  frameBtnSec: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  frameBtnText: {
    color: '#080807',
    fontSize: 14,
    fontWeight: '700',
  },
  frameBtnTextSec: {
    color: '#f5f1ea',
  },
  polaroidContainer: {
    width: width - 40,
    alignItems: 'center',
    gap: 16,
  },
  polaroidCard: {
    width: '100%',
    backgroundColor: '#f4eee3',
    borderRadius: 18,
    padding: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  polaroidBottom: {
    marginTop: 14,
    gap: 6,
    paddingHorizontal: 4,
  },
  polaroidCaptionText: {
    color: '#10100f',
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  polaroidMoodTag: {
    color: '#8f877e',
    fontSize: 10,
    fontWeight: '700',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  retakeText: {
    color: '#8f877e',
    fontSize: 11,
    fontWeight: '600',
  },
  formContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cfc6ba',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
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
  submitBtn: {
    backgroundColor: '#f5f1ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 10,
    gap: 8,
  },
  submitIcon: {
    marginTop: -1,
  },
  submitBtnText: {
    color: '#080807',
    fontSize: 14,
    fontWeight: '700',
  },
});
