import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
import { useCompanies , useThemeColor } from '@/hooks';
import { Feather } from '@expo/vector-icons';
import { Company } from '@/types';

export interface CompanySelectorData {
  company: string;
  companyId?: string;
}

interface CompanySelectorProps {
  values: CompanySelectorData;
  onChange: (values: CompanySelectorData) => void;
  style?: any;
}

export default function CompanySelector({ values, onChange, style }: CompanySelectorProps) {
  const { companies } = useCompanies();
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const handleCompanySelect = (company: Company) => {
    onChange({
      company: company.name,
      companyId: company.id,
    });
    setShowCompanySelector(false);
  };

  const selectedCompany = companies.find(c => c.id === values.companyId);

  return (
    <View style={[styles.container, style]}>
      <ThemedText style={[styles.sectionLabel, { color: textColor }]}>Company</ThemedText>

      {selectedCompany ? (
        // Show selected company with details
        <TouchableOpacity
          style={[styles.selectedCompany, { borderColor }]}
          onPress={() => setShowCompanySelector(true)}
        >
          <ThemedAvatar
            size={40}
            image={selectedCompany.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCompany.name)}&size=40`}
          />
          <View style={styles.companyInfo}>
            <ThemedText style={[styles.companyName, { color: textColor }]}>
              {selectedCompany.name}
            </ThemedText>
            <View style={styles.companyMeta}>
              {selectedCompany.industry && (
                <ThemedText style={[styles.companyMetaText, { color: mutedTextColor }]}>
                  {selectedCompany.industry}
                </ThemedText>
              )}
              {selectedCompany.location && (
                <ThemedText style={[styles.companyMetaText, { color: mutedTextColor }]}>
                  {selectedCompany.location}
                </ThemedText>
              )}
            </View>
          </View>
          <Feather name="chevron-down" size={16} color={mutedTextColor} />
        </TouchableOpacity>
      ) : (
        // Show company selector button
        <TouchableOpacity
          style={[styles.selectCompanyButton, { borderColor }]}
          onPress={() => setShowCompanySelector(true)}
        >
          <Feather name="briefcase" size={16} color={textColor} />
          <ThemedText style={[styles.selectCompanyText, { color: textColor }]}>
            Select from my companies
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Company Selector Modal */}
      <Modal
        visible={showCompanySelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowCompanySelector(false)}>
              <ThemedText style={[styles.modalButton, { color: textColor }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Company</ThemedText>
            <View style={{ width: 60 }} />
          </View>

          <FlatList
            data={companies}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.companyItem, { borderBottomColor: borderColor }]}
                onPress={() => handleCompanySelect(item)}
              >
                <ThemedAvatar
                  size={50}
                  image={item.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=50`}
                />
                <View style={styles.companyItemInfo}>
                  <ThemedText style={[styles.companyItemName, { color: textColor }]}>
                    {item.name}
                  </ThemedText>
                  {item.description && (
                    <ThemedText style={[styles.companyItemDescription, { color: mutedTextColor }]} numberOfLines={2}>
                      {item.description}
                    </ThemedText>
                  )}
                  <View style={styles.companyItemMeta}>
                    {item.industry && (
                      <ThemedText style={[styles.companyItemMetaText, { color: mutedTextColor }]}>
                        {item.industry}
                      </ThemedText>
                    )}
                    {item.location && (
                      <ThemedText style={[styles.companyItemMetaText, { color: mutedTextColor }]}>
                        {item.location}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalContent}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  companyMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  companyMetaText: {
    fontSize: 12,
  },
  selectCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  selectCompanyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    padding: 16,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  companyItemInfo: {
    flex: 1,
  },
  companyItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  companyItemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  companyItemMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  companyItemMetaText: {
    fontSize: 12,
  },
}); 