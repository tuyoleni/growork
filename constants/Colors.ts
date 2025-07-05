const tintColor = '#2563eb'; // Clean, modern blue (like Instagram's subtle accents)

export const Colors = {
  light: {
    text: '#0f0f0f',             // Deeper black for contrast, not pure black
    background: '#ffffff',       // Pure white, very clean
    backgroundSecondary: '#f5f5f5', // Subtle off-white for cards/sections
    backgroundTertiary: '#ededed',  // Even softer off-white for depth
    tint: tintColor,             // Accent blue
    icon: '#262626',             // Instagram-style icon gray
    iconSecondary: '#444444',    // Slightly lighter black for secondary icons
    tabIconDefault: '#a8a8a8',   // Neutral muted gray
    tabIconSelected: tintColor, // Matches blue tint
    border: '#e5e5e5',           // Light gray border, flat and unobtrusive
    borderSecondary: '#cccccc',  // Slightly darker border for separation
    shadow: '#d1d1d1',           // Very light gray for subtle shadow/depth
    mutedText: '#6e6e6e',        // Muted gray for less important text
    disabled: '#e0e0e0',         // Disabled state, very light gray
  },
  dark: {
    text: '#f5f5f5',             // Off-white text for easier reading
    background: '#000000',       // True black for OLED and Instagram-like contrast
    backgroundSecondary: '#181818', // Slightly lighter black for cards/sections
    backgroundTertiary: '#232323',  // Even lighter black for depth
    tint: tintColor,             // Same accent blue
    icon: '#e4e4e4',             // Soft white-gray
    iconSecondary: '#b0b0b0',    // Dimmer gray for secondary icons
    tabIconDefault: '#7c7c7c',   // Muted gray, keeps it understated
    tabIconSelected: tintColor, // Consistent highlight color
    border: '#1a1a1a',           // Very dark gray, flat border on black
    borderSecondary: '#2c2c2c',  // Slightly lighter border for separation
    shadow: '#111111',           // Subtle shadow/depth on black
    mutedText: '#a0a0a0',        // Muted gray for less important text
    disabled: '#222222',         // Disabled state, very dark gray
  },
};
