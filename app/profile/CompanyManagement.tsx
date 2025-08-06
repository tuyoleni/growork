import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Pressable,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Company, CompanyFormData } from '@/types';
import { supabase, STORAGE_BUCKETS } from '@/utils/superbase';
import { uploadImage } from '@/utils/uploadUtils';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedInput } from '@/components/ThemedInput';
import SettingsList from '@/components/ui/SettingsList';
import ScreenContainer from '@/components/ScreenContainer';

interface SettingsItemProps {
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    showArrow?: boolean;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    destructive?: boolean;
    iconColor?: string;
    rightComponent?: React.ReactNode;
}

interface SettingsSection {
    title: string;
    data: SettingsItemProps[];
}

interface EditModalProps {
    visible: boolean;
    title: string;
    value: string;
    placeholder: string;
    onSave: (value: string) => void;
    onCancel: () => void;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
}

const EditModal: React.FC<EditModalProps> = ({
    visible,
    title,
    value,
    placeholder,
    onSave,
    onCancel,
    multiline = false,
    keyboardType = 'default'
}) => {
    const [text, setText] = useState(value);
    const [loading, setLoading] = useState(false);
    const textColor = useThemeColor({}, 'text');
    const backgroundColor = useThemeColor({}, 'background');
    const borderColor = useThemeColor({}, 'border');
    const tintColor = useThemeColor({}, 'tint');

    useEffect(() => {
        setText(value);
    }, [value]);

    const handleSave = async () => {
        setLoading(true);
        await onSave(text);
        setLoading(false);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={[styles.modalContainer, { backgroundColor }]}>
                <StatusBar barStyle="dark-content" />

                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                    <Pressable onPress={onCancel} style={styles.modalButton}>
                        <ThemedText style={[styles.modalButtonText, { color: tintColor }]}>
                            Cancel
                        </ThemedText>
                    </Pressable>

                    <ThemedText style={styles.modalTitle}>{title}</ThemedText>

                    <Pressable
                        onPress={handleSave}
                        style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={tintColor} />
                        ) : (
                            <ThemedText style={[styles.modalButtonText, { color: tintColor }]}>
                                Save
                            </ThemedText>
                        )}
                    </Pressable>
                </View>

                {/* Modal Content */}
                <KeyboardAvoidingView
                    style={styles.modalContent}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TextInput
                        style={[
                            styles.modalInput,
                            {
                                color: textColor,
                                backgroundColor,
                                borderColor,
                                height: multiline ? 120 : 44
                            }
                        ]}
                        value={text}
                        onChangeText={setText}
                        placeholder={placeholder}
                        placeholderTextColor="#999"
                        multiline={multiline}
                        keyboardType={keyboardType}
                        autoFocus
                        textAlignVertical={multiline ? 'top' : 'center'}
                    />
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

export default function CompanyManagement() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [editModal, setEditModal] = useState<{
        visible: boolean;
        field: keyof CompanyFormData;
        title: string;
        placeholder: string;
        multiline?: boolean;
        keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
    }>({
        visible: false,
        field: 'name',
        title: '',
        placeholder: '',
    });

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
    const mutedTextColor = useThemeColor({}, 'mutedText');
    const backgroundColor = useThemeColor({}, 'background');

    useEffect(() => {
        if (id) {
            fetchCompany();
        }
    }, [id]);

    const fetchCompany = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setCompany(data);
                setEditedCompany({
                    name: data.name || '',
                    description: data.description || '',
                    website: data.website || '',
                    industry: data.industry || '',
                    size: data.size || '',
                    founded_year: data.founded_year?.toString() || '',
                    location: data.location || '',
                });
            }
        } catch (error: any) {
            console.error('Error fetching company:', error);
            Alert.alert('Error', 'Failed to load company');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user || !profile) return;

        if (!editedCompany.name?.trim()) {
            Alert.alert('Error', 'Company name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const companyData = {
                name: editedCompany.name?.trim(),
                description: editedCompany.description?.trim() || null,
                website: editedCompany.website?.trim() || null,
                industry: editedCompany.industry?.trim() || null,
                size: editedCompany.size || null,
                founded_year: editedCompany.founded_year ? parseInt(editedCompany.founded_year) : null,
                location: editedCompany.location?.trim() || null,
            };

            if (id) {
                // Update existing company
                const { error: updateError } = await supabase
                    .from('companies')
                    .update(companyData)
                    .eq('id', id)
                    .select()
                    .single();

                if (updateError) throw updateError;
            } else {
                // Create new company
                const { error: insertError } = await supabase
                    .from('companies')
                    .insert({
                        ...companyData,
                        user_id: profile.id,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
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

    const handleLogoUpload = async () => {
        if (!user || !company) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            setUploading(true);
            setError(null);

            const uri = result.assets[0].uri;
            const publicUrl = await uploadImage({
                bucket: STORAGE_BUCKETS.AVATARS,
                userId: user.id,
                uri,
                fileNamePrefix: 'company-logo'
            });

            if (!publicUrl) throw new Error('Failed to upload logo');

            const { error: updateError } = await supabase
                .from('companies')
                .update({ logo_url: publicUrl })
                .eq('id', company.id)
                .select()
                .single();

            if (updateError) throw updateError;

            setCompany({ ...company, logo_url: publicUrl });
            Alert.alert('Success', 'Company logo updated!');
        } catch (e: any) {
            setError(e.message || 'Failed to upload logo');
            Alert.alert('Error', e.message || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const openEditModal = (field: keyof CompanyFormData, title: string, placeholder: string, multiline = false, keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url' = 'default') => {
        setEditModal({
            visible: true,
            field,
            title,
            placeholder,
            multiline,
            keyboardType,
        });
    };

    const handleFieldSave = async (value: string) => {
        const field = editModal.field;
        setEditedCompany({ ...editedCompany, [field]: value });
        setEditModal({ ...editModal, visible: false });
    };

    const settingsData: SettingsSection[] = [
        {
            title: 'Company Logo',
            data: [
                {
                    title: 'Change Logo',
                    subtitle: 'Update your company logo',
                    icon: 'image',
                    onPress: handleLogoUpload,
                    rightComponent: id && company ? (
                        <View style={styles.logoPreview}>
                            <Image
                                source={{
                                    uri: company.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(editedCompany.name || 'Company')}&size=100`
                                }}
                                style={styles.logoImage}
                                contentFit="cover"
                            />
                        </View>
                    ) : undefined,
                },
            ]
        },
        {
            title: 'Basic Information',
            data: [
                {
                    title: 'Company Name',
                    subtitle: editedCompany.name || 'Not set',
                    icon: 'building',
                    onPress: () => openEditModal('name', 'Edit Company Name', 'Enter your company name'),
                },
                {
                    title: 'Description',
                    subtitle: editedCompany.description || 'No description added',
                    icon: 'file-text',
                    onPress: () => openEditModal('description', 'Edit Description', 'Describe your company...', true),
                },
                {
                    title: 'Industry',
                    subtitle: editedCompany.industry || 'Not set',
                    icon: 'briefcase',
                    onPress: () => openEditModal('industry', 'Edit Industry', 'e.g., Technology, Healthcare'),
                },
            ]
        },
        {
            title: 'Company Details',
            data: [
                {
                    title: 'Website',
                    subtitle: editedCompany.website || 'Not set',
                    icon: 'globe',
                    onPress: () => openEditModal('website', 'Edit Website', 'https://example.com', false, 'url'),
                },
                {
                    title: 'Company Size',
                    subtitle: editedCompany.size || 'Not set',
                    icon: 'users',
                    onPress: () => openEditModal('size', 'Edit Company Size', 'e.g., 1-10, 11-50, 51-200'),
                },
                {
                    title: 'Founded Year',
                    subtitle: editedCompany.founded_year ? editedCompany.founded_year : 'Not set',
                    icon: 'calendar',
                    onPress: () => openEditModal('founded_year', 'Edit Founded Year', 'e.g., 2020', false, 'numeric'),
                },
                {
                    title: 'Location',
                    subtitle: editedCompany.location || 'Not set',
                    icon: 'map-pin',
                    onPress: () => openEditModal('location', 'Edit Location', 'City, Country'),
                },
            ]
        }
    ];

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

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor }]}>
                <Pressable onPress={() => router.back()} style={styles.headerButton}>
                    <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>
                        Cancel
                    </ThemedText>
                </Pressable>

                <ThemedText style={styles.headerTitle} type="defaultSemiBold">
                    {id ? 'Edit Company' : 'Create Company'}
                </ThemedText>

                <Pressable
                    onPress={handleSave}
                    style={[styles.headerButton, loading && styles.headerButtonDisabled]}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={tintColor} />
                    ) : (
                        <ThemedText style={[styles.headerButtonText, { color: tintColor }]}>
                            Done
                        </ThemedText>
                    )}
                </Pressable>
            </View>

            <SettingsList sections={settingsData} />

            {error && (
                <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                </View>
            )}

            {/* Edit Modal */}
            <EditModal
                visible={editModal.visible}
                title={editModal.title}
                value={editedCompany[editModal.field] || ''}
                placeholder={editModal.placeholder}
                onSave={handleFieldSave}
                onCancel={() => setEditModal({ ...editModal, visible: false })}
                multiline={editModal.multiline}
                keyboardType={editModal.keyboardType}
            />
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
    headerTitle: {
        fontSize: 17,
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
    logoPreview: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
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