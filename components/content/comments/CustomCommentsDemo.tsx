import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '../../ThemedText';
import { useCustomCommentsBottomSheet } from '@/hooks/useCustomCommentsBottomSheet';
import CommentsBottomSheet from './CommentsBottomSheet';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

interface CustomCommentsDemoProps {
    postId: string;
}

export default function CustomCommentsDemo({ postId }: CustomCommentsDemoProps) {
    const { isVisible, currentPostId, openCommentsSheet, closeCommentsSheet } = useCustomCommentsBottomSheet();
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');

    const handleOpenComments = () => {
        openCommentsSheet(postId);
    };

    return (
        <View style={[styles.container, { borderColor }]}>
            <Pressable onPress={handleOpenComments} style={styles.button}>
                <Feather name="message-circle" size={20} color={textColor} />
                <ThemedText style={styles.buttonText}>View Comments</ThemedText>
            </Pressable>

            {/* Custom Bottom Sheet */}
            {currentPostId && (
                <CommentsBottomSheet
                    postId={currentPostId}
                    visible={isVisible}
                    onClose={closeCommentsSheet}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
    },
}); 