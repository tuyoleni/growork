import { useThemeColor } from '@/hooks/useThemeColor';
import { Document } from '@/types';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActionSheetIOS, Alert, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

export interface DocumentCardProps {
  document: Document;
  onPress?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  showMenu?: boolean;
  showCategory?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onPressMenu?: () => void;
  selectable?: boolean;
}

function IconWithBackground({ icon }: { icon: React.ReactElement }) {
  const borderColor = useThemeColor({}, 'border');
  return (
    <ThemedView style={[styles.iconBg, { backgroundColor: borderColor + '22' }]}> 
      {React.isValidElement(icon) ? icon : null}
    </ThemedView>
  );
}

export default function DocumentCard({
  document,
  onPress,
  onDownload,
  onShare,
  onDelete,
  showMenu = true,
  showCategory = false,
  variant = 'default',
  onPressMenu,
  selectable = false,
}: DocumentCardProps) {
  const { name, type, uploaded_at } = document;
  const formattedDate = new Date(uploaded_at).toLocaleDateString();
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const iconColor = useThemeColor({}, 'icon');

  const handleMenuPress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Create action sheet options
    const options = ['Cancel'];
    const actions: (() => void)[] = [() => {}];

    if (onDownload) {
      options.push('Download');
      actions.push(() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onDownload();
      });
    }

    if (onShare) {
      options.push('Share');
      actions.push(() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onShare();
      });
    }

    if (onDelete) {
      options.push('Delete');
      actions.push(() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        // Show confirmation dialog for delete
        Alert.alert(
          'Delete Document',
          `Are you sure you want to delete "${document.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }
                onDelete();
              }
            }
          ]
        );
      });
    }

    // Show action sheet on iOS
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex: onDelete ? options.length - 1 : undefined,
        },
        (buttonIndex) => {
          if (buttonIndex !== 0) { // Not cancel
            actions[buttonIndex]();
          }
        }
      );
    } else {
      // For Android/web, show a simple alert with options
      const actionOptions = options.slice(1); // Remove Cancel
      const actionText = actionOptions.join('\n');
      Alert.alert(
        'Document Actions',
        `Choose an action for "${document.name}":\n\n${actionText}`,
        actionOptions.map((option, index) => ({
          text: option,
          onPress: () => actions[index + 1](),
          style: option === 'Delete' ? 'destructive' : 'default'
        }))
      );
    }
  };

  const renderMenuButton = () => {
    if (!showMenu) return null;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.menuButton,
          { backgroundColor: pressed ? borderColor + '11' : 'transparent' }
        ]}
        onPress={onPressMenu ? onPressMenu : handleMenuPress}
      >
        <Feather name="more-vertical" size={20} color={iconColor} />
      </Pressable>
    );
  };

  const renderCategory = () => {
    if (!showCategory) return null;
    
    return (
      <View style={styles.categoryContainer}>
        <ThemedText style={[styles.categoryText, { color: mutedText }]}>
          {document.type.replace('_', ' ')}
        </ThemedText>
      </View>
    );
  };

  const cardStyle = variant === 'compact' ? styles.cardCompact : 
                   variant === 'detailed' ? styles.cardDetailed : 
                   styles.card;

  return (
    <Pressable
      style={({ pressed }) => [
        cardStyle,
        { 
          borderBottomColor: borderColor,
          backgroundColor: pressed ? borderColor + '05' : backgroundColor,
        }
      ]}
      onPress={onPress}
    >
      <IconWithBackground icon={<Feather name="file-text" size={24} color={textColor} />} />
      
      <ThemedView style={styles.cardTextWrap}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>{document.name}</ThemedText>
        
        <View style={styles.metaRow}>
          <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>
            {formattedDate}
          </ThemedText>
        </View>
        
        {renderCategory()}
      </ThemedView>
      
      {renderMenuButton()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  cardCompact: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
    marginBottom: 8,
  },
  cardDetailed: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  cardTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardNote: {
    fontSize: 13,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeText: {
    fontSize: 11,
  },
  categoryContainer: {
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  menuButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 