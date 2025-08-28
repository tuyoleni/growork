import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth, useThemeColor, useCompanies } from "@/hooks";
import { Colors, Spacing, BorderRadius } from "@/constants/DesignSystem";
import { Company, CompanyFormData } from "@/types";
import { STORAGE_BUCKETS, uploadImage } from "@/utils/uploadUtils";
import { ThemedText } from "@/components/ThemedText";
import { ThemedAvatar } from "@/components/ui/ThemedAvatar";
import { ThemedIconButton } from "@/components/ui/ThemedIconButton";
import SettingsList from "@/components/ui/SettingsList";
import ScreenContainer from "@/components/ScreenContainer";

const CompanyManagement = () => {
  const router = useRouter();
  const { id, prefillName, prefillIndustry, prefillLocation } =
    useLocalSearchParams<{
      id?: string;
      prefillName?: string;
      prefillIndustry?: string;
      prefillLocation?: string;
    }>();

  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedLogoUri, setSelectedLogoUri] = useState<string | null>(null);

  const [editedCompany, setEditedCompany] = useState<CompanyFormData>({
    name: "",
    description: "",
    website: "",
    industry: "",
    size: "",
    founded_year: "",
    location: "",
  });

  // Get theme colors
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");

  const { getCompanyById, createCompany, updateCompany, updateCompanyLogo } =
    useCompanies();

  // Create styles with theme colors
  const styles = createStyles({
    tintColor,
    backgroundColor,
    textColor,
    borderColor,
    mutedTextColor,
  });

  // Load company if `id` exists, otherwise prefill from route
  useEffect(() => {
    const init = async () => {
      if (id) {
        const result = await getCompanyById(id);
        if (!result || (result as any).error) return;
        const { company: dbCompany } = result as { company: Company };
        if (dbCompany) {
          setCompany(dbCompany);
          setEditedCompany({
            name: dbCompany.name || "",
            description: dbCompany.description || "",
            website: dbCompany.website || "",
            industry: dbCompany.industry || "",
            size: dbCompany.size || "",
            founded_year: dbCompany.founded_year?.toString() || "",
            location: dbCompany.location || "",
          });
          return;
        }
      }
      if (!id) {
        setEditedCompany((prev) => ({
          ...prev,
          name:
            prefillName && typeof prefillName === "string"
              ? decodeURIComponent(prefillName)
              : prev.name,
          industry:
            prefillIndustry && typeof prefillIndustry === "string"
              ? decodeURIComponent(prefillIndustry)
              : prev.industry,
          location:
            prefillLocation && typeof prefillLocation === "string"
              ? decodeURIComponent(prefillLocation)
              : prev.location,
        }));
      }
    };
    init();
  }, [id, prefillName, prefillIndustry, prefillLocation]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const foundedYearInput = (editedCompany.founded_year || "").trim();
      const parsedYear = foundedYearInput
        ? parseInt(foundedYearInput, 10)
        : NaN;
      const foundedYearValue = Number.isFinite(parsedYear) ? parsedYear : null;

      const companyData = {
        ...editedCompany,
        founded_year: foundedYearValue,
        user_id: user.id,
      };

      if (id) {
        // Update existing
        const res = await updateCompany(id, companyData);
        if ((res as any).error) throw new Error((res as any).error);
        if (selectedLogoUri) {
          const publicUrl = await uploadImage({
            bucket: STORAGE_BUCKETS.AVATARS,
            userId: user.id,
            uri: selectedLogoUri,
            fileNamePrefix: "company-logo",
          });
          if (!publicUrl) throw new Error("Failed to upload logo");
          await updateCompanyLogo(id, publicUrl);
          setCompany((prev) =>
            prev ? { ...prev, logo_url: publicUrl } : prev
          );
        }
      } else {
        // Create new
        const res = await createCompany(companyData);
        if ((res as any).error) throw new Error((res as any).error);
        const newCompany = (res as any).company as Company | undefined;
        if (newCompany && selectedLogoUri) {
          const publicUrl = await uploadImage({
            bucket: STORAGE_BUCKETS.AVATARS,
            userId: user.id,
            uri: selectedLogoUri,
            fileNamePrefix: "company-logo",
          });
          if (!publicUrl) throw new Error("Failed to upload logo");
          await updateCompanyLogo(newCompany.id, publicUrl);
        }
      }

      Alert.alert("Success", `Company ${id ? "updated" : "created"}!`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.message || `Failed to save company`);
      Alert.alert("Error", e.message || `Failed to save company`);
    } finally {
      setLoading(false);
    }
  };

  const pickLogo = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    try {
      const uri = result.assets[0].uri;
      if (company) {
        const publicUrl = await uploadImage({
          bucket: STORAGE_BUCKETS.AVATARS,
          userId: user.id,
          uri,
          fileNamePrefix: "company-logo",
        });
        if (!publicUrl) throw new Error("Failed to upload logo");
        await updateCompanyLogo(company.id, publicUrl);
        setCompany({ ...company, logo_url: publicUrl });
        Alert.alert("Success", "Company logo updated!");
      } else {
        setSelectedLogoUri(uri);
      }
    } catch (e: any) {
      setError(e.message || "Failed to update logo");
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading company...</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StatusBar barStyle="dark-content" />

      {/* Simple Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedIconButton
          icon={<Feather name="arrow-left" size={24} color={textColor} />}
          onPress={() => router.back()}
        />

        <ThemedText
          type="title"
          style={[styles.headerTitle, { color: textColor }]}
        >
          {id ? "Edit Company" : "Create Company"}
        </ThemedText>

        <TouchableOpacity
          style={[styles.saveButton, { opacity: loading ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Logo picker */}
      <Pressable onPress={pickLogo} style={styles.logoPicker}>
        <ThemedAvatar
          image={
            selectedLogoUri ||
            company?.logo_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              editedCompany.name || "Company"
            )}&size=80`
          }
          size={80}
        >
          <View style={[styles.logoOverlay, { backgroundColor: tintColor }]}>
            <Feather name="camera" size={16} color={backgroundColor} />
          </View>
        </ThemedAvatar>
      </Pressable>

      {/* Editable fields */}
      <SettingsList
        sections={[
          {
            title: "Basic Information",
            data: [
              {
                title: "Company Name",
                subtitle: editedCompany.name || "Not set",
                icon: "building",
                showTextInput: true,
                textInputValue: editedCompany.name,
                textInputPlaceholder: "Enter company name",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, name: text })),
              },
              {
                title: "Description",
                subtitle: editedCompany.description || "No description",
                icon: "file-text",
                showTextInput: true,
                textInputValue: editedCompany.description,
                textInputPlaceholder: "Describe your company...",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, description: text })),
                textInputProps: { multiline: true, numberOfLines: 3 },
              },
              {
                title: "Industry",
                subtitle: editedCompany.industry || "Not set",
                icon: "briefcase",
                showTextInput: true,
                textInputValue: editedCompany.industry,
                textInputPlaceholder: "e.g., Technology, Healthcare",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, industry: text })),
              },
            ],
          },
          {
            title: "Company Details",
            data: [
              {
                title: "Website",
                subtitle: editedCompany.website || "Not set",
                icon: "globe",
                showTextInput: true,
                textInputValue: editedCompany.website,
                textInputPlaceholder: "https://example.com",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, website: text })),
              },
              {
                title: "Company Size",
                subtitle: editedCompany.size || "Not set",
                icon: "users",
                showTextInput: true,
                textInputValue: editedCompany.size,
                textInputPlaceholder: "e.g., 1-10, 51-200",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, size: text })),
              },
              {
                title: "Founded Year",
                subtitle: editedCompany.founded_year || "Not set",
                icon: "calendar",
                showTextInput: true,
                textInputValue: editedCompany.founded_year,
                textInputPlaceholder: "e.g., 2020",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, founded_year: text })),
                textInputProps: { keyboardType: "numeric" },
              },
              {
                title: "Location",
                subtitle: editedCompany.location || "Not set",
                icon: "map-pin",
                showTextInput: true,
                textInputValue: editedCompany.location,
                textInputPlaceholder: "City, Country",
                onTextInputChange: (text: string) =>
                  setEditedCompany((p) => ({ ...p, location: text })),
              },
            ],
          },
        ]}
      />

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}
    </ScreenContainer>
  );
};

// Define styles with theme colors
const createStyles = (themeColors: {
  tintColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  mutedTextColor: string;
}) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      marginHorizontal: 16,
    },
    saveButton: {
      minWidth: 60,
      height: 36,
      backgroundColor: themeColors.tintColor,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: BorderRadius.md,
      paddingHorizontal: 12,
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl,
    },
    loadingText: {
      marginTop: Spacing.md,
      color: themeColors.mutedTextColor,
    },
    logoPicker: {
      alignSelf: "center",
      marginVertical: Spacing.xl,
    },
    logoOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      backgroundColor: "#FEE2E2",
      padding: Spacing.md,
      margin: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    errorText: {
      color: Colors.error,
      textAlign: "center",
    },
  });

export default CompanyManagement;
