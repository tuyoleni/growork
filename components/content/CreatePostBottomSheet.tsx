import { useAppContext } from '@/utils/AppContext';
import { PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import GlobalBottomSheet from '../GlobalBottomSheet';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/utils/superbase';

interface CreatePostBottomSheetProps {
  onSuccess?: () => void;
}

const CreatePostBottomSheet = forwardRef<BottomSheetModal, CreatePostBottomSheetProps>(
  ({ onSuccess }, ref) => {
    const { user, addPost } = useAppContext();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [postType, setPostType] = useState<PostType>(PostType.News);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({}, 'border');
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({}, 'tint');

    // Listen for keyboard events
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    }, []);

    const handlePickImage = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          setImageFile(asset);
          setImageUrl(asset.uri);
        }
      } catch (err) {
        console.error('Error picking image:', err);
        Alert.alert('Error', 'Failed to pick image');
      }
    };

    const uploadImage = async () => {
      if (!imageFile || !user) return null;
      
      try {
        const fileExt = imageFile.uri.split('.').pop();
        const fileName = `${user.id}_${new Date().getTime()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        // Create FormData for the upload
        const formData = new FormData();
        formData.append('file', {
          uri: imageFile.uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, formData, {
            contentType: `image/${fileExt}`,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (err) {
        console.error('Error uploading image:', err);
        return null;
      }
    };

    const handleCreatePost = async () => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a post');
        return;
      }

      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title');
        return;
      }

      if (!content.trim()) {
        Alert.alert('Error', 'Please enter some content');
        return;
      }

      try {
        setLoading(true);

        // Upload image if selected
        let finalImageUrl = null;
        if (imageUrl) {
          finalImageUrl = await uploadImage();
          if (!finalImageUrl) {
            Alert.alert('Warning', 'Failed to upload image, but proceeding with post creation');
          }
        }

        // Create post
        const result = await addPost({
          user_id: user.id,
          type: postType,
          title: title.trim(),
          content: content.trim(),
          image_url: finalImageUrl,
          is_sponsored: false,
        });

        if (result.error) {
          throw result.error;
        }

        // Trigger success feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Reset form
        setTitle('');
        setContent('');
        setImageUrl(null);
        setImageFile(null);
        setPostType(PostType.News);

        // Close bottom sheet
        (ref as any)?.current?.dismiss();

        // Call success callback
        onSuccess?.();

      } catch (err: any) {
        console.error('Error creating post:', err);
        Alert.alert('Error', err.message || 'Failed to create post');
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        setLoading(false);
      }
    };

    const handleSelectPostType = (type: PostType) => {
      setPostType(type);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    return (
      <GlobalBottomSheet
        ref={ref}
        snapPoints={['85%']}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        header={
          <ThemedText style={styles.headerTitle}>Create Post</ThemedText>
        }
        body={
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={16}
          >
            <View style={styles.container}>
              {/* Post Type Selection */}
              <ThemedView style={styles.typeSelector}>
                <Pressable
                  style={[
                    styles.typeButton,
                    postType === PostType.News && { backgroundColor: tintColor + '20', borderColor: tintColor }
                  ]}
                  onPress={() => handleSelectPostType(PostType.News)}
                >
                  <Feather 
                    name="book-open" 
                    size={16} 
                    color={postType === PostType.News ? tintColor : textColor} 
                  />
                  <ThemedText 
                    style={[
                      styles.typeButtonText,
                      postType === PostType.News && { color: tintColor }
                    ]}
                  >
                    News
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    postType === PostType.Job && { backgroundColor: tintColor + '20', borderColor: tintColor }
                  ]}
                  onPress={() => handleSelectPostType(PostType.Job)}
                >
                  <Feather 
                    name="briefcase" 
                    size={16} 
                    color={postType === PostType.Job ? tintColor : textColor} 
                  />
                  <ThemedText 
                    style={[
                      styles.typeButtonText,
                      postType === PostType.Job && { color: tintColor }
                    ]}
                  >
                    Job
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    postType === PostType.Ad && { backgroundColor: tintColor + '20', borderColor: tintColor }
                  ]}
                  onPress={() => handleSelectPostType(PostType.Ad)}
                >
                  <Feather 
                    name="star" 
                    size={16} 
                    color={postType === PostType.Ad ? tintColor : textColor} 
                  />
                  <ThemedText 
                    style={[
                      styles.typeButtonText,
                      postType === PostType.Ad && { color: tintColor }
                    ]}
                  >
                    Ad
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {/* Title Input */}
              <TextInput
                style={[styles.titleInput, { color: textColor, borderColor }]}
                placeholderTextColor={textColor + '80'}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              {/* Content Input */}
              <TextInput
                style={[styles.contentInput, { color: textColor, borderColor }]}
                placeholderTextColor={textColor + '80'}
                placeholder="What's on your mind?"
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={2000}
              />

              {/* Image Preview */}
              {imageUrl && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => {
                      setImageUrl(null);
                      setImageFile(null);
                    }}
                  >
                    <Feather name="x" size={16} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        }
        footer={
          <View style={styles.footer}>
            <Pressable style={styles.attachButton} onPress={handlePickImage}>
              <Feather name="image" size={20} color={textColor} />
            </Pressable>

            <Pressable
              style={[
                styles.postButton,
                { backgroundColor: (!title.trim() || !content.trim() || loading) ? '#9CA3AF' : tintColor }
              ]}
              disabled={!title.trim() || !content.trim() || loading}
              onPress={handleCreatePost}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.postButtonText}>Post</ThemedText>
              )}
            </Pressable>
          </View>
        }
      />
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    paddingTop: 8,
    minHeight: 120,
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    gap: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreatePostBottomSheet;