import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import CompanyManagement from './CompanyManagement';
import UserProfileEdit from './UserProfileEdit';

export default function ProfileSettings() {
    const [isCompany, setIsCompany] = useState(false);

    return (
        <View style={styles.container}>
            {/* Toggle */}
            <View style={styles.toggleRow}>
                <Pressable
                    style={[styles.toggleBtn, !isCompany && styles.toggleActive]}
                    onPress={() => setIsCompany(false)}
                >
                    <ThemedText style={!isCompany && styles.toggleLabelActive}>User</ThemedText>
                </Pressable>
                <Pressable
                    style={[styles.toggleBtn, isCompany && styles.toggleActive]}
                    onPress={() => setIsCompany(true)}
                >
                    <ThemedText style={isCompany && styles.toggleLabelActive}>Company</ThemedText>
                </Pressable>
            </View>

            {/* The appropriate edit form */}
            {isCompany ? <CompanyManagement /> : <UserProfileEdit />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    toggleRow: {
        flexDirection: 'row', justifyContent: 'center', marginVertical: 18, paddingHorizontal: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        marginHorizontal: 2,
        borderRadius: 8,
        backgroundColor: '#eaeaea',
    },
    toggleActive: {
        backgroundColor: '#0176d3',
    },
    toggleLabelActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
