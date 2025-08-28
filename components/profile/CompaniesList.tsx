import { useThemeColor , useAuth , usePermissions , useCompanies } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Company } from '@/types/company';
import { useRouter } from 'expo-router';


export default function CompaniesList() {
  const { user } = useAuth();
  const router = useRouter();
  const { isBusinessUser } = usePermissions();
  const { fetchCompanies, getAllCompaniesByUserId } = useCompanies();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const cardBg = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const loadCompanies = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        if (isBusinessUser) {
          await fetchCompanies(); // Business users see companies they manage
        } else {
          // Non-business users see companies they follow
          const { companies: followedCompanies } = await getAllCompaniesByUserId(user.id);
          setCompanies(followedCompanies || []);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        setError('Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [user, isBusinessUser]);


  const handleCreateCompany = () => {
    if (!isBusinessUser) return;
    router.push('/profile/CompanyManagement');
  };



  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerTitle}>Companies</ThemedText>
        {isBusinessUser && (
          <Pressable
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              handleCreateCompany();
            }}
          >
            <ThemedText style={[styles.addButtonText, { color: tintColor }]}>Add New</ThemedText>
          </Pressable>
        )}
      </View>

      {companies.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="briefcase" size={48} color={mutedTextColor} />
          {isBusinessUser ? (
            <>
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                Get started with your companies
              </ThemedText>
              <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }, styles.textCenter]}>
                Tap the Add New button to create your first company profile
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                Follow companies you're interested in
              </ThemedText>
              <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }, styles.textCenter]}>
                Browse companies and tap the follow button to see their updates here
              </ThemedText>
            </>
          )}
        </View>
      ) : (
        <ThemedView style={styles.companiesList}>
          {companies.map((company: Company) => (
            <Pressable
              key={company.id}
              style={({ pressed }) => [
                styles.companyCard,
                {
                  backgroundColor: pressed ? cardBg : backgroundColor,
                  borderColor,
                  shadowColor: colorScheme === 'dark' ? '#000' : '#000',
                }
              ]}
              onPress={() => {
                if (isBusinessUser) {
                  router.push(`/profile/CompanyManagement?id=${company.id}`);
                } else {
                  router.push(`/company/${company.id}`);
                }
              }}
            >
              <Image
                source={{
                  uri: company.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=64`
                }}
                style={styles.companyLogo}
              />
              <ThemedView style={styles.companyInfo}>
                <ThemedText style={[styles.companyName, { color: textColor }]}>
                  {company.name}
                </ThemedText>
                {company.description && (
                  <ThemedText style={[styles.companyDescription, { color: mutedTextColor }]}>
                    {company.description}
                  </ThemedText>
                )}
                <ThemedView style={styles.companyMeta}>
                  {company.industry && (
                    <ThemedText style={[styles.companyMetaText, { color: mutedTextColor }]}>
                      {company.industry}
                    </ThemedText>
                  )}
                  {company.location && (
                    <ThemedText style={[styles.companyMetaText, { color: mutedTextColor }]}>
                      {company.location}
                    </ThemedText>
                  )}
                </ThemedView>
              </ThemedView>
              <Feather name="chevron-right" size={16} color={mutedTextColor} />
            </Pressable>
          ))}
        </ThemedView>
      )}
    </ThemedView>
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

  addButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  companiesList: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  companyCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  companyDescription: {
    fontSize: 12,
  },
  companyMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  companyMetaText: {
    fontSize: 12,
  },

}); 