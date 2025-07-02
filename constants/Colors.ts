/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Minimalist black, white, and blue tone theme.
 */

const tintColor = '#2563eb'; // minimalist blue

export const Colors = {
  light: {
    text: '#111', // black
    background: '#fff', // white
    tint: tintColor, // blue
    icon: '#222', // dark gray/black
    tabIconDefault: '#222',
    tabIconSelected: tintColor,
    border: '#E5E7EB', // light gray
  },
  dark: {
    text: '#fff', // white
    background: '#111', // black
    tint: tintColor, // blue
    icon: '#fff', // white
    tabIconDefault: '#fff',
    tabIconSelected: tintColor,
    border: '#222', // dark gray/black
  },
};
