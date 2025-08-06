import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useImageUpload } from './useImageUpload';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ImagePickerFieldProps {
  selectedImage: string | null;
  onImageSelected: (imageUrl: string | null) => void;
  label?: string;
}

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  selectedImage,
  onImageSelected,
  label = 'Add Image'
}) => {
  const { pickImage, uploading, error } = useImageUpload();

  const handleImagePick = async () => {
    try {
      const imageUrl = await pickImage();
      if (imageUrl) {
        onImageSelected(imageUrl);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    onImageSelected(null);
  };

  return (
    <ThemedView style={{ marginVertical: 10 }}>
      {label && (
        <ThemedText style={{ marginBottom: 8, fontWeight: '500' }}>
          {label}
        </ThemedText>
      )}
      
      {selectedImage ? (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              marginBottom: 8
            }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={removeImage}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 15,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleImagePick}
          disabled={uploading}
          style={{
            borderWidth: 2,
            borderColor: '#ddd',
            borderStyle: 'dashed',
            borderRadius: 8,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9'
          }}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <>
              <Text style={{ fontSize: 48, color: '#999' }}>📷</Text>
              <ThemedText style={{ marginTop: 8, color: '#666' }}>
                Tap to add image
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {error && (
        <Text style={{ color: 'red', marginTop: 8, fontSize: 12 }}>
          {error}
        </Text>
      )}
    </ThemedView>
  );
};
