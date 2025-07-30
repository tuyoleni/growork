import { useApplications } from '@/hooks/useApplications';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Document, DocumentType, Post } from '@/types';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedInput } from '../ThemedInput';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import DocumentCard from './DocumentCard';
import DocumentManager from './DocumentManager';

type JobApplicationFormProps = {
  jobPost: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function JobApplicationForm({
  jobPost,
  onSuccess,
  onCancel,
}: JobApplicationFormProps) {
  const { user } = useAuth();
  const { addApplication } = useApplications();
  const { documents, loading: documentsLoading, fetchDocuments } = useDocuments(user?.id);
  
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResume, setSelectedResume] = useState<Document | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  useEffect(() => {
    if (user?.id) {
      fetchDocuments(DocumentType.CV);
    }
  }, [fetchDocuments, user?.id]);

  const handleSelectResume = (document: Document) => {
    setSelectedResume(document);
    setShowDocumentPicker(false);
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }
    
    if (!selectedResume) {
      Alert.alert('Error', 'Please select a resume');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await addApplication({
        user_id: user.id,
        post_id: jobPost.id,
        resume_id: selectedResume.id,
        resume_url: selectedResume.file_url,
        cover_letter: coverLetter.trim() || null,
      });
      
      if (error) {
        throw error;
      }
      
      if (process.env.EXPO_OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Application Submitted',
        'Your application has been successfully submitted.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedText style={styles.title} type="defaultSemiBold">
        Apply for: {jobPost.title}
      </ThemedText>
      
      {showDocumentPicker ? (
        <ThemedView style={styles.documentPickerContainer}>
          <View style={styles.documentPickerHeader}>
            <ThemedText style={styles.documentPickerTitle}>
              Select a Resume
            </ThemedText>
            <Pressable 
              style={styles.closeButton}
              onPress={() => setShowDocumentPicker(false)}
            >
              <Feather name="x" size={18} color={textColor} />
            </Pressable>
          </View>
          
          <DocumentManager 
            userId={user?.id}
            documentType={DocumentType.CV}
            selectable
            onSelect={handleSelectResume}
          />
        </ThemedView>
      ) : (
        <>
          <ThemedView style={styles.formSection}>
            <ThemedText style={styles.label}>Resume</ThemedText>
            
            {selectedResume ? (
              <View style={styles.selectedResumeContainer}>
                <DocumentCard document={selectedResume} />
                <Pressable
                  style={styles.changeResumeButton}
                  onPress={() => setShowDocumentPicker(true)}
                >
                  <ThemedText style={styles.changeResumeText}>Change Resume</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.selectResumeButton, { borderColor }]}
                onPress={() => setShowDocumentPicker(true)}
                disabled={loading || documentsLoading}
              >
                {documentsLoading ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <>
                    <Feather name="file-text" size={18} color={textColor} />
                    <ThemedText style={styles.selectResumeText}>
                      Select Resume
                    </ThemedText>
                  </>
                )}
              </Pressable>
            )}
          </ThemedView>
          
          <ThemedView style={styles.formSection}>
            <ThemedText style={styles.label}>Cover Letter (Optional)</ThemedText>
            <ThemedInput
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder="Tell us why you're a good fit for this position..."
              multiline
              numberOfLines={8}
              style={styles.coverLetterInput}
            />
          </ThemedView>
          
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.cancelButton, { borderColor }]}
              onPress={onCancel}
              disabled={loading}
            >
              <ThemedText>Cancel</ThemedText>
            </Pressable>
            
            <Pressable
              style={[
                styles.submitButton, 
                { 
                  opacity: loading || !selectedResume ? 0.7 : 1,
                  backgroundColor: !selectedResume ? '#9ca3af' : '#3b82f6',
                }
              ]}
              onPress={handleSubmit}
              disabled={loading || !selectedResume}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>
                  Submit Application
                </ThemedText>
              )}
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  formSection: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectResumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  selectResumeText: {
    fontSize: 16,
  },
  selectedResumeContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  changeResumeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  changeResumeText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  coverLetterInput: {
    width: '100%',
    minHeight: 160,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  documentPickerContainer: {
    flex: 1,
    minHeight: 400,
  },
  documentPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  documentPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
});