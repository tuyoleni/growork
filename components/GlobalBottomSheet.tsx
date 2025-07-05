import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';

interface GlobalBottomSheetProps extends Omit<BottomSheetModalProps, 'children'> {
  children: React.ReactNode;
  snapPoints: string[];
}

const GlobalBottomSheet = forwardRef<BottomSheetModal, GlobalBottomSheetProps>(
  ({ children, snapPoints, onDismiss, ...props }, ref) => {
    const backgroundColor = useThemeColor({}, 'background');
    const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
    const borderColor = useThemeColor({}, 'border');
    const textColor = useThemeColor({}, 'text');
    const mutedText = useThemeColor({}, 'mutedText');

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        onDismiss={onDismiss}
        backgroundStyle={{
          backgroundColor: backgroundSecondary,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: textColor,
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          borderColor,
          borderTopWidth: 1,
        }}
        handleIndicatorStyle={{
          backgroundColor: mutedText,
          width: 40,
          height: 4,
        }}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.4}
            pressBehavior="close"
          />
        )}
        {...props}
      >
        <BottomSheetView style={{ flex: 1, padding: 0 }}>{children}</BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default GlobalBottomSheet; 