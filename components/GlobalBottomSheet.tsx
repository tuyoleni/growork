import React, { forwardRef, useMemo } from 'react';
import {
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface SimpleBottomSheetProps {
  snapPoints: string[];
  onDismiss?: () => void;
  children: React.ReactNode;
}

const SimpleBottomSheet = forwardRef<BottomSheetModal, SimpleBottomSheetProps>(
  ({ snapPoints, onDismiss, children }, ref) => {
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
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {children}
          </KeyboardAvoidingView>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});

export default SimpleBottomSheet;
