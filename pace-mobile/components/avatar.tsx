import React, { useState } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';

interface AvatarProps {
  src?: string | null;
  name?: string;
  online?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: any;
}

export default function Avatar({
  src,
  name = 'User',
  online = false,
  size = 'md',
  style
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const sizeDims = {
    sm: 32,
    md: 44,
    lg: 64,
    xl: 96,
  };

  const fontSize = {
    sm: 12,
    md: 15,
    lg: 22,
    xl: 32,
  };

  const dotSizes = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
  };

  const currentSize = sizeDims[size];
  const currentFont = fontSize[size];
  const currentDot = dotSizes[size];

  const hasImage = src && !imageError;

  return (
    <View style={[styles.container, { width: currentSize, height: currentSize }, style]}>
      <View
        style={[
          styles.avatarFrame,
          {
            width: currentSize,
            height: currentSize,
            borderRadius: currentSize / 2,
          },
        ]}
      >
        {hasImage ? (
          <Image
            source={{ uri: src }}
            style={{ width: currentSize, height: currentSize }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Text style={[styles.initialsText, { fontSize: currentFont }]}>{initials}</Text>
        )}
      </View>

      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: currentDot,
              height: currentDot,
              borderRadius: currentDot / 2,
              right: size === 'sm' ? -1 : 1,
              bottom: size === 'sm' ? -1 : 1,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarFrame: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  initialsText: {
    color: '#f5f1ea', // pace-pearl
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#22c55e', // green-500
    borderWidth: 2,
    borderColor: '#080807', // pace-black matching background
  },
});
