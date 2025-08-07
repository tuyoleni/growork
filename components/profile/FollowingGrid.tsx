import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';

const DATA = [
  {
    type: 'company',
    name: 'Airbnb',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    badge: 'Company',
  },
  {
    type: 'channel',
    name: 'Design Weekly',
    icon: 'youtube',
    badge: 'Channel',
  },
  {
    type: 'company',
    name: 'Figma',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3037f2d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    badge: 'Company',
  },
  {
    type: 'channel',
    name: 'UX Podcast',
    icon: 'radio',
    badge: 'Channel',
  },
];

function Avatar({ image }: { image: string }) {
  const avatarBg = useThemeColor({}, 'backgroundSecondary');
  return (
    <Image source={{ uri: image }} style={[styles.avatar, { backgroundColor: avatarBg }]} />
  );
}

function IconWithBackground({ icon }: { icon: React.ReactElement }) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');
  return (
    <View style={[styles.iconBg, { backgroundColor: backgroundColor }]}>
      {React.isValidElement(icon) ? icon : null}
    </View>
  );
}

function Badge({ label }: { label: string }) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  return (
    <View style={[styles.badge, { borderColor }]}>
      <ThemedText style={[styles.badgeText, { color: textColor }]}>{label}</ThemedText>
    </View>
  );
}

export default function FollowingGrid() {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const textColor = useThemeColor({}, 'text');

  const handleDiscoverOutlets = () => {
    // TODO: Navigate to media discovery screen
    console.log('Discover outlets');
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>Media Outlets</ThemedText>
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            handleDiscoverOutlets();
          }}
        >
          <ThemedText style={[styles.discoverText, { color: tintColor }]}>Add New</ThemedText>
        </Pressable>
      </View>

      {/* Grid */}
      {DATA.length === 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.emptyState,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            handleDiscoverOutlets();
          }}
        >
          <Feather name="radio" size={48} color={mutedTextColor} />
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
            No Media Outlets Yet
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }]}>
            Tap to discover podcasts, news outlets, and other media
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {DATA.map((item, idx) => (
            <Pressable
              key={item.name}
              style={({ pressed }) => [
                styles.card,
                {
                  borderColor,
                  backgroundColor: pressed ? backgroundColor : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                console.log('Pressed media outlet:', item.name);
              }}
            >
              {item.type === 'company' ? (
                <Avatar image={item.image!} />
              ) : (
                <IconWithBackground icon={<Feather name={item.icon as any} size={24} color={tintColor} />} />
              )}
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>{item.name}</ThemedText>
              <Badge label={item.badge} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  discoverText: {
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 12,
    marginHorizontal: '1%',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 4,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  badgeText: {
    fontWeight: '500',
    fontSize: 11,
  },
}); 