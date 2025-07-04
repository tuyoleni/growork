import { useActionSheet } from '@expo/react-native-action-sheet';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, useColorScheme } from 'react-native';

interface DocumentMenuProps {
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

const DocumentMenu: React.FC<DocumentMenuProps> = ({ onDownload, onShare, onDelete }) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const colorScheme = useColorScheme() ?? 'light';
  const iconColor = colorScheme === 'dark' ? '#fff' : '#111';
  return (
    <Pressable
      style={({ pressed }) => [{ padding: 6, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: pressed ? iconColor + '11' : 'transparent' }]}
      onPress={() => {
        const options = ['Download', 'Share', 'Delete', 'Cancel'];
        const destructiveButtonIndex = 2;
        const cancelButtonIndex = 3;
        showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
          },
          (selectedIndex) => {
            if (selectedIndex === 0) onDownload();
            else if (selectedIndex === 1) onShare();
            else if (selectedIndex === 2) onDelete();
          }
        );
      }}
    >
      <Feather name="more-vertical" size={20} color={iconColor} />
    </Pressable>
  );
};

export default DocumentMenu; 