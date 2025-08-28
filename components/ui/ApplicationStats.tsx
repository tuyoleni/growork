import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColor , ApplicationWithDetails } from '@/hooks';
import { ThemedText } from '@/components/ThemedText';
import { ApplicationStatus } from '@/types/enums';

interface ApplicationStatsProps {
    applications: ApplicationWithDetails[];
}

export function ApplicationStats({ applications }: ApplicationStatsProps) {
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const mutedTextColor = useThemeColor({}, 'mutedText');

    const stats = React.useMemo(() => {
        const total = applications.length;
        const pending = applications.filter(app => app.status === ApplicationStatus.Pending).length;
        const reviewed = applications.filter(app => app.status === ApplicationStatus.Reviewed).length;
        const accepted = applications.filter(app => app.status === ApplicationStatus.Accepted).length;
        const rejected = applications.filter(app => app.status === ApplicationStatus.Rejected).length;

        return {
            total,
            pending,
            reviewed,
            accepted,
            rejected,
        };
    }, [applications]);

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.Pending:
                return '#FFA500';
            case ApplicationStatus.Reviewed:
                return '#007AFF';
            case ApplicationStatus.Accepted:
                return '#34C759';
            case ApplicationStatus.Rejected:
                return '#FF3B30';
            default:
                return mutedTextColor;
        }
    };

    const getStatusIcon = (status: ApplicationStatus) => {
        switch (status) {
            case ApplicationStatus.Pending:
                return 'clock';
            case ApplicationStatus.Reviewed:
                return 'eye';
            case ApplicationStatus.Accepted:
                return 'check-circle';
            case ApplicationStatus.Rejected:
                return 'x-circle';
            default:
                return 'circle';
        }
    };

    if (stats.total === 0) {
        return (
            <View style={[styles.container, { borderBottomColor: borderColor }]}>
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: textColor }]}>
                        Application Overview
                    </ThemedText>
                    <ThemedText style={[styles.total, { color: mutedTextColor }]}>
                        0 total
                    </ThemedText>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Pending) }]}>
                            <Feather name={getStatusIcon(ApplicationStatus.Pending)} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.statContent}>
                            <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                0
                            </ThemedText>
                            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                                Pending
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Reviewed) }]}>
                            <Feather name={getStatusIcon(ApplicationStatus.Reviewed)} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.statContent}>
                            <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                0
                            </ThemedText>
                            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                                Reviewed
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Accepted) }]}>
                            <Feather name={getStatusIcon(ApplicationStatus.Accepted)} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.statContent}>
                            <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                0
                            </ThemedText>
                            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                                Accepted
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Rejected) }]}>
                            <Feather name={getStatusIcon(ApplicationStatus.Rejected)} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.statContent}>
                            <ThemedText style={[styles.statNumber, { color: textColor }]}>
                                0
                            </ThemedText>
                            <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                                Rejected
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { borderBottomColor: borderColor }]}>
            <View style={styles.header}>
                <ThemedText style={[styles.title, { color: textColor }]}>
                    Application Overview
                </ThemedText>
                <ThemedText style={[styles.total, { color: mutedTextColor }]}>
                    {stats.total} total
                </ThemedText>
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Pending) }]}>
                        <Feather name={getStatusIcon(ApplicationStatus.Pending)} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                        <ThemedText style={[styles.statNumber, { color: textColor }]}>
                            {stats.pending}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                            Pending
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Reviewed) }]}>
                        <Feather name={getStatusIcon(ApplicationStatus.Reviewed)} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                        <ThemedText style={[styles.statNumber, { color: textColor }]}>
                            {stats.reviewed}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                            Reviewed
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Accepted) }]}>
                        <Feather name={getStatusIcon(ApplicationStatus.Accepted)} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                        <ThemedText style={[styles.statNumber, { color: textColor }]}>
                            {stats.accepted}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                            Accepted
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: getStatusColor(ApplicationStatus.Rejected) }]}>
                        <Feather name={getStatusIcon(ApplicationStatus.Rejected)} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.statContent}>
                        <ThemedText style={[styles.statNumber, { color: textColor }]}>
                            {stats.rejected}
                        </ThemedText>
                        <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                            Rejected
                        </ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    total: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statContent: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
}); 