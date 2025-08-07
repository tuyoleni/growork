import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PostType } from '@/types';
import { useAppContext } from '@/utils/AppContext';
import { uploadImage } from '@/utils/uploadUtils';
import { STORAGE_BUCKETS } from '@/utils/superbase';
import { ArticleFieldsData } from './ArticleFields';
import { JobFieldsData } from './JobFields';

export function usePostForm(onSuccess?: () => void) {
  const { user, addPost } = useAppContext();
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<PostType>(PostType.News);

  // Job-specific fields
  const [jobFields, setJobFields] = useState<JobFieldsData>({
    location: '',
    salary: '',
    jobType: '',
    industry: '',
    company: '',
  });

  // Article-specific fields
  const [articleFields, setArticleFields] = useState<ArticleFieldsData>({
    source: '',
    industry: '',
  });

  const handleImageSelected = (imageUrl: string | null) => {
    setImageUrl(imageUrl);
  };

  const clearForm = () => {
    setTitle('');
    setContent('');
    setImageUrl(null);
    setPostType(PostType.News);
    setJobFields({
      location: '',
      salary: '',
      jobType: '',
      industry: '',
      company: '',
    });
    setArticleFields({
      source: '',
      industry: '',
    });
  };

  const handlePostTypeChange = (type: PostType) => {
    setPostType(type);
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Clear form when changing post type
    setTitle('');
    setContent('');
    setImageUrl(null);
  };

  const isFormValid = () => {
    return title.trim().length > 0 && content.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!user) return Alert.alert("Auth", "You must be logged in.");
    if (!isFormValid()) return Alert.alert("Validation", "Title and content are required.");

    let criteria = {};
    let industry = null;

    if (postType === PostType.Job) {
      criteria = {
        company: jobFields.company,
        location: jobFields.location,
        salary: jobFields.salary,
        jobType: jobFields.jobType,
      };
      industry = jobFields.industry;
    } else if (postType === PostType.News) {
      criteria = {
        source: articleFields.source,
      };
      industry = articleFields.industry;
    }

    setLoading(true);
    try {
      const { error } = await addPost({
        user_id: user.id,
        type: postType,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        industry: industry,
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
    imageUrl,
    setImageUrl,
    handleImageSelected,
    loading,
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