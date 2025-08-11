# Safe Area Usage Examples

## Basic Usage (Default)

Your existing screens already work with safe areas applied to all edges:

```tsx
import ScreenContainer from "@/components/ScreenContainer";

export default function HomeScreen() {
  return (
    <ScreenContainer>
      {/* Content automatically gets safe area padding on all sides */}
      <YourContent />
    </ScreenContainer>
  );
}
```

## Custom Edge Configuration

For screens that need different safe area handling:

### Top and Bottom Only (Good for full-width content)

```tsx
<ScreenContainer edges={["top", "bottom"]}>
  {/* Content gets safe area padding only on top and bottom */}
  {/* Left and right edges extend to screen edges */}
  <YourContent />
</ScreenContainer>
```

### Top Only (Good for headers with full-width content)

```tsx
<ScreenContainer edges={["top"]}>
  {/* Only top gets safe area padding */}
  {/* Content extends to all other edges */}
  <YourContent />
</ScreenContainer>
```

### Bottom Only (Good for bottom sheets or modals)

```tsx
<ScreenContainer edges={["bottom"]}>
  {/* Only bottom gets safe area padding */}
  {/* Content extends to top, left, and right edges */}
  <YourContent />
</ScreenContainer>
```

## Real-World Examples

### 1. Home Screen (Current)

```tsx
// Your current home screen - safe areas on all edges
<ScreenContainer>
  <Header />
  <ScrollView>
    <Posts />
  </ScrollView>
</ScreenContainer>
```

### 2. Full-Width Header Screen

```tsx
// For screens where you want content to extend to edges
<ScreenContainer edges={["top", "bottom"]}>
  <View style={{ backgroundColor: "red", height: 100 }} />
  <ScrollView>
    <Content />
  </ScrollView>
</ScreenContainer>
```

### 3. Modal or Bottom Sheet

```tsx
// For modals that need bottom safe area only
<ScreenContainer edges={["bottom"]}>
  <ModalContent />
</ScreenContainer>
```

## When to Use Different Configurations

- **`['top', 'bottom', 'left', 'right']` (default)**: Most screens, content needs to avoid all system UI
- **`['top', 'bottom']`**: Full-width content, like headers or side-to-side content
- **`['top']**: Headers that extend to edges, content below needs top safe area
- **`['bottom']**: Bottom sheets, modals, or content that needs bottom safe area
- **`[]`**: No safe areas (rare, only when you want content under system UI)

## Testing

Test your safe area configurations on:

- iOS devices with notches
- Android devices with different status bar heights
- Both portrait and landscape orientations
- Different device sizes
