import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';

const DATA = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
  },
];

function IconWithBackground({ icon }: { icon: React.ReactElement }) {
  const borderColor = useThemeColor({}, 'border');
  return (
    <View style={[styles.iconBg, { backgroundColor: borderColor + '22' }]}> 
      {React.isValidElement(icon) ? icon : null}
    </View>
  );
}

export default function DocumentsList() {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>Documents</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.uploadButton,
            { backgroundColor: pressed ? tintColor + '22' : backgroundColor, borderColor: tintColor },
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            // handle upload
          }}
        >
          <Feather name="plus" size={16} color={tintColor} style={{ marginRight: 6 }} />
          <ThemedText style={[styles.uploadText, { color: tintColor }]}>Upload</ThemedText>
        </Pressable>
      </View>
      {/* List */}
      <View style={styles.list}>
        {DATA.map((item) => (
          <View key={item.name} style={[styles.card, { borderColor }]}> 
            <IconWithBackground icon={<Feather name="file-text" size={24} color={tintColor} />} />
            <View style={styles.cardTextWrap}>
              <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
              <ThemedText style={styles.cardSubtitle}>{item.updated}</ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [styles.iconButton, { backgroundColor: pressed ? tintColor + '11' : 'transparent' }]}
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // handle download
              }}
            >
              <Feather name="download" size={20} color={tintColor} />
            </Pressable>
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
    paddingTop: 8,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  uploadText: {
    fontWeight: '600',
    fontSize: 15,
  },
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  cardTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 