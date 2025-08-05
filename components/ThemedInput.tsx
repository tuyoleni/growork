import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedInput({ style, lightColor, darkColor, ...rest }: ThemedInputProps) {
  const backgroundColor = useThemeColor({ light: '#f9f9f9', dark: '#181818' }, 'backgroundSecondary');
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'mutedText');

  return (
    <TextInput
      style={[
        styles.input,
        {
          color: textColor,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
      placeholderTextColor={placeholderColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
});