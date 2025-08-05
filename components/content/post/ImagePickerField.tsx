import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ImagePickerFieldProps {
  imageUri: string | null;
  onImageSelected: (uri: string | null, file: any | null) => void;
  style?: ViewStyle;
}

export default function ImagePickerField({ 
  imageUri, 
  onImageSelected,
  style 
}: ImagePickerFieldProps) {
  const tintColor = useThemeColor({}, 'tint');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.82,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected(asset.uri, asset);
      }
    } catch (err) {
      Alert.alert("Image Error", "Couldn't pick image");
    }
  };

  return (
    <View style={[styles.container, style]}>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <Pressable 
            style={styles.removeImageButton} 
            onPress={() => onImageSelected(null, null)}
          >
            <Feather name="x" size={17} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.attachImageButton} onPress={pickImage}>
          <Feather name="image" size={22} color={tintColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  imagePreview: {
    width: 180,
    height: 120,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 12,
    backgroundColor: '#000a',
    borderRadius: 12,
    padding: 2,
  },
  attachImageButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
});