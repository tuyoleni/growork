import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

const PADDING = 16;

const DATA = [
  {
    name: 'Figma',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3037f2d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Leading provider of collaborative design tools for teams.',
    jobs: 84,
  },
  {
    name: 'Airbnb',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Marketplace for lodging, primarily homestays for vacation rentals.',
    jobs: 126,
  },
  {
    name: 'Google',
    image: 'https://images.unsplash.com/photo-1617170788836-663b3bf692c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Global technology leader in search, advertising, and cloud computing.',
    jobs: 245,
  },
  {
    name: 'Stripe',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Online payment processing for internet businesses.',
    jobs: 60,
  },
  {
    name: 'Netflix',
    image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Streaming entertainment service for movies and TV shows.',
    jobs: 33,
  },
  {
    name: 'Shopify',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'E-commerce platform for online stores and retail point-of-sale systems.',
    jobs: 41,
  },
  {
    name: 'Meta',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Social technology company connecting people worldwide.',
    jobs: 99,
  },
  {
    name: 'Amazon',
    image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'E-commerce, cloud computing, and digital streaming giant.',
    jobs: 210,
  },
  {
    name: 'Microsoft',
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Global leader in software, services, devices, and solutions.',
    jobs: 120,
  },
  {
    name: 'Tesla',
    image: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    description: 'Electric vehicles, clean energy, and battery products.',
    jobs: 55,
  },
];

function Avatar({ image }: { image: string }) {
  return <Image source={{ uri: image }} style={styles.avatar} />;
}

function Badge({ label, icon }: { label: string; icon?: React.ReactElement }) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  return (
    <ThemedView style={[styles.badge, { borderColor }]}>
      {icon ? <ThemedView style={{ marginRight: 4 }}>{icon}</ThemedView> : null}
      <ThemedText style={[styles.badgeText, { color: textColor }]}>{label}</ThemedText>
    </ThemedView>
  );
}

export default function CompaniesList() {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const cardBg = backgroundColor;
  const [search, setSearch] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const searchBg = useThemeColor({}, 'backgroundSecondary');
  const placeholderTextColor = useThemeColor({}, 'mutedText');

  // Filter and pagination logic
  const COMPANIES_PER_PAGE = 3;
  const [page, setPage] = useState(1);
  const filteredData = DATA.filter(company =>
    company.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredData.length / COMPANIES_PER_PAGE));
  const paginatedData = filteredData.slice((page - 1) * COMPANIES_PER_PAGE, page * COMPANIES_PER_PAGE);
  // Reset to page 1 if search changes and current page is out of range
  useEffect(() => {
    if ((page - 1) * COMPANIES_PER_PAGE >= filteredData.length) {
      setPage(1);
    }
  }, [search, filteredData.length]);

  return (
    <ThemedView style={styles.container}>
      {/* Search + Header */}
      <ThemedView style={[styles.headerCard, { backgroundColor: backgroundColor }]}>
        <ThemedView style={[styles.searchRow, { backgroundColor: searchBg }]}>
          <Feather name="search" size={18} color={tintColor} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search companies..."
            placeholderTextColor={placeholderTextColor}
            value={search}
            onChangeText={setSearch}
          />
        </ThemedView>
        <ThemedView style={styles.headerRow}>
          <ThemedText style={styles.headerTitle}>Following Companies</ThemedText>
          <ThemedText style={styles.headerCount}>{filteredData.length}</ThemedText>
        </ThemedView>
      </ThemedView>
      {/* Companies List */}
      <ThemedView style={styles.list}>
        {paginatedData.map((item, idx) => (
          <ThemedView
            key={item.name}
            style={[
              styles.card,
              { paddingHorizontal: 0 },
              (idx !== paginatedData.length - 1 || page * COMPANIES_PER_PAGE < filteredData.length) && { borderBottomWidth: 1, borderBottomColor: borderColor },
            ]}
          >
            <ThemedView style={styles.cardInnerNew}>
              {/* Top row: avatar, job count, unfollow */}
              <ThemedView style={styles.topRowNew}>
                <Avatar image={item.image} />
                <ThemedView style={styles.titleAndJobsRow}>
                  <ThemedText style={styles.cardTitleContentCard} numberOfLines={1} ellipsizeMode="tail">{item.name}</ThemedText>
                  <ThemedView style={styles.jobsRow}>
                    <Feather name="briefcase" size={14} color={textColor} style={{ marginRight: 4 }} />
                    <ThemedText style={[styles.jobsText, { color: mutedText }]}>{item.jobs} jobs</ThemedText>
                  </ThemedView>
                </ThemedView>
                <Pressable
                  style={({ pressed }) => [
                    styles.unfollowButton,
                    { backgroundColor: pressed ? borderColor + '22' : 'transparent', borderColor },
                  ]}
                  onPress={() => {
                    if (process.env.EXPO_OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    // handle unfollow
                  }}
                >
                  <ThemedText style={[styles.unfollowText, { color: textColor }]}>Unfollow</ThemedText>
                </Pressable>
              </ThemedView>
              {/* Info: description only */}
              <ThemedText style={[styles.cardDescriptionContentCard, { color: textColor, opacity: 0.6 }]} numberOfLines={2} ellipsizeMode="tail">
                {item.description}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        ))}
      </ThemedView>
      {/* Pagination */}
      <ThemedView style={styles.paginationRow}>
        <Pressable
          style={({ pressed }) => [
            styles.pageButton,
            { backgroundColor: pressed ? borderColor + '22' : backgroundColor, borderColor },
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setPage((prev) => Math.max(1, prev - 1));
          }}
          disabled={page === 1}
        >
          <Feather name="chevron-left" size={16} color={textColor} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.pageText, { color: textColor }]}>Previous</ThemedText>
        </Pressable>
        <ThemedText style={styles.pageLabel}>Page {page} of {totalPages}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.pageButton,
            { backgroundColor: pressed ? borderColor + '22' : backgroundColor, borderColor },
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setPage((prev) => Math.min(totalPages, prev + 1));
          }}
          disabled={page === totalPages}
        >
          <ThemedText style={[styles.pageText, { color: textColor, marginRight: 4 }]}>Next</ThemedText>
          <Feather name="chevron-right" size={16} color={textColor} />
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardLeftContentCard: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  cardInfoContentCard: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', marginLeft: 10, minWidth: 0 },
  cardTitleContentCard: { fontWeight: 'bold', fontSize: 15, marginBottom: 2 },
  cardDescriptionContentCard: { fontSize: 13, marginBottom: 4, fontWeight: '400' },
  tagRowContentCard: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  tagContentCard: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 6, marginBottom: 2 },
  tagTextContentCard: { fontSize: 12, fontWeight: '500' },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unfollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  unfollowText: {
    fontWeight: '600',
    fontSize: 15,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
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
  paginationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: PADDING,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pageText: {
    fontWeight: '600',
    fontSize: 15,
  },
  pageLabel: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 8,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 2,
  },
  cardInnerNew: { flexDirection: 'column', alignItems: 'flex-start', flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  topRowNew: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 10, marginBottom: 4, justifyContent: 'space-between' },
  titleAndJobsRow: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', marginLeft: 10, minWidth: 0 },
  jobsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  jobsText: { fontSize: 13, fontWeight: '500' },
}); 