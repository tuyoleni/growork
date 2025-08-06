import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, useColorScheme, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ThemedInput } from '../ThemedInput';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/superbase';
import { Company } from '@/types';
import { useRouter } from 'expo-router';

const PADDING = 16;

export default function CompaniesList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const cardBg = useThemeColor({}, 'backgroundSecondary');

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    router.push('/profile/CompanyManagement');
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
          Loading companies...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          My Companies
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? cardBg : backgroundColor, borderColor }
          ]}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            handleCreateCompany();
          }}
        >
          <Feather name="plus" size={16} color={textColor} />
          <ThemedText style={[styles.addButtonText, { color: textColor }]}>
            Add Company
          </ThemedText>
        </Pressable>
      </ThemedView>

      {companies.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Feather name="briefcase" size={48} color={mutedTextColor} />
          <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
            No Companies Yet
          </ThemedText>
          <ThemedText style={[styles.emptyDescription, { color: mutedTextColor }]}>
            Create your first company profile to start posting jobs and content.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: pressed ? cardBg : backgroundColor, borderColor }
            ]}
            onPress={handleCreateCompany}
          >
            <ThemedText style={[styles.createButtonText, { color: textColor }]}>
              Create Company
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <ThemedView style={styles.companiesList}>
          {companies.map((company) => (
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
    flex: 1,
    padding: PADDING,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  companiesList: {
    gap: 12,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  companyMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  companyMetaText: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 