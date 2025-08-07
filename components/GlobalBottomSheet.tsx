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
  BottomSheetTextInput,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface SimpleBottomSheetProps {
  snapPoints: string[];
  onDismiss?: () => void;
  children: React.ReactNode;
}

const SimpleBottomSheet = forwardRef<BottomSheetModal, SimpleBottomSheetProps>(
  function SimpleBottomSheet({ snapPoints, onDismiss, children }, ref) {
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
      () => function RenderBackdrop(backdropProps: BottomSheetBackdropProps) {
        return (
          <BottomSheetBackdrop
            {...backdropProps}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.44}
            pressBehavior="close"
          />
        );
      }, []
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        backgroundStyle={backgroundStyle}
        handleIndicatorStyle={handleIndicatorStyle}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        enableDynamicSizing={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </BottomSheetScrollView>
        </KeyboardAvoidingView>
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

export { BottomSheetTextInput };
export default SimpleBottomSheet;
