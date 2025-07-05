import { useThemeColor } from '@/hooks/useThemeColor';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef } from 'react';
import { KeyboardAvoidingView, Platform, StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from '../ThemedText';

interface GlobalBottomSheetFormProps {
  title: string;
  onDismiss: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

const GlobalBottomSheet = forwardRef<BottomSheetModal, GlobalBottomSheetFormProps>(
  (
    { title, onDismiss, onSubmit, submitLabel, children, footer, style, backgroundColor },
    ref
  ) => {
    const textColor = useThemeColor({}, 'text');
    const backgroundThemeColor = useThemeColor({}, 'background');
    const buttonBg = textColor;
    const buttonTextColor = backgroundThemeColor;

    return (
      <BottomSheetModal
        ref={ref}
        onDismiss={onDismiss}
        snapPoints={['70%']}
        backgroundStyle={backgroundColor ? { backgroundColor } : undefined}
      >
        <KeyboardAvoidingView
          style={[{ flex: 1 }, style]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <BottomSheetView style={{ flex: 1, padding: 24, justifyContent: 'flex-start' }}>
            <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>{title}</ThemedText>
            {children}
            {footer}
            <BottomSheetView style={{ flex: 0, marginTop: 8 }}>
              <TouchableOpacity onPress={onSubmit} style={{ marginTop: 8 }}>
                <ThemedText
                  style={{
                    backgroundColor: buttonBg,
                    color: buttonTextColor,
                    borderRadius: 8,
                    paddingVertical: 16,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  {submitLabel}
                </ThemedText>
              </TouchableOpacity>
              {submitLabel}
            </BottomSheetView>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    );
  }
);

export default GlobalBottomSheet;
