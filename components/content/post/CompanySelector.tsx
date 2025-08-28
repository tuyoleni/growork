import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import Button from "@/components/ui/Button";
import { useCompanies, useThemeColor } from "@/hooks";
import { Feather } from "@expo/vector-icons";
import { Company } from "@/types";
import {
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from "@/constants/DesignSystem";

export interface CompanySelectorData {
  company: string;
  companyId?: string;
}

interface CompanySelectorProps {
  values: CompanySelectorData;
  onChange: (values: CompanySelectorData) => void;
  style?: any;
}

export default function CompanySelector({
  values,
  onChange,
  style,
}: CompanySelectorProps) {
  const { companies } = useCompanies();
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const textColor = useThemeColor({}, "text");
  const mutedTextColor = useThemeColor({}, "mutedText");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const tintColor = useThemeColor({}, "tint");

  const handleCompanySelect = (company: Company) => {
    onChange({
      company: company.name,
      companyId: company.id,
    });
    setShowCompanySelector(false);
  };

  const selectedCompany = companies.find((c) => c.id === values.companyId);

  return (
    <View style={[styles.container, style]}>
      <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
        Company
      </ThemedText>

      <TouchableOpacity
        style={[styles.selectorButton, { borderColor }]}
        onPress={() => setShowCompanySelector(true)}
      >
        <ThemedText style={[styles.selectorText, { color: textColor }]}>
          {selectedCompany ? selectedCompany.name : "Select Company"}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={mutedTextColor} />
      </TouchableOpacity>

      {/* Enhanced Company Selector Modal */}
      <Modal
        visible={showCompanySelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor }]}>
          <StatusBar barStyle="dark-content" />

          {/* Enhanced Modal Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: borderColor }]}
          >
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowCompanySelector(false)}
            >
              <ThemedText
                style={[styles.modalButtonText, { color: tintColor }]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Select Company
            </ThemedText>

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
                  size={48}
                  image={
                    item.logo_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      item.name
                    )}&size=48&background=2563eb&color=ffffff`
                  }
                />
                <View style={styles.companyItemInfo}>
                  <ThemedText
                    style={[styles.companyItemName, { color: textColor }]}
                  >
                    {item.name}
                  </ThemedText>
                  {item.industry && (
                    <ThemedText
                      style={[
                        styles.companyItemMeta,
                        { color: mutedTextColor },
                      ]}
                    >
                      {item.industry}
                    </ThemedText>
                  )}
                </View>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={mutedTextColor}
                />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  selectedCompany: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  companyMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginTop: Spacing.xs,
  },
  metaChipText: {
    fontSize: Typography.xs,
    color: "gray",
  },
  chevronContainer: {
    marginLeft: Spacing.sm,
  },
  selectCompanyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  buttonSubtitle: {
    fontSize: Typography.sm,
    color: "gray",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  modalButton: {
    padding: Spacing.sm,
  },
  modalButtonText: {
    fontSize: Typography.base,
  },
  modalContent: {
    paddingVertical: Spacing.sm,
  },
  companyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  companyItemInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  companyItemName: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  companyItemMeta: {
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm, // not fully round, just slightly
  },
});
