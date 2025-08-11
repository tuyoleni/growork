import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Pressable,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Company, CompanyFormData } from '@/types';
import { STORAGE_BUCKETS , uploadImage } from '@/utils/uploadUtils';
import { ThemedText } from '@/components/ThemedText';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
// Using SettingsList inputs instead of standalone input
// import { ThemedInput } from '@/components/ThemedInput';
import SettingsList from '@/components/ui/SettingsList';
import { useCompanies } from '@/hooks/useCompanies';
import ScreenContainer from '@/components/ScreenContainer';

// interface SettingsItemProps {
//     title: string;
//     subtitle?: string;
//     icon: string;
//     onPress?: () => void;
//     showArrow?: boolean;
//     showSwitch?: boolean;
//     switchValue?: boolean;
//     onSwitchChange?: (value: boolean) => void;
//     destructive?: boolean;
//     iconColor?: string;
//     rightComponent?: React.ReactNode;
// }

// interface SettingsSection {
//     title: string;
//     data: SettingsItemProps[];
// }

// interface EditModalProps {
//     visible: boolean;
//     title: string;
//     value: string;
//     placeholder: string;
//     onSave: (value: string) => void;
//     onCancel: () => void;
//     multiline?: boolean;
//     keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
// }

// Deprecated modal (replaced by inline SettingsList inputs)

export default function CompanyManagement() {
    const router = useRouter();
    const { id, prefillName, prefillIndustry, prefillLocation } = useLocalSearchParams<{ id?: string; prefillName?: string; prefillIndustry?: string; prefillLocation?: string }>();
    const { user, profile } = useAuth();
    const { isBusinessUser } = usePermissions();
    const [loading, setLoading] = useState(false);
    // const [uploading, setUploading] = useState(false); // used in logo upload flow
    const [error, setError] = useState<string | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [selectedLogoUri, setSelectedLogoUri] = useState<string | null>(null);
    // const [editModal, setEditModal] = useState<{
    //     visible: boolean;
    //     field: keyof CompanyFormData;
    //     title: string;
    //     placeholder: string;
    //     multiline?: boolean;
    //     keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
    // }>({
    //     visible: false,
    //     field: 'name',
    //     title: '',
    //     placeholder: '',
    // });

    const [editedCompany, setEditedCompany] = useState<CompanyFormData>({
        name: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        founded_year: '',
        location: '',
    });

    const borderColor = useThemeColor({}, 'border');
    const tintColor = useThemeColor({}, 'tint');
    // const mutedTextColor = useThemeColor({}, 'mutedText');
    const backgroundColor = useThemeColor({}, 'background');

    const { getCompanyById, createCompany, updateCompany, updateCompanyLogo } = useCompanies();

    useEffect(() => {
        const init = async () => {
            if (id) {
                const result = await getCompanyById(id);
                if (!result || (result as any).error) return;
                const { company: dbCompany } = result as { company: Company };
                if (dbCompany) {
                    setCompany(dbCompany);
                    setEditedCompany({
                        name: dbCompany.name || '',
                        description: dbCompany.description || '',
                        website: dbCompany.website || '',
                        industry: dbCompany.industry || '',
                        size: dbCompany.size || '',
                        founded_year: dbCompany.founded_year?.toString() || '',
                        location: dbCompany.location || '',
                    });
                    return;
                }
            }
            // Prefill fields if coming from a job post
            if (!id) {
                setEditedCompany((prev) => ({
                    ...prev,
                    name: prefillName && typeof prefillName === 'string' ? decodeURIComponent(prefillName) : prev.name,
                    industry: prefillIndustry && typeof prefillIndustry === 'string' ? decodeURIComponent(prefillIndustry) : prev.industry,
                    location: prefillLocation && typeof prefillLocation === 'string' ? decodeURIComponent(prefillLocation) : prev.location,
                }));
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, prefillName]);

    useEffect(() => {
        // Only enforce restriction once profile is available
        if (profile && !isBusinessUser) {
            Alert.alert('Restricted', 'Only business accounts can create and manage companies.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, isBusinessUser]);

    // fetchCompany removed in favor of useCompanies.getCompanyById

    const handleSave = async () => {
        if (!user || !profile) return;

        if (!editedCompany.name?.trim()) {
            Alert.alert('Error', 'Company name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Normalize founded_year to integer or null (avoid empty string which breaks integer column)
            const foundedYearInput = (editedCompany.founded_year || '').toString().trim();
            const parsedYear = foundedYearInput ? parseInt(foundedYearInput, 10) : NaN;
            const foundedYearValue = Number.isFinite(parsedYear) ? parsedYear : null;

            const companyData = {
                name: (editedCompany.name || '').trim(),
                description: (editedCompany.description || '').trim() || null,
                website: (editedCompany.website || '').trim() || null,
                industry: (editedCompany.industry || '').trim() || null,
                size: (editedCompany.size || '').trim() || null,
                founded_year: foundedYearValue,
                location: (editedCompany.location || '').trim() || null,
            } as any;

            if (id) {
                const res = await updateCompany(id, companyData);
                if ((res as any).error) throw new Error((res as any).error);
                // If a new logo was selected, upload and update
                if (selectedLogoUri) {
                    const publicUrl = await uploadImage({
                        bucket: STORAGE_BUCKETS.AVATARS,
                        userId: user.id,
                        uri: selectedLogoUri,
                        fileNamePrefix: 'company-logo'
                    });
                    if (!publicUrl) throw new Error('Failed to upload logo');
                    const up = await updateCompanyLogo(id, publicUrl);
                    if ((up as any).error) throw new Error((up as any).error);
                    setCompany(prev => prev ? { ...prev, logo_url: publicUrl } : prev);
                }
            } else {
                const res = await createCompany(companyData as any);
                if ((res as any).error) throw new Error((res as any).error);
                const newCompany = (res as any).company as Company | undefined;
                if (newCompany && selectedLogoUri) {
                    const publicUrl = await uploadImage({
                        bucket: STORAGE_BUCKETS.AVATARS,
                        userId: user.id,
                        uri: selectedLogoUri,
                        fileNamePrefix: 'company-logo'
                    });
                    if (!publicUrl) throw new Error('Failed to upload logo');
                    const up = await updateCompanyLogo(newCompany.id, publicUrl);
                    if ((up as any).error) throw new Error((up as any).error);
                }
            }

            Alert.alert('Success', `Company ${id ? 'updated' : 'created'} successfully!`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            setError(e.message || `Failed to ${id ? 'update' : 'create'} company`);
            Alert.alert('Error', e.message || `Failed to ${id ? 'update' : 'create'} company`);
        } finally {
            setLoading(false);
        }
    };

    const pickLogo = async () => {
        if (!user) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        try {
            setError(null);
            const uri = result.assets[0].uri;
            // If company exists, upload immediately; else just stage for save
            if (company) {
                const publicUrl = await uploadImage({
                    bucket: STORAGE_BUCKETS.AVATARS,
                    userId: user.id,
                    uri,
                    fileNamePrefix: 'company-logo'
                });
                if (!publicUrl) throw new Error('Failed to upload logo');
                const up = await updateCompanyLogo(company.id, publicUrl);
                if ((up as any).error) throw new Error((up as any).error);
                setCompany({ ...company, logo_url: publicUrl });
                Alert.alert('Success', 'Company logo updated!');
            } else {
                setSelectedLogoUri(uri);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to update logo');
        }
    };

    // const openEditModal = (field: keyof CompanyFormData, title: string, placeholder: string, multiline = false, keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url' = 'default') => {
    //     setEditModal({
    //         visible: true,
    //         field,
    //         title,
    //         placeholder,
    //         multiline,
    //         keyboardType,
    //     });
    // };

    // const handleFieldSave = async (value: string) => {
    //     const field = editModal.field;
    //     setEditedCompany({ ...editedCompany, [field]: value });
    //     setEditModal({ ...editModal, visible: false });
    // };

    // Inline input UI; settingsData removed

    if (loading) {
        return (
            <ScreenContainer>
                <StatusBar barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <ThemedText style={styles.loadingText}>Loading company...</ThemedText>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer>
            <StatusBar barStyle="dark-content" />

            {/* Header (like Edit Profile) */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color={tintColor} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>
                    {id ? 'Edit Company' : 'Create Company'}
                </ThemedText>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color={tintColor} />
                    ) : (
                        <ThemedText style={[styles.saveButtonText, { color: tintColor }]}>Save</ThemedText>
                    )}
                </TouchableOpacity>
            </View>

            {/* Logo picker (like avatar) */}
            <Pressable onPress={pickLogo} style={styles.logoPicker}>
                <ThemedAvatar
                    image={
                        (selectedLogoUri as string) ||
                        (company?.logo_url as string) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(editedCompany.name || 'Company')}&size=80`
                    }
                    size={80}
                >
                    <View style={[styles.logoOverlay, { backgroundColor: tintColor }]}>
                        <Feather name="camera" size={16} color={backgroundColor} />
                    </View>
                </ThemedAvatar>
            </Pressable>

            <SettingsList
                sections={[
                    {
                        title: 'Basic Information',
                        data: [
                            {
                                title: 'Company Name',
                                subtitle: editedCompany.name || 'Not set',
                                icon: 'building',
                                showTextInput: true,
                                textInputValue: editedCompany.name,
                                textInputPlaceholder: 'Enter your company name',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, name: text })),
                            },
                            {
                                title: 'Description',
                                subtitle: editedCompany.description || 'No description added',
                                icon: 'file-text',
                                showTextInput: true,
                                textInputValue: editedCompany.description,
                                textInputPlaceholder: 'Describe your company...',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, description: text })),
                                textInputProps: { multiline: true, numberOfLines: 3 },
                            },
                            {
                                title: 'Industry',
                                subtitle: editedCompany.industry || 'Not set',
                                icon: 'briefcase',
                                showTextInput: true,
                                textInputValue: editedCompany.industry,
                                textInputPlaceholder: 'e.g., Technology, Healthcare',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, industry: text })),
                            },
                        ],
                    },
                    {
                        title: 'Company Details',
                        data: [
                            {
                                title: 'Website',
                                subtitle: editedCompany.website || 'Not set',
                                icon: 'globe',
                                showTextInput: true,
                                textInputValue: editedCompany.website,
                                textInputPlaceholder: 'https://example.com',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, website: text })),
                            },
                            {
                                title: 'Company Size',
                                subtitle: editedCompany.size || 'Not set',
                                icon: 'users',
                                showTextInput: true,
                                textInputValue: editedCompany.size,
                                textInputPlaceholder: 'e.g., 1-10, 11-50, 51-200',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, size: text })),
                            },
                            {
                                title: 'Founded Year',
                                subtitle: editedCompany.founded_year ? editedCompany.founded_year : 'Not set',
                                icon: 'calendar',
                                showTextInput: true,
                                textInputValue: editedCompany.founded_year,
                                textInputPlaceholder: 'e.g., 2020',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, founded_year: text })),
                                textInputProps: { keyboardType: 'numeric' },
                            },
                            {
                                title: 'Location',
                                subtitle: editedCompany.location || 'Not set',
                                icon: 'map-pin',
                                showTextInput: true,
                                textInputValue: editedCompany.location,
                                textInputPlaceholder: 'City, Country',
                                onTextInputChange: (text: string) => setEditedCompany((p) => ({ ...p, location: text })),
                            },
                        ],
                    },
                ]}
            />

            {error && (
                <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
            )}

            {/* Inline inputs version - modal removed */}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 44,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    saveButton: {
        padding: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    headerButtonDisabled: {
        opacity: 0.5,
    },
    headerButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    logoPicker: {
        alignSelf: 'center',
        marginVertical: 24,
    },
    logoOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 16,
        padding: 6,
    },
    errorContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fee',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fcc',
    },
    errorText: {
        color: '#c33',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 44,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    modalInput: {
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
    },
}); 