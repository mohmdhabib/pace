import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, View, ActivityIndicator } from 'react-native';
import { Play, Pause, Mic } from 'lucide-react-native';
import { Audio } from 'expo-av';

import { ThemedText } from '@/components/themed-text';

interface VoicePlayerProps {
  url: string;
}

export default function VoicePlayer({ url }: VoicePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPause = async () => {
    if (loading) return;

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      setLoading(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } catch (err) {
        console.warn("Failed to load and play voice note:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        const cur = status.positionMillis / status.durationMillis;
        setProgress(cur);

        // Format duration remaining or elapsed
        const totalSecs = Math.floor(status.positionMillis / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(0);
        if (sound) {
          sound.setPositionAsync(0);
        }
      }
    }
  };

  // Pre-generate a list of height peaks for a waveform look
  const wavePeaks = [8, 14, 26, 12, 18, 32, 24, 16, 28, 10, 15, 30, 22, 14, 25, 12, 8, 16, 20, 10];

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(25, 24, 22, 0.95)' }]}>
      <Pressable onPress={handlePlayPause} style={styles.playBtn}>
        {loading ? (
          <ActivityIndicator size="small" color="#f5f1ea" />
        ) : isPlaying ? (
          <Pause size={16} color="#080807" fill="#080807" />
        ) : (
          <Play size={16} color="#080807" fill="#080807" />
        )}
      </Pressable>

      {/* Waveform Visualization */}
      <View style={styles.waveContainer}>
        {wavePeaks.map((peak, idx) => {
          const isActive = (idx / wavePeaks.length) <= progress;
          return (
            <View
              key={idx}
              style={[
                styles.waveBar,
                {
                  height: peak,
                  backgroundColor: isActive ? '#f5f1ea' : 'rgba(245, 241, 234, 0.25)',
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.meta}>
        <Mic size={10} color="#8f877e" />
        <ThemedText style={styles.durationText}>{duration}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
    alignSelf: 'stretch',
    minHeight: 64,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f1ea', // pace-pearl
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  waveBar: {
    width: 2.5,
    borderRadius: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  durationText: {
    fontSize: 10,
    color: '#8f877e',
    fontWeight: '600',
  },
});
