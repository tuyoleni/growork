import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useApplications } from '@/hooks/useApplications';
import { useDocuments } from '@/hooks/useDocuments';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Document, DocumentType, Post } from '@/types';
import { ThemedInput } from '../ThemedInput';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import DocumentCard from './DocumentCard';
import DocumentManager from './DocumentManager';

const steps = [
  { id: 1, title: 'Resume Selection' },
  { id: 2, title: 'Cover Letter' },
  { id: 3, title: 'Review & Submit' }
];

type Props = {
  jobPost: Post;
  onSuccess?: () => void;
};

export function useJobApplicationForm({ jobPost, onSuccess }: Props) {
  const { user } = useAuth();
  const { addApplication } = useApplications();
  const { loading: documentsLoading, fetchDocuments } = useDocuments(user?.id);

  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResume, setSelectedResume] = useState<Document | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const primaryColor = '#3b82f6';

  // Fetch resumes on mount/user change
  useEffect(() => {
    if (user?.id) fetchDocuments(DocumentType.CV);
  }, [fetchDocuments, user?.id]);

  // Animate step progress
  useEffect(() => {
    const newProgress = (currentStep - 1) / (steps.length - 1);
    Animated.timing(progressAnimation, {
      toValue: newProgress,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentStep, progressAnimation]);

  // -- Resume select handler
  const handleSelectResume = (document: Document) => {
    setSelectedResume(document);
    setShowDocumentPicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // -- Step navigation
  const next = () => {
    if (currentStep === 1 && !selectedResume) return;
    setCurrentStep((s) => Math.min(steps.length, s + 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const back = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // -- Submit handler
  const submit = async () => {
    if (!user || !selectedResume) return;
    setLoading(true);
    try {
      const { error } = await addApplication({
        user_id: user.id,
        post_id: jobPost.id,
        resume_id: selectedResume.id,
        resume_url: selectedResume.file_url,
        cover_letter: coverLetter.trim() || null
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  // --- Header
  const header = (
    <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>
      Apply for: {jobPost.title}
    </ThemedText>
  );

  // --- Step Indicators
  const stepIndicators = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <Pressable
            style={{
              width: 32, height: 32, borderRadius: 16,
              borderWidth: 2, alignItems: 'center', justifyContent: 'center',
              borderColor: currentStep >= step.id ? primaryColor : borderColor
            }}
            onPress={() => step.id < currentStep && setCurrentStep(step.id)}
          >
            <ThemedText style={{ fontSize: 14, fontWeight: '600', color: currentStep >= step.id ? primaryColor : textColor }}>
              {step.id}
            </ThemedText>
          </Pressable>
          {idx < steps.length - 1 && (
            <View style={{ flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 }}>
              <Animated.View
                style={{
                  height: '100%',
                  width: progressAnimation.interpolate({
                    inputRange: [idx / (steps.length-1), (idx+1) / (steps.length-1)],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: primaryColor
                }}
              />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // --- Main body logic
  let body: React.ReactNode;
  if (showDocumentPicker) {
    body = (
      <ThemedView style={{ flex: 1, minHeight: 400 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>Select a Resume</ThemedText>
          <Pressable style={{ padding: 8, borderRadius: 20 }} onPress={() => setShowDocumentPicker(false)}>
            <Feather name="x" size={18} color={textColor} />
          </Pressable>
        </View>
        <DocumentManager 
          userId={user?.id} 
          documentType={DocumentType.CV} 
          selectable 
          onSelect={handleSelectResume}
          disableScrolling={true}
        />
      </ThemedView>
    );
  } else {
    body = (
      <>
        {stepIndicators}
        {currentStep === 1 && (
          <ThemedView style={{ gap: 12 }}>
            {selectedResume ? (
              <View>
                <DocumentCard document={selectedResume} />
                <Pressable onPress={() => setShowDocumentPicker(true)} style={{ alignSelf: 'flex-end', padding: 8 }}>
                  <ThemedText style={{ fontSize: 14, textDecorationLine: 'underline' }}>Change Resume</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, borderColor }}
                onPress={() => setShowDocumentPicker(true)}
                disabled={loading || documentsLoading}
              >
                {documentsLoading ? (
                  <ActivityIndicator size="small" color={textColor} />
                ) : (
                  <>
                    <Feather name="file-text" size={18} color={textColor} />
                    <ThemedText style={{ fontSize: 16 }}>Select Resume</ThemedText>
                  </>
                )}
              </Pressable>
            )}
          </ThemedView>
        )}
        {currentStep === 2 && (
          <ThemedInput
            value={coverLetter}
            onChangeText={setCoverLetter}
            placeholder="Tell us why you're a good fit..."
            multiline
            numberOfLines={8}
            style={{ width: '100%', minHeight: 160, textAlignVertical: 'top', paddingTop: 12 }}
          />
        )}
        {currentStep === 3 && (
          <ThemedView style={{ gap: 16 }}>
            <ThemedText>Position: {jobPost.title}</ThemedText>
            <ThemedText>Resume:</ThemedText>
            {selectedResume && <DocumentCard document={selectedResume} showMenu={false} />}
            <ThemedText>Cover Letter:</ThemedText>
            {coverLetter ? (
              <ThemedView style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <ThemedText>{coverLetter}</ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={{ fontStyle: 'italic', opacity: 0.6 }}>No cover letter provided</ThemedText>
            )}
          </ThemedView>
        )}
      </>
    );
  }

  // --- Footer (navigation controls)
  let footer: React.ReactNode = null;
  if (!showDocumentPicker) {
    footer = (
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
        {currentStep > 1 && (
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor }}
            onPress={back}
            disabled={loading}
          >
            <Feather name="chevron-left" size={18} color={textColor} />
            <ThemedText>Back</ThemedText>
          </Pressable>
        )}
        {currentStep < steps.length ? (
          <Pressable
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8,
              backgroundColor: primaryColor, opacity: (currentStep === 1 && !selectedResume) ? 0.7 : 1
            }}
            onPress={next}
            disabled={(currentStep === 1 && !selectedResume) || loading}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Next</ThemedText>
            <Feather name="chevron-right" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8,
              backgroundColor: primaryColor
            }}
            onPress={submit}
            disabled={loading || !selectedResume}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Submit Application</ThemedText>
                <Feather name="check" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  }

  return { header, body, footer };
}