import CategorySelector from '@/components/ui/CategorySelector';
import { Colors } from '@/constants/Colors';
import { INDUSTRIES } from '@/dataset/industries';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import CustomOptionStrip from '@/components/ui/CustomOptionStrip';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { usePermissions } from '@/hooks/usePermissions';

interface HeaderProps {
  selectedContentType: number;
  onContentTypeChange: (index: number) => void;
  selectedIndustry: number;
  onIndustryChange: (index: number) => void;
  onAddPost: () => void;
  isBusinessUser?: boolean;
}

const Header = ({
  selectedContentType,
  onContentTypeChange,
  selectedIndustry,
  onIndustryChange,
  onAddPost,
  isBusinessUser = false,
}: HeaderProps) => {
  const visibleIndustries = INDUSTRIES;
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const permissions = usePermissions();
  const showAdd = isBusinessUser || permissions.isBusinessUser;

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          backgroundColor: theme.background,
        },
      ]}
    >
      <View style={styles.topRow}>
        <ThemedText style={styles.appName} numberOfLines={1}>
          Growork
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {showAdd && (
            <Pressable style={styles.iconButton} onPress={onAddPost} hitSlop={8}>
              <Feather name="plus" size={22} color={theme.icon} />
            </Pressable>
          )}
          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
            hitSlop={8}
          >
            <View style={styles.bellContainer}>
              <Feather name="bell" size={22} color={theme.icon} />
              <NotificationBadge size={16} />
            </View>
          </Pressable>
        </View>
      </View>
      <CategorySelector
        options={['All', 'Jobs', 'News']}
        selectedIndex={selectedContentType}
        onChange={onContentTypeChange}
      />
      <CustomOptionStrip
        visibleOptions={visibleIndustries}
        selectedIndex={selectedIndustry}
        onChange={onIndustryChange}
        allOptions={INDUSTRIES}
        minVisibleOptions={1}
        maxVisibleOptions={6}
        style={styles.industrySelector}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
  },
  bellContainer: {
    position: 'relative',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: 'center',
  },
  industrySelector: {
    marginTop: 8,
    marginBottom: 0,
  },
});

const HEADER_HEIGHT = 190;

export { HEADER_HEIGHT };
export default Header;
