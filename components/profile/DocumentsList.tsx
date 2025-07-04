import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, TouchableOpacity } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import DocumentMenu from './DocumentMenu';
import DocumentUploadSheet from './DocumentUploadSheet';
import { useDocumentUpload } from './useDocumentUpload';

const DATA = [
  {
    name: 'Resume_2024.pdf',
    updated: 'Updated 2 days ago',
    category: 'CV',
  },
  {
    name: 'Portfolio_2024.pdf',
    updated: 'Updated 1 week ago',
    category: 'CV',
  },
  {
    name: 'CoverLetter_2024.pdf',
    updated: 'Updated 3 days ago',
    category: 'Cover Letter',
  },
  {
    name: 'Certificate_React.pdf',
    updated: 'Updated 2 months ago',
    category: 'Certificate',
  },
  {
    name: 'Certificate_AWS.pdf',
    updated: 'Updated 5 months ago',
    category: 'Certificate',
  },
];

const CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

const MODAL_CATEGORIES = ['CV', 'Cover Letter', 'Certificate'];

function IconWithBackground({ icon }: { icon: React.ReactElement }) {
  const borderColor = useThemeColor({}, 'border');
  return (
    <ThemedView style={[styles.iconBg, { backgroundColor: borderColor + '22' }]}> 
      {React.isValidElement(icon) ? icon : null}
    </ThemedView>
  );
}

function DocumentsListInner() {
  const {
    documents,
    setDocuments,
    borderColor,
    backgroundColor,
    textColor,
    dismiss,
  } = useDocumentUpload();
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState(MODAL_CATEGORIES[0]);
  const [file, setFile] = useState<{ name: string; uri: string; mimeType: string } | null>(null);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setFile({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType });
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  const handleAddDocument = () => {
    if (!file) {
      alert('Please select a PDF file.');
      return;
    }
    setPendingDocs(prev => [
      ...prev,
      {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        category,
        updated: 'Just now',
      },
    ]);
    setFile(null);
  };

  const handleContinue = () => {
    setDocuments((prev: any[]) => [
      ...pendingDocs,
      ...prev,
    ]);
    setPendingDocs([]);
    setFile(null);
    setModalVisible(false);
    bottomSheetRef.current?.dismiss();
    dismiss();
  };

  const openModal = () => {
    setModalVisible(true);
    setTimeout(() => {
      bottomSheetRef.current?.present();
    }, 0);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFile(null);
    setPendingDocs([]);
    bottomSheetRef.current?.dismiss();
    dismiss();
  };

  const handlePickPdfForType = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.mimeType === 'application/pdf') {
          setPendingDocs(prev => [
            ...prev,
            {
              name: asset.name,
              uri: asset.uri,
              mimeType: asset.mimeType,
              category: docType,
              updated: 'Just now',
            },
          ]);
        } else {
          alert('Please select a PDF file.');
        }
      }
    } catch (e) {
      alert('An error occurred while picking the file.');
    }
  };

  // Restore old layout: filter by selected category
  const filteredData = documents.filter((doc: { category: string }) => doc.category === category);

  return (
    <>
      {/* Category Selector (old layout) */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 8 }}>
        {MODAL_CATEGORIES.map((cat) => {
          const selected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: selected ? textColor : borderColor,
                marginHorizontal: 4,
              }}
            >
              <ThemedText style={{ color: selected ? backgroundColor : textColor, fontWeight: 'bold' }}>{cat}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Count and Add Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 4 }}>
        <ThemedText style={{ fontSize: 15, color: borderColor }}>{filteredData.length} {category}</ThemedText>
        <TouchableOpacity
          style={{ backgroundColor: textColor, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, alignItems: 'center' }}
          onPress={openModal}
        >
          <ThemedText style={{ fontSize: 15, color: backgroundColor, fontWeight: 'bold' }}>Add Document</ThemedText>
        </TouchableOpacity>
      </View>
      {/* Main List of Documents (filtered) */}
      <ThemedView style={styles.list}>
        {filteredData.map((item: { name: string; updated: string; category: string; note?: string }, idx: number) => (
          <ThemedView
            key={item.name + idx}
            style={[
              styles.card,
              idx !== filteredData.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
              { backgroundColor },
            ]}
          >
            <IconWithBackground icon={<Feather name="file-text" size={24} color={textColor} />} />
            <ThemedView style={styles.cardTextWrap}>
              <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
              {item.note && (
                <ThemedText style={[styles.cardSubtitle, { color: textColor, opacity: 0.6 }]}>{item.note}</ThemedText>
              )}
              <ThemedText style={[styles.cardSubtitle, { color: textColor, opacity: 0.6 }]}>{item.updated}</ThemedText>
            </ThemedView>
            <DocumentMenu
              onDownload={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // handle download
              }}
              onShare={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // handle share
              }}
              onDelete={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // handle delete
              }}
            />
          </ThemedView>
        ))}
      </ThemedView>
      {/* Modal remains unchanged below */}
      <BottomSheetModal
        ref={bottomSheetRef}
        onDismiss={closeModal}
        snapPoints={['80%']}
        backgroundStyle={{ backgroundColor }}
      >
        <DocumentUploadSheet
          pendingDocs={pendingDocs}
          setPendingDocs={setPendingDocs}
          handleContinue={handleContinue}
          closeModal={closeModal}
          borderColor={borderColor}
          backgroundColor={backgroundColor}
          textColor={textColor}
          MODAL_CATEGORIES={MODAL_CATEGORIES}
        />
      </BottomSheetModal>
    </>
  );
}

export default function DocumentsList() {
  return <DocumentsListInner />;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 8,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 15,
    color: '#888',
    marginRight: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  uploadText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  list: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  cardTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 0,
  },
  categoryBadgeText: {
    marginLeft: 0,
    fontSize: 14,
  },
}); 