/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#10100f';
const tintColorDark = '#f5f1ea';

export const Colors = {
  light: {
    text: '#f5f1ea',
    background: '#000000',
    backgroundElement: '#0a0a09',
    backgroundSelected: '#121211',
    textSecondary: '#8f877e',
    tint: tintColorDark,
    icon: '#8f877e',
    tabIconDefault: '#8f877e',
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: '#f5f1ea',
    background: '#000000',
    backgroundElement: '#0a0a09',
    backgroundSelected: '#121211',
    textSecondary: '#8f877e',
    tint: tintColorDark,
    icon: '#8f877e',
    tabIconDefault: '#8f877e',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
