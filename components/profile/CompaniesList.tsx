import { useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useAuth } from '@/hooks';
import { Company } from '@/types';
import { useRouter } from 'expo-router';
import { usePermissions } from '@/hooks';
import { useCompanies } from '@/hooks';


export default function CompaniesList() {
  const { user } = useAuth();
  const router = useRouter();
  const { isBusinessUser } = usePermissions();
  const { companies, fetchCompanies } = useCompanies();
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const cardBg = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);


  const handleCreateCompany = () => {
    if (!isBusinessUser) return;
    router.push('/profile/CompanyManagement');
  };



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
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No Companies Yet</ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }]}>
            {isBusinessUser ? 'Tap the Add New button to create your first company profile' : 'Only business accounts can create company profiles.'}
          </ThemedText>
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
              onPress={() => router.push(`/profile/CompanyManagement?id=${company.id}`)}
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