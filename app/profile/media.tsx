import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';

interface MediaOutlet {
  id: string;
  name: string;
  type: 'podcast' | 'news' | 'voice' | 'video';
  description?: string;
  url?: string;
  logo_url?: string;
  is_followed: boolean;
}

const MEDIA_TYPES = [
  { id: 'podcast', label: 'Podcasts', icon: 'radio' },
  { id: 'news', label: 'News', icon: 'newspaper' },
  { id: 'voice', label: 'Voice Content', icon: 'mic' },
  { id: 'video', label: 'Video', icon: 'video' },
];

export default function MediaOutletsManagement() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
  const [mediaOutlets, setMediaOutlets] = useState<MediaOutlet[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMediaOutlets();
    }
  }, [user]);

  const fetchMediaOutlets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // This would fetch from a media_outlets table
      // For now, we'll use mock data
      const mockOutlets: MediaOutlet[] = [
        {
          id: '1',
          name: 'TechCrunch',
          type: 'news',
          description: 'Latest technology news and startup coverage',
          url: 'https://techcrunch.com',
          is_followed: true,
        },
        {
          id: '2',
          name: 'The Verge',
          type: 'news',
          description: 'Technology, science, art, and culture',
          url: 'https://theverge.com',
          is_followed: false,
        },
        {
          id: '3',
          name: 'Lex Fridman Podcast',
          type: 'podcast',
          description: 'Conversations about AI, science, technology, history, philosophy',
          url: 'https://lexfridman.com',
          is_followed: true,
        },
        {
          id: '4',
          name: 'Joe Rogan Experience',
          type: 'podcast',
          description: 'Long form conversations with interesting people',
          url: 'https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk',
          is_followed: false,
        },
      ];

      setMediaOutlets(mockOutlets);
    } catch (error: any) {
      console.error('Error fetching media outlets:', error);
      Alert.alert('Error', 'Failed to load media outlets');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowOutlet = async (outletId: string) => {
    try {
      setMediaOutlets(prev =>
        prev.map(outlet =>
          outlet.id === outletId
            ? { ...outlet, is_followed: !outlet.is_followed }
            : outlet
        )
      );

      // This would update the database
      console.log('Follow/unfollow outlet:', outletId);
    } catch (error: any) {
      console.error('Error following outlet:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleAddOutlet = () => {
    Alert.alert('Coming Soon', 'Add custom media outlet feature will be available soon!');
  };

  const handleDiscoverOutlets = () => {
    Alert.alert('Coming Soon', 'Media outlet discovery feature will be available soon!');
  };

  const filteredOutlets = selectedType === 'all'
    ? mediaOutlets
    : mediaOutlets.filter(outlet => outlet.type === selectedType);

  const getTypeIcon = (type: string) => {
    const mediaType = MEDIA_TYPES.find(t => t.id === type);
    return mediaType?.icon || 'globe';
  };

  const getTypeLabel = (type: string) => {
    const mediaType = MEDIA_TYPES.find(t => t.id === type);
    return mediaType?.label || 'Other';
  };

  if (loading) {
    return (
      <ScreenContainer>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading media outlets...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          Media Outlets
        </ThemedText>
        <View style={styles.headerRight} />
      </ThemedView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeFilter}
          contentContainerStyle={styles.typeFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.typeChip,
              selectedType === 'all' && { backgroundColor: tintColor }
            ]}
            onPress={() => setSelectedType('all')}
          >
            <ThemedText style={[
              styles.typeChipText,
              selectedType === 'all' && { color: backgroundColor }
            ]}>
              All
            </ThemedText>
          </TouchableOpacity>

          {MEDIA_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && { backgroundColor: tintColor }
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Feather
                name={type.icon as any}
                size={16}
                color={selectedType === type.id ? backgroundColor : textColor}
              />
              <ThemedText style={[
                styles.typeChipText,
                selectedType === type.id && { color: backgroundColor }
              ]}>
                {type.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Actions Section */}
        <ThemedView style={styles.actionsSection}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor }]}
              onPress={handleAddOutlet}
            >
              <Feather name="plus" size={16} color={textColor} />
              <ThemedText style={[styles.actionButtonText, { color: textColor }]}>
                Add Custom
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor }]}
              onPress={handleDiscoverOutlets}
            >
              <Feather name="search" size={16} color={textColor} />
              <ThemedText style={[styles.actionButtonText, { color: textColor }]}>
                Discover
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Media Outlets List */}
        <ThemedView style={styles.outletsSection}>
          <ThemedText style={styles.sectionTitle}>
            My Media Outlets ({filteredOutlets.length})
          </ThemedText>

          {filteredOutlets.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <Feather name="radio" size={48} color={mutedTextColor} />
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                No media outlets found
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: mutedTextColor }]}>
                Follow media outlets you&apos;re interested in to stay updated
              </ThemedText>
              <TouchableOpacity
                style={[styles.discoverButton, { borderColor }]}
                onPress={handleDiscoverOutlets}
              >
                <ThemedText style={[styles.discoverButtonText, { color: textColor }]}>
                  Discover Outlets
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <View style={styles.outletsList}>
              {filteredOutlets.map((outlet) => (
                <ThemedView key={outlet.id} style={[styles.outletCard, { borderColor }]}>
                  <View style={styles.outletInfo}>
                    <View style={[styles.outletIcon, { backgroundColor: tintColor + '20' }]}>
                      <Feather
                        name={getTypeIcon(outlet.type) as any}
                        size={20}
                        color={tintColor}
                      />
                    </View>
                    <View style={styles.outletDetails}>
                      <ThemedText style={styles.outletName}>
                        {outlet.name}
                      </ThemedText>
                      <ThemedText style={[styles.outletType, { color: mutedTextColor }]}>
                        {getTypeLabel(outlet.type)}
                      </ThemedText>
                      {outlet.description && (
                        <ThemedText style={[styles.outletDescription, { color: mutedTextColor }]}>
                          {outlet.description}
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  <View style={styles.outletActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // Handle outlet visit
                        console.log('Visit outlet:', outlet.url);
                      }}
                    >
                      <Feather name="external-link" size={16} color={textColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.followButton}
                      onPress={() => handleFollowOutlet(outlet.id)}
                    >
                      <Feather
                        name={outlet.is_followed ? "heart" : "heart"}
                        size={16}
                        color={outlet.is_followed ? "#ef4444" : mutedTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  typeFilter: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  typeFilterContent: {
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  outletsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  discoverButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  discoverButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  outletsList: {
    gap: 12,
  },
  outletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  outletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  outletIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outletDetails: {
    flex: 1,
  },
  outletName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  outletType: {
    fontSize: 12,
    marginBottom: 4,
  },
  outletDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  outletActions: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 