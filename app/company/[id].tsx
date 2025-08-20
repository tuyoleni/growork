import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    StatusBar,
    useColorScheme,
    StyleSheet
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Company } from '../../types/company';
import ScreenContainer from '../../components/ScreenContainer';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import ThemedButton from '../../components/ui/ThemedButton';
import {
    CompanyHeader,
    CompanyStats,
    CompanyContact,
    CompanyOwner,
    CompanyPosts
} from '../../components/company';
import { useCompanies } from '../../hooks/companies';
import { useThemeColor } from '../../hooks';
import { supabase } from '../../utils/supabase';




export default function CompanyDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { getCompanyByIdPublic, getCompanyByUserId, debugCompanyTable } = useCompanies();

    // Theme colors
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const tintColor = useThemeColor({}, 'tint');

    const [company, setCompany] = useState<Company | null>(null);
    const [companyOwner, setCompanyOwner] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const functionsRef = useRef({
        getCompanyByIdPublic,
        getCompanyByUserId
    });

    // Update refs when functions change
    useEffect(() => {
        functionsRef.current = {
            getCompanyByIdPublic,
            getCompanyByUserId
        };
    }, [getCompanyByIdPublic, getCompanyByUserId]);

    // Debug company table on component mount
    useEffect(() => {
        debugCompanyTable();
    }, [debugCompanyTable]);

    const fetchCompanyOwner = useCallback(async (userId: string) => {
        try {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching company owner profile:', error);
                return;
            }

            if (profileData) {
                setCompanyOwner(profileData);
            }
        } catch (error) {
            console.error('Error fetching company owner:', error);
        }
    }, []);

    const fetchCompanyDetails = useCallback(async () => {
        if (!id) return;

        try {
            setLoading(true);
            console.log('Fetching company with ID:', id);

            const { company: companyResult, error } = await functionsRef.current.getCompanyByIdPublic(id);

            if (error) {
                console.error('Company fetch error:', error);
                throw new Error(error);
            }

            if (companyResult) {
                console.log('Company found:', companyResult.name);
                setCompany(companyResult);

                // Fetch company owner's profile for contact information
                await fetchCompanyOwner(companyResult.user_id);
            } else {
                console.log('No company found with ID:', id);
                throw new Error('Company not found');
            }

        } catch (error: any) {
            console.error('Error fetching company details:', error);

            // Provide more helpful error messages
            let errorMessage = 'Failed to load company details';
            if (error.message.includes('network') || error.message.includes('timeout')) {
                errorMessage = 'Network connection issue. Please check your internet connection and try again.';
            } else if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. Please log in again.';
            } else if (error.message.includes('not found') || error.message.includes('multiple rows')) {
                errorMessage = 'Company not found. It may have been removed or made private.';
            } else if (error.message.includes('JSON object requested')) {
                errorMessage = 'Company data is corrupted. Please try again later.';
            }

            console.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id, fetchCompanyOwner]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchCompanyDetails();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchCompanyDetails();
    }, [id, fetchCompanyDetails]);

    if (loading) {
        return (
            <ScreenContainer>
                <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
                        Loading company details...
                    </ThemedText>
                </View>
            </ScreenContainer>
        );
    }

    if (!company) {
        return (
            <ScreenContainer>
                <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <Feather name="home" size={48} color={mutedTextColor} style={{ marginBottom: 16 }} />
                    <ThemedText style={[styles.loadingText, { color: textColor, marginBottom: 16 }]}>
                        Company not found
                    </ThemedText>
                    <ThemedButton title="Go Back" onPress={() => router.back()} />
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => router.back()}
                    >
                        <Feather name="arrow-left" size={20} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Company</ThemedText>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {/* Share company */ }}
                    >
                        <Feather name="share" size={20} color={textColor} />
                    </TouchableOpacity>
                </View>
            </ThemedView>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={tintColor}
                    />
                }
            >


                {/* Company Header */}
                <CompanyHeader
                    company={company}
                    isFollowing={isFollowing}
                    onFollowToggle={() => setIsFollowing(!isFollowing)}
                />

                {/* Company Stats */}
                <CompanyStats
                    companyId={id}
                />

                {/* Company Contact */}
                <CompanyContact
                    website={company.website}
                    hasPhone={!!companyOwner?.phone}
                    onWebsitePress={() => {
                        // Handle website press
                        console.log('Website pressed:', company.website);
                    }}
                    onPhonePress={() => {
                        // Handle phone press
                        console.log('Phone pressed:', companyOwner?.phone);
                    }}
                />

                {/* Company Owner */}
                {companyOwner && (
                    <CompanyOwner
                        owner={companyOwner}
                        onContactPress={() => {
                            // Navigate to owner profile
                            console.log('Contact owner:', companyOwner.id);
                        }}
                    />
                )}

                {/* Company Posts */}
                <CompanyPosts
                    companyId={id}
                />
            </ScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "rgba(255,255,255,0.9)",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 10,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerButton: {
        padding: 10,
        borderRadius: 20,
    },

    // Loader
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    loadingText: {
        fontSize: 15,
        opacity: 0.6,
        marginTop: 12,
    },
}); 