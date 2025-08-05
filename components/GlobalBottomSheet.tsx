import React, { forwardRef, useMemo } from 'react';
import { SafeAreaView, View, StyleSheet, Platform } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface GlobalBottomSheetProps {
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  snapPoints: string[];
  onDismiss?: () => void;
}

const GlobalBottomSheet = forwardRef<BottomSheetModal, GlobalBottomSheetProps>(
  ({ header, body, footer, snapPoints, onDismiss }, ref) => {
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedText = useThemeColor({}, 'mutedText');

    const backgroundStyle = useMemo(() => ({
      backgroundColor: backgroundSecondary,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      shadowColor: textColor,
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      borderColor,
      borderTopWidth: 1,
    }), [backgroundSecondary, borderColor, textColor]);

    const handleIndicatorStyle = useMemo(() => ({
      backgroundColor: mutedText,
      width: 40,
      height: 4,
    }), [mutedText]);

    const renderBackdrop = useMemo(
      () => (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.44}
          pressBehavior="close"
        />
      ), []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        backdropComponent={renderBackdrop}
      >
        <SafeAreaView style={styles.safeArea}>
          {header && (
            <View style={[styles.headerContainer, { borderBottomColor: borderColor }]}>
              {header}
            </View>
          )}
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.bodyContainer}>
              {body}
            </View>
          </BottomSheetScrollView>
          {footer && (
            <View style={[
              styles.footerContainer,
              { backgroundColor: backgroundSecondary, borderTopColor: borderColor }
            ]}>
              {footer}
            </View>
          )}
        </SafeAreaView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  headerContainer: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  bodyContainer: { flex: 1, minHeight: 0, padding: 16 },
  footerContainer: { width: '100%', borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16 },
});

export default GlobalBottomSheet;
