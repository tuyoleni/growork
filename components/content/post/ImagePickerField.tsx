import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface ImagePickerFieldProps {
  imageUri: string | null;
  onImageSelected: (uri: string | null, file: any | null) => void;
  style?: ViewStyle;
  buttonText?: string;
}

export default function ImagePickerField({ 
  imageUri, 
  onImageSelected, 
  style, 
  buttonText 
}: ImagePickerFieldProps) {
  const tintColor = useThemeColor({}, 'tint');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.82,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected(asset.uri, asset);
      }
    } catch {
      Alert.alert("Image Error", "Couldn't pick image");
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity
        style={styles.attachImageButton}
        onPress={pickImage}
        accessibilityLabel={imageUri ? "Change image" : "Add image"}
      >
        <Feather name="image" size={22} color={tintColor} />
        <ThemedText style={{ marginLeft: 8 }}>
          {buttonText || (imageUri ? "Change Image" : "Add Image")}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  attachImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    minHeight: 36,
    minWidth: 48,
    borderRadius: 8,
  }
});
