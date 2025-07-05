import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetModalProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { SafeAreaView, View } from 'react-native';

interface GlobalBottomSheetProps extends Omit<BottomSheetModalProps, 'children'> {
  header?: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  snapPoints: string[];
}

const GlobalBottomSheet = forwardRef<BottomSheetModal, GlobalBottomSheetProps>(
  ({ header, body, footer, snapPoints, onDismiss, ...props }, ref) => {
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
        <BottomSheetView style={{ flex: 1, padding: 0 }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            {header && (
              <View style={{ 
                padding: 24, 
                paddingBottom: header ? 16 : 24,
                borderBottomWidth: header ? 1 : 0,
                borderBottomColor: borderColor,
              }}>
                {header}
              </View>
            )}

            {/* Body - Scrollable */}
            <View style={{ flex: 1, minHeight: 0 }}>
              {body}
            </View>

            {/* Footer - Fixed */}
            {footer && (
              <View style={{ 
                position: 'absolute', 
                left: 0, 
                right: 0, 
                bottom: 0, 
                padding: 24, 
                backgroundColor: backgroundSecondary, 
                borderTopWidth: 1, 
                borderTopColor: borderColor,
                zIndex: 1000,
              }}>
                {footer}
              </View>
            )}
          </SafeAreaView>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

export default GlobalBottomSheet; 