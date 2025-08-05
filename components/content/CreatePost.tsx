import React from 'react';
import { StyleSheet } from 'react-native';
import { openGlobalSheet } from '@/utils/globalSheet';
import PostForm from './post/PostForm';

interface CreatePostSheetUIProps {
  onSuccess?: () => void;
}

export default function CreatePostSheetUI({ onSuccess }: CreatePostSheetUIProps) {
  const handleSuccess = () => {
    // Close the sheet by setting minimal height
    openGlobalSheet({ body: null, snapPoints: ['1%'] });
    onSuccess?.();
  };


  return (
    <PostForm onSuccess={handleSuccess} style={styles.form} />
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
});
