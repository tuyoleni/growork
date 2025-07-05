import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Pressable, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

type Variant = 'job' | 'news' | 'sponsored';

type BaseProps = {
  variant: Variant;
  avatarImage: string;
  title: string;
  mainImage?: string; // Made optional
  description: string;
  onPressMore?: () => void;
};

type JobProps = {
  variant: 'job';
  isVerified?: boolean;
  onPressHeart?: () => void;
  onPressMessage?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
  onPressApply?: () => void;
};

type NewsProps = {
  variant: 'news';
  badgeText?: string;
  badgeVariant?: 'error' | 'info' | 'success';
  onPressHeart?: () => void;
  onPressMessage?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
};

type SponsoredProps = {
  variant: 'sponsored';
  badgeText?: string;
  onPressHeart?: () => void;
  onPressShare?: () => void;
  onPressLearnMore?: () => void;
};

export type ContentCardProps = BaseProps & (JobProps | NewsProps | SponsoredProps) & {
  style?: ViewStyle;
};

const badgeColors = (theme: any) => ({
  error: { background: theme.mutedText, text: theme.background },
  info: { background: theme.tint, text: theme.background },
  success: { background: theme.icon, text: theme.background },
});

export default function ContentCard(props: ContentCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  const mutedTextColor = useThemeColor({}, 'mutedText');

  const renderBadge = () => {
    if (props.variant === 'news' && props.badgeText) {
      const badgeStyle = badgeColors(theme)[props.badgeVariant || 'error'];
      return (
        <View style={[styles.badge, { backgroundColor: badgeStyle.background, opacity: 0.7 }]}>
          <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]}>
            {props.badgeText}
          </ThemedText>
        </View>
      );
    }

    if (props.variant === 'sponsored') {
      return (
        <ThemedText style={[styles.sponsoredLabel, { color: mutedTextColor }]}>
          Sponsored
        </ThemedText>
      );
    }

    return null;
  };

  const IconButton = ({
    name,
    onPress,
  }: {
    name: keyof typeof Feather.glyphMap;
    onPress?: () => void;
  }) => (
    <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
      if (process.env.EXPO_OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress && onPress();
    }}>
      <Feather name={name} size={20} color={iconColor} />
    </Pressable>
  );

  const renderIconActions = () => {
    switch (props.variant) {
      case 'job':
      case 'news':
        return (
          <>
            <IconButton name="heart" onPress={props.onPressHeart} />
            <IconButton name="message-circle" onPress={props.onPressMessage} />
            <IconButton name="share" onPress={props.onPressShare} />
            <IconButton name="bookmark" onPress={props.onPressBookmark} />
          </>
        );
      case 'sponsored':
        return (
          <>
            <IconButton name="heart" onPress={props.onPressHeart} />
            <IconButton name="share" onPress={props.onPressShare} />
          </>
        );
    }
  };

  const renderCTAButton = () => {
    if (props.variant === 'job') {
      return (
        <Pressable
          style={[styles.applyButton, { backgroundColor: textColor }]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            props.onPressApply && props.onPressApply();
          }}
        >
          <ThemedText style={[styles.applyButtonText, { color: backgroundColor }]}>
            Apply Now
          </ThemedText>
        </Pressable>
      );
    }

    if (props.variant === 'sponsored') {
      return (
        <Pressable
          style={[styles.learnMoreButton, { backgroundColor: textColor }]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            props.onPressLearnMore && props.onPressLearnMore();
          }}
        >
          <ThemedText style={[styles.learnMoreButtonText, { color: backgroundColor }]}>
            Learn More
          </ThemedText>
        </Pressable>
      );
    }

    return null;
  };

  return (
    <ThemedView style={[styles.card, { borderBottomColor: borderColor }, props.style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{ uri: props.avatarImage }} style={styles.avatar} />
        <View style={styles.companyRow}>
          <ThemedText style={styles.companyName} type="defaultSemiBold">
            {props.title}
          </ThemedText>
          {renderBadge()}
          {props.variant === 'job' && props.isVerified && (
            <Feather name="shield" size={16} color={tintColor} style={{ marginLeft: 4 }} />
          )}
        </View>
        <IconButton name="more-horizontal" onPress={props.onPressMore} />
      </View>

      {/* Optional Main Image */}
      {props.mainImage && (
        <Image
          source={{ uri: props.mainImage }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      )}

      {/* Description + Actions */}
      <View style={styles.body}>
        <ThemedText style={styles.description}>{props.description}</ThemedText>
        <View style={styles.actionsRow}>
          <View style={styles.iconActions}>{renderIconActions()}</View>
          {renderCTAButton()}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 6,
  },
  companyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 3,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 4,
    marginBottom: 8,
  },
  body: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
  },
  description: {
    fontSize: 15,
    marginBottom: 8,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  applyButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  learnMoreButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  learnMoreButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  sponsoredLabel: {
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '400',
  },
});
