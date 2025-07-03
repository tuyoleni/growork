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
  return (
    <Image source={{ uri: image }} style={styles.avatar} />
  );
}

function IconWithBackground({ icon }: { icon: React.ReactElement }) {
  const tintColor = useThemeColor({}, 'tint');
  return (
    <View style={[styles.iconBg, { backgroundColor: tintColor + '22' }]}> 
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

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>Following</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.discoverButton,
            { backgroundColor: pressed ? tintColor + '22' : backgroundColor, borderColor: tintColor },
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            // handle discover
          }}
        >
          <Feather name="plus" size={16} color={tintColor} style={{ marginRight: 6 }} />
          <ThemedText style={[styles.discoverText, { color: tintColor }]}>Discover</ThemedText>
        </Pressable>
      </View>
      {/* Grid */}
      <View style={styles.grid}>
        {DATA.map((item, idx) => (
          <View key={item.name} style={[styles.card, { borderColor }]}> 
            {item.type === 'company' ? (
              <Avatar image={item.image!} />
            ) : (
              <IconWithBackground icon={<Feather name={item.icon as any} size={32} color={tintColor} />} />
            )}
            <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
            <Badge label={item.badge} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  discoverText: {
    fontWeight: '600',
    fontSize: 15,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 12,
    justifyContent: 'flex-start',
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 2,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
}); 