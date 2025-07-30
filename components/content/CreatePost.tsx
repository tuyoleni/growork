import React, { useState, useEffect } from 'react';
import { 
  ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, 
  Pressable, StyleSheet, TextInput, View 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppContext } from '@/utils/AppContext';
import { PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/utils/superbase';
import { openGlobalSheet } from '@/utils/globalSheet';

interface CreatePostSheetUIProps {
  onSuccess?: () => void;
}

export default function CreatePostSheetUI({ onSuccess }: CreatePostSheetUIProps) {
  const { user, addPost } = useAppContext();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<PostType>(PostType.News);
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  // Keyboard adjust
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardOffset(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOffset(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Image pick
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
        setImageUri(asset.uri);
        setImageFile(asset);
      }
    } catch (err) {
      Alert.alert("Image Error", "Couldn't pick image");
    }
  };

  // Upload to supabase
  const uploadImage = async () => {
    if (!imageFile || !user) return null;
    try {
      const fileExt = imageFile.uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);
      const { error: uploadError } = await supabase.storage
        .from('posts').upload(filePath, formData, { contentType: `image/${fileExt}` });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('posts').getPublicUrl(filePath);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const clearForm = () => {
    setTitle('');
    setContent('');
    setImageUri(null);
    setImageFile(null);
    setPostType(PostType.News);
  };

  // Submit
  const handleCreate = async () => {
    if (!user) return Alert.alert("Auth", "You must be logged in.");
    if (!title.trim()) return Alert.alert("Validation", "Title required.");
    if (!content.trim()) return Alert.alert("Validation", "Content required.");

    setLoading(true);
    let finalImageUrl = null;
    try {
      if (imageUri) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) Alert.alert('Info', 'Image upload failed, post will be created without image.');
      }
      const { error } = await addPost({
        user_id: user.id,
        type: postType,
        title: title.trim(),
        content: content.trim(),
        image_url: finalImageUrl,
        is_sponsored: false,
      });
      if (error) throw error;
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearForm();
      openGlobalSheet({ body: null, snapPoints: ['1%'] }); // closes global sheet
      onSuccess?.();
    } catch (err: any) {
      Alert.alert("Create Post Error", err?.message || String(err));
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Post type select
  const handleSelectType = (type: PostType) => {
    setPostType(type);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? "padding" : undefined}
      keyboardVerticalOffset={16}
    >
      <View style={[styles.container, { paddingBottom: keyboardOffset > 0 ? keyboardOffset - 8 : 16 }]}>
        {/* POST TYPE SELECTOR */}
        <View style={styles.typeSelector}>
          {[
            { label: 'News', icon: 'book-open', value: PostType.News },
            { label: 'Job',  icon: 'briefcase', value: PostType.Job },
            { label: 'Ad',   icon: 'star', value: PostType.Ad }
          ].map(btn => (
            <Pressable
              key={btn.value}
              style={[
                styles.typeButton, 
                postType === btn.value && { 
                  backgroundColor: tintColor + '22',
                  borderColor: tintColor
                }
              ]}
              onPress={() => handleSelectType(btn.value)}
            >
              <Feather name={btn.icon as any} size={18} color={postType === btn.value ? tintColor : textColor} />
              <ThemedText style={[
                styles.typeButtonText,
                postType === btn.value && { color: tintColor }
              ]}>{btn.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {/* TITLE INPUT */}
        <TextInput
          style={[styles.titleInput, { color: textColor, borderColor }]}
          placeholder="Title"
          placeholderTextColor={textColor + '88'}
          value={title}
          maxLength={80}
          onChangeText={setTitle}
          autoFocus
        />

        {/* CONTENT INPUT */}
        <TextInput
          style={[styles.contentInput, { color: textColor, borderColor }]}
          placeholder="What's on your mind?"
          placeholderTextColor={textColor + '66'}
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={1200}
          textAlignVertical="top"
        />

        {/* IMAGE PREVIEW */}
        {imageUri &&
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <Pressable style={styles.removeImageButton} onPress={() => { setImageUri(null); setImageFile(null); }}>
              <Feather name="x" size={17} color="#fff" />
            </Pressable>
          </View>
        }

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <Pressable style={styles.attachImageButton} onPress={pickImage}>
            <Feather name="image" size={22} color={tintColor} />
          </Pressable>
          <Pressable
            style={[
              styles.postButton, 
              (!title.trim() || !content.trim() || loading) && { backgroundColor: '#9ca3af' }
            ]}
            disabled={!title.trim() || !content.trim() || loading}
            onPress={handleCreate}
          >
            {loading ? 
              <ActivityIndicator size="small" color="#fff" /> :
              <ThemedText style={styles.postButtonText}>Post</ThemedText>
            }
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    justifyContent: 'flex-start',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 15,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 15,
    flex: 1,
    minHeight: 90,
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 8,
  },
  imagePreviewContainer: {
    marginTop: 16,
    marginBottom: 8,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 190,
    borderRadius: 9,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  attachImageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  postButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
