import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PostType } from '@/types';
import { useAppContext } from '@/utils/AppContext';
import { useImageUpload } from './useImageUpload';
import { ArticleFieldsData } from './ArticleFields';
import { JobFieldsData } from './JobFields';

export function usePostForm(onSuccess?: () => void) {
  const { user, addPost } = useAppContext();
  const { uploadImage, uploading } = useImageUpload();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<PostType>(PostType.News);

  // Job-specific fields
  const [jobFields, setJobFields] = useState<JobFieldsData>({
    company: '',
    location: '',
    salary: '',
    jobType: '',
    industry: '',
    requirements: '',
    benefits: '',
    deadline: '',
  });

  // Article-specific fields
  const [articleFields, setArticleFields] = useState<ArticleFieldsData>({
    source: '',
    summary: '',
    tags: '',
  });

  const handleImageSelected = (uri: string | null, file: any | null) => {
    setImageUri(uri);
    setImageFile(file);
  };

  const clearForm = () => {
    setTitle('');
    setContent('');
    setImageUri(null);
    setImageFile(null);
    setPostType(PostType.News);
    setJobFields({
      company: '',
      location: '',
      salary: '',
      jobType: '',
      industry: '',
      requirements: '',
      benefits: '',
      deadline: '',
    });
    setArticleFields({
      source: '',
      summary: '',
      tags: '',
    });
  };

  const handlePostTypeChange = (type: PostType) => {
    setPostType(type);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear form when changing post type
    setTitle('');
    setContent('');
    setImageUri(null);
    setImageFile(null);
  };

  const isFormValid = () => {
    return title.trim().length > 0 && content.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!user) return Alert.alert("Auth", "You must be logged in.");
    if (!isFormValid()) return Alert.alert("Validation", "Title and content are required.");

    let criteria = {};
    if (postType === PostType.Job) {
      criteria = {
        company: jobFields.company,
        location: jobFields.location,
        salary: jobFields.salary,
        jobType: jobFields.jobType,
        requirements: jobFields.requirements.split(',').map((s: string) => s.trim()).filter(Boolean),
        benefits: jobFields.benefits.split(',').map((s: string) => s.trim()).filter(Boolean),
        deadline: jobFields.deadline,
      };
    } else if (postType === PostType.News) {
      criteria = {
        source: articleFields.source,
        summary: articleFields.summary,
        tags: articleFields.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
    }

    setLoading(true);
    let finalImageUrl = null;
    try {
      if (imageUri && imageFile) {
        finalImageUrl = await uploadImage(imageFile, user.id);
        if (!finalImageUrl) Alert.alert('Info', 'Image upload failed, post will be created without image.');
      }
      
      const { error } = await addPost({
        user_id: user.id,
        type: postType,
        title: title.trim(),
        content: content.trim(),
        image_url: finalImageUrl,
        industry: postType === PostType.Job ? jobFields.industry : null,
        is_sponsored: false,
        criteria,
      });
      
      if (error) throw error;
      
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearForm();
      onSuccess?.();
    } catch (err: any) {
      Alert.alert("Create Post Error", err?.message || String(err));
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    imageUri,
    imageFile,
    handleImageSelected,
    loading: loading || uploading,
    postType,
    handlePostTypeChange,
    jobFields,
    setJobFields,
    articleFields,
    setArticleFields,
    handleSubmit,
    isFormValid,
    clearForm
  };
}