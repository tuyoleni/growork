# Safe Area Implementation Guide

## Overview

This app now has comprehensive safe area support that works on both iOS and Android, handling notches, status bars, home indicators, and other system UI elements.

## Components Available

### 1. ScreenContainer (Updated)

Your existing `ScreenContainer` now supports safe areas with configurable edges:

```tsx
import ScreenContainer from '@/components/ScreenContainer';

// Default - applies safe area to all edges
<ScreenContainer>
  <YourContent />
</ScreenContainer>

// Custom edges - only apply safe area to specific edges
<ScreenContainer edges={['top', 'bottom']}>
  <YourContent />
</ScreenContainer>
```

### 2. SafeAreaWrapper

A flexible wrapper for specific safe area needs:

```tsx
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';

// Apply safe area to all edges
<SafeAreaWrapper>
  <YourContent />
</SafeAreaWrapper>

// Only top and bottom edges
<SafeAreaWrapper edges={['top', 'bottom']}>
  <YourContent />
</SafeAreaWrapper>

// Use margin instead of padding
<SafeAreaWrapper mode="margin" edges={['top']}>
  <YourContent />
</SafeAreaWrapper>
```

### 3. SafeAreaInsets

For custom control over safe area insets:

```tsx
import { SafeAreaInsets } from "@/components/SafeAreaWrapper";

<SafeAreaInsets edges={["top", "bottom"]}>
  <YourContent />
</SafeAreaInsets>;
```

### 4. useSafeArea Hook

Access safe area insets and utilities in your components:

```tsx
import { useSafeArea } from "@/hooks";

function MyComponent() {
  const {
    insets,
    safeAreaStyles,
    getSafeAreaStyle,
    hasNotch,
    hasHomeIndicator,
  } = useSafeArea();

  return (
    <View style={[{ flex: 1 }, getSafeAreaStyle(["top", "bottom"])]}>
      <YourContent />
    </View>
  );
}
```

## Best Practices

1. **Use ScreenContainer for full-screen screens** - It handles keyboard avoidance and safe areas
2. **Use SafeAreaWrapper for specific areas** - When you need custom safe area behavior
3. **Use useSafeArea hook for custom layouts** - When you need precise control over insets
4. **Test on different devices** - Safe areas vary between devices and orientations

## Edge Cases

- **Android**: Safe areas are minimal but still important for status bar and navigation
- **iOS**: Handles notches, home indicators, and dynamic island
- **Landscape**: Safe areas adjust automatically
- **Keyboard**: ScreenContainer handles keyboard avoidance automatically

## Migration

Your existing screens using `ScreenContainer` will automatically get safe area support. For custom layouts, use the new components as needed.
